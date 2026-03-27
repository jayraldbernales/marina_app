import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  AppState,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router, useFocusEffect } from "expo-router";
import { COLORS } from "@/constants";
import { RiderDeliveryStyles } from "./styles/riderDeliveryStyles";
import { supabase } from "@/lib/supabase";
import {
  deliveryService,
  Delivery,
  DatabaseDeliveryStatus,
  UITabStatus,
} from "@/services/deliveryService";
import { locationService } from "@/services/locationService";
import { dispatchService } from "@/services/dispatchService";
import { useRiderDeliveryContext } from "@/contexts/RiderDeliveryContext";
import * as ImagePicker from "expo-image-picker";
import { createNotificationWithPush } from "@/services/notificationService";
import { ReportModal } from "@/components/ReportModal";

// Map UI tabs to database statuses (for filtering)
const tabToStatuses: Record<UITabStatus, DatabaseDeliveryStatus[]> = {
  "to-pickup": ["assigned", "pending", "ready_to_pickup"],
  "in-transit": ["picked_up"],
  delivered: ["delivered"],
  failed: ["failed"],
  canceled: ["cancelled", "rejected"],
};

// Memoized Tracking Indicator Component
const TrackingIndicator = React.memo(
  ({ isTracking }: { isTracking: boolean }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: isTracking ? "#e8f5e9" : "#ffebee",
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: isTracking ? "#4caf50" : "#f44336",
          marginRight: 8,
        }}
      />
      <Text
        style={{
          fontSize: 12,
          color: isTracking ? "#2e7d32" : "#c62828",
        }}
      >
        {isTracking ? "Location tracking active" : "Location tracking off"}
      </Text>
    </View>
  ),
);

// Receipt Modal Component
const ReceiptModal = ({
  visible,
  onClose,
  delivery,
  riderId,
}: {
  visible: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  riderId: string | null;
}) => {
  if (!delivery) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={S.modalOverlay}>
        <View style={[S.modalContent, { maxHeight: "90%" }]}>
          {/* Header */}
          <View style={S.modalHeader}>
            <Text style={S.modalTitle}>Delivery Receipt</Text>
            <TouchableOpacity style={S.modalCloseButton} onPress={onClose}>
              <Ionicons name="close" size={16} color="#555" />
            </TouchableOpacity>
          </View>

          <ScrollView style={S.modalBody} showsVerticalScrollIndicator={false}>
            {/* Receipt Header */}
            <View style={RiderDeliveryStyles.receiptHeader}>
              <Ionicons
                name="receipt-outline"
                size={40}
                color={COLORS.light.primary}
              />
              <Text style={RiderDeliveryStyles.receiptTitle}>
                DELIVERY RECEIPT
              </Text>
              <Text style={RiderDeliveryStyles.receiptNumber}>
                #{delivery.order_number}
              </Text>
            </View>

            {/* Date & Time */}
            <View style={RiderDeliveryStyles.receiptSection}>
              <View style={RiderDeliveryStyles.receiptRow}>
                <Text style={RiderDeliveryStyles.receiptLabel}>
                  Delivery Date:
                </Text>
                <Text style={RiderDeliveryStyles.receiptValue}>
                  {new Date().toLocaleDateString()}{" "}
                  {new Date().toLocaleTimeString()}
                </Text>
              </View>
              <View style={RiderDeliveryStyles.receiptRow}>
                <Text style={RiderDeliveryStyles.receiptLabel}>Scheduled:</Text>
                <Text style={RiderDeliveryStyles.receiptValue}>
                  {delivery.scheduled_date}
                </Text>
              </View>
            </View>

            {/* Rider Info */}
            <View style={RiderDeliveryStyles.receiptSection}>
              <Text style={RiderDeliveryStyles.receiptSectionTitle}>
                Rider Details
              </Text>
              <View style={RiderDeliveryStyles.receiptCard}>
                <View style={RiderDeliveryStyles.receiptRow}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={RiderDeliveryStyles.receiptLabel}>
                    Rider ID:
                  </Text>
                  <Text style={RiderDeliveryStyles.receiptValue}>
                    {riderId?.slice(0, 8)}...
                  </Text>
                </View>
                {/* Add rider name if available */}
              </View>
            </View>

            {/* Customer Info */}
            <View style={RiderDeliveryStyles.receiptSection}>
              <Text style={RiderDeliveryStyles.receiptSectionTitle}>
                Customer Details
              </Text>
              <View style={RiderDeliveryStyles.receiptCard}>
                <Text style={RiderDeliveryStyles.receiptCustomerName}>
                  {delivery.customer_name}
                </Text>
                <View style={RiderDeliveryStyles.receiptRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={RiderDeliveryStyles.receiptAddress}>
                    {delivery.delivery_address}
                  </Text>
                </View>
                {delivery.customer_phone &&
                  delivery.customer_phone !== "No phone" && (
                    <View style={RiderDeliveryStyles.receiptRow}>
                      <Ionicons name="call-outline" size={16} color="#666" />
                      <Text style={RiderDeliveryStyles.receiptPhone}>
                        {delivery.customer_phone}
                      </Text>
                    </View>
                  )}
              </View>
            </View>

            {/* Vendor Info */}
            <View style={RiderDeliveryStyles.receiptSection}>
              <Text style={RiderDeliveryStyles.receiptSectionTitle}>
                Pickup Location
              </Text>
              <View style={RiderDeliveryStyles.receiptCard}>
                <Text style={RiderDeliveryStyles.receiptVendorName}>
                  {delivery.vendor_name}
                </Text>
                <View style={RiderDeliveryStyles.receiptRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={RiderDeliveryStyles.receiptAddress}>
                    {delivery.vendor_address}
                  </Text>
                </View>
                {delivery.vendor_phone && (
                  <View style={RiderDeliveryStyles.receiptRow}>
                    <Ionicons name="call-outline" size={16} color="#666" />
                    <Text style={RiderDeliveryStyles.receiptPhone}>
                      {delivery.vendor_phone}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Items */}
            <View style={RiderDeliveryStyles.receiptSection}>
              <Text style={RiderDeliveryStyles.receiptSectionTitle}>
                Items Delivered
              </Text>
              <View style={RiderDeliveryStyles.receiptItemsCard}>
                {delivery.items.map((item, index) => (
                  <View key={item.id}>
                    <View style={RiderDeliveryStyles.receiptItemRow}>
                      <View style={RiderDeliveryStyles.receiptItemInfo}>
                        <Text style={RiderDeliveryStyles.receiptItemName}>
                          {item.name}
                        </Text>
                        <Text style={RiderDeliveryStyles.receiptItemVendor}>
                          {item.vendor}
                        </Text>
                      </View>
                      <View style={RiderDeliveryStyles.receiptItemQuantity}>
                        <Text style={RiderDeliveryStyles.receiptItemQtyText}>
                          x{item.quantity}
                        </Text>
                      </View>
                      <Text style={RiderDeliveryStyles.receiptItemPrice}>
                        ₱{(item.price * item.quantity).toLocaleString()}
                      </Text>
                    </View>
                    {index < delivery.items.length - 1 && (
                      <View style={RiderDeliveryStyles.receiptDivider} />
                    )}
                  </View>
                ))}
              </View>
            </View>

            {/* Price Summary */}
            <View style={RiderDeliveryStyles.receiptSection}>
              <Text style={RiderDeliveryStyles.receiptSectionTitle}>
                Payment Summary
              </Text>
              <View style={RiderDeliveryStyles.receiptSummaryCard}>
                <View style={RiderDeliveryStyles.receiptSummaryRow}>
                  <Text style={RiderDeliveryStyles.receiptSummaryLabel}>
                    Subtotal
                  </Text>
                  <Text style={RiderDeliveryStyles.receiptSummaryValue}>
                    ₱{(delivery.subtotal || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={RiderDeliveryStyles.receiptSummaryRow}>
                  <Text style={RiderDeliveryStyles.receiptSummaryLabel}>
                    Delivery Fee
                  </Text>
                  <Text style={RiderDeliveryStyles.receiptSummaryValue}>
                    ₱{(delivery.delivery_fee || 0).toLocaleString()}
                  </Text>
                </View>
                <View
                  style={[
                    RiderDeliveryStyles.receiptSummaryRow,
                    RiderDeliveryStyles.receiptTotalRow,
                  ]}
                >
                  <Text style={RiderDeliveryStyles.receiptTotalLabel}>
                    TOTAL AMOUNT
                  </Text>
                  <Text style={RiderDeliveryStyles.receiptTotalValue}>
                    ₱{delivery.total_amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Status */}
            <View style={RiderDeliveryStyles.receiptSection}>
              <View style={RiderDeliveryStyles.receiptStatusCard}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <View style={RiderDeliveryStyles.receiptStatusInfo}>
                  <Text style={RiderDeliveryStyles.receiptStatusLabel}>
                    Payment Status
                  </Text>
                  <Text style={RiderDeliveryStyles.receiptStatusValue}>
                    Paid on Delivery
                  </Text>
                </View>
              </View>
            </View>

            {/* Proof of Delivery */}
            {delivery.delivered_proof_url && (
              <View style={RiderDeliveryStyles.receiptSection}>
                <Text style={RiderDeliveryStyles.receiptSectionTitle}>
                  Proof of Delivery
                </Text>
                <TouchableOpacity
                  style={RiderDeliveryStyles.receiptProofContainer}
                  onPress={() => Linking.openURL(delivery.delivered_proof_url!)}
                >
                  <Image
                    source={{ uri: delivery.delivered_proof_url }}
                    style={RiderDeliveryStyles.receiptProofImage}
                    resizeMode="cover"
                  />
                  <View style={RiderDeliveryStyles.receiptProofOverlay}>
                    <Ionicons name="eye-outline" size={20} color="#fff" />
                    <Text style={RiderDeliveryStyles.receiptProofText}>
                      View Photo
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Footer Notes */}
            <View style={RiderDeliveryStyles.receiptFooter}>
              <Text style={RiderDeliveryStyles.receiptFooterText}>
                Thank you for your business!
              </Text>
              <Text style={RiderDeliveryStyles.receiptFooterSmall}>
                This serves as your official delivery receipt
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Send notification to vendor about delivery status
const notifyVendorDeliveryUpdate = async (
  vendorUserId: string,
  deliveryId: string,
  orderNumber: string,
  status: string,
  message: string,
) => {
  try {
    await createNotificationWithPush(
      {
        userId: vendorUserId,
        userType: "vendor",
        type: "delivery_update",
        title: `Delivery ${status}`,
        message: message,
        metadata: {
          delivery_id: deliveryId,
          order_number: orderNumber,
          status: status,
        },
        relatedId: deliveryId,
      },
      true,
    );
    console.log(`✅ Push notification sent to vendor for delivery ${status}`);
  } catch (error) {
    console.error(`Error sending vendor notification:`, error);
  }
};

// Send notification to buyer about delivery status
const notifyBuyerDeliveryUpdate = async (
  buyerUserId: string,
  deliveryId: string,
  orderNumber: string,
  status: string,
  message: string,
) => {
  try {
    await createNotificationWithPush(
      {
        userId: buyerUserId,
        userType: "buyer",
        type: "delivery_update",
        title: `Delivery ${status}`,
        message: message,
        metadata: {
          delivery_id: deliveryId,
          order_number: orderNumber,
          status: status,
        },
        relatedId: deliveryId,
      },
      true,
    );
    console.log(`✅ Push notification sent to buyer for delivery ${status}`);
  } catch (error) {
    console.error(`Error sending buyer notification:`, error);
  }
};

// Get vendor and buyer user IDs from order
const getOrderUsers = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("user_id, vendor_user_id")
      .eq("order_id", orderId)
      .single();

    if (error) throw error;
    return { buyerId: data.user_id, vendorId: data.vendor_user_id };
  } catch (error) {
    console.error("Error getting order users:", error);
    return null;
  }
};

// Delivery Details Modal Component (View-Only) - UPDATED with proof photos as buttons
const DeliveryDetailsModal = ({
  visible,
  onClose,
  delivery,
  onReportBuyer,
  onReportSeller,
}: {
  visible: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  onReportBuyer?: (orderId: string, buyerId: string, buyerName: string) => void;
  onReportSeller?: (
    orderId: string,
    sellerId: string,
    sellerName: string,
  ) => void;
}) => {
  if (!delivery) return null;

  const makePhoneCall = (phoneNumber: string) => {
    if (phoneNumber && phoneNumber !== "No phone") {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("Error", "No phone number available");
    }
  };

  const openProofImage = (url: string) => Linking.openURL(url);

  const handleTrackOrder = () => {
    router.push({
      pathname: "/rider/rider-order-tracking",
      params: {
        orderId: delivery.order_id,
        orderNumber: delivery.order_number,
      },
    });
  };

  // Handle chat with vendor
  const handleChatWithVendor = async () => {
    if (!delivery?.vendor_name) {
      Alert.alert("Error", "Vendor information not available");
      return;
    }

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "Please login to chat");
        return;
      }

      // Get vendor user ID and avatar from vendor_profiles
      const { data: vendorProfile } = await supabase
        .from("vendor_profiles")
        .select("user_id, avatar_url")
        .eq("shop_name", delivery.vendor_name)
        .single();

      if (!vendorProfile) {
        Alert.alert("Error", "Vendor not found");
        return;
      }

      // Get or create conversation
      const { data: conversation, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("rider_id", user.id)
        .eq("vendor_id", vendorProfile.user_id)
        .single();

      let conversationId;

      if (error || !conversation) {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from("conversations")
          .insert({
            rider_id: user.id,
            vendor_id: vendorProfile.user_id,
            last_message: null,
            last_message_time: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating conversation:", createError);
          Alert.alert("Error", "Failed to start chat");
          return;
        }

        conversationId = newConversation.id;
      } else {
        conversationId = conversation.id;
      }

      // Navigate to chat screen with vendor avatar
      router.push({
        pathname: "/buyer/chat",
        params: {
          conversationId: conversationId,
          otherPartyName: delivery.vendor_name,
          otherPartyId: vendorProfile.user_id,
          otherPartyType: "vendor",
          otherPartyAvatar: vendorProfile?.avatar_url || "",
        },
      });
    } catch (error) {
      console.error("Error starting chat with vendor:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  // Handle chat with buyer/customer
  const handleChatWithBuyer = async () => {
    if (!delivery?.customer_name) {
      Alert.alert("Error", "Customer information not available");
      return;
    }

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "Please login to chat");
        return;
      }

      // Get customer user ID from the order
      const { data: order } = await supabase
        .from("orders")
        .select("user_id")
        .eq("order_id", delivery.order_id)
        .single();

      if (!order) {
        Alert.alert("Error", "Order not found");
        return;
      }

      // Get customer avatar from profiles
      const { data: customerProfile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", order.user_id)
        .single();

      // Get or create conversation
      const { data: conversation, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("rider_id", user.id)
        .eq("buyer_id", order.user_id)
        .single();

      let conversationId;

      if (error || !conversation) {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from("conversations")
          .insert({
            rider_id: user.id,
            buyer_id: order.user_id,
            last_message: null,
            last_message_time: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating conversation:", createError);
          Alert.alert("Error", "Failed to start chat");
          return;
        }

        conversationId = newConversation.id;
      } else {
        conversationId = conversation.id;
      }

      // Navigate to chat screen with customer avatar
      router.push({
        pathname: "/buyer/chat",
        params: {
          conversationId: conversationId,
          otherPartyName: delivery.customer_name,
          otherPartyId: order.user_id,
          otherPartyType: "buyer",
          otherPartyAvatar: customerProfile?.avatar_url || "",
        },
      });
    } catch (error) {
      console.error("Error starting chat with buyer:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  // ─── Contact Card component ─────────────────────
  const ContactCard = ({
    role,
    name,
    phone,
    address,
    isVendor = false,
  }: {
    role: string;
    name: string;
    phone?: string | null;
    address?: string | null;
    isVendor?: boolean;
  }) => (
    <View style={S.modalContactCard}>
      <View style={S.modalContactTopRow}>
        <View
          style={[S.modalContactAvatar, isVendor && S.modalContactAvatarVendor]}
        >
          <Ionicons
            name={isVendor ? "storefront-outline" : "person-outline"}
            size={18}
            color={isVendor ? "#f97316" : COLORS.light.primary}
          />
        </View>
        <View style={S.modalContactNameBlock}>
          <Text style={S.modalContactName}>{name}</Text>
          <Text style={S.modalContactRole}>{role}</Text>
        </View>
      </View>

      <View style={S.modalContactDivider} />

      {phone && phone !== "No phone" && (
        <View style={S.modalContactPhoneRow}>
          <Ionicons
            name="call-outline"
            size={14}
            color="#aaa"
            style={S.modalContactPhoneIcon}
          />
          <Text style={S.modalContactPhone}>{phone}</Text>
        </View>
      )}

      {address && (
        <View style={S.modalContactAddressRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color="#aaa"
            style={S.modalContactAddressIcon}
          />
          <Text style={S.modalContactAddress}>{address}</Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={S.modalOverlay}>
        <View style={S.modalContent}>
          {/* ── Header ── */}
          <View style={S.modalHeader}>
            <Text style={S.modalTitle}>Delivery Details</Text>
            <TouchableOpacity style={S.modalCloseButton} onPress={onClose}>
              <Ionicons name="close" size={16} color="#555" />
            </TouchableOpacity>
          </View>

          <ScrollView style={S.modalBody} showsVerticalScrollIndicator={false}>
            {/* ── Order meta ── */}
            <View style={S.modalSection}>
              <Text style={S.modalSectionTitle}>Order</Text>
              <View style={S.modalOrderInfo}>
                <View>
                  <Text style={S.modalOrderLabel}>Order Number</Text>
                  <Text style={S.modalOrderNumber}>
                    #{delivery.order_number}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={S.modalOrderLabel}>Date</Text>
                  <Text style={S.modalOrderDate}>
                    {delivery.scheduled_date}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Customer Info ── */}
            <View style={S.modalSection}>
              <Text style={S.modalSectionTitle}>Customer</Text>
              <ContactCard
                role="Recipient"
                name={delivery.customer_name || "Customer"}
                phone={delivery.customer_phone}
                address={delivery.delivery_address}
              />

              {/* Customer Action Buttons */}
              {delivery.customer_phone &&
                delivery.customer_phone !== "No phone" && (
                  <View style={S.modalActionButtonsContainer}>
                    <TouchableOpacity
                      style={[
                        S.modalSecondaryButton,
                        { flex: 1, marginRight: 4 },
                      ]}
                      onPress={handleChatWithBuyer}
                    >
                      <Ionicons
                        name="chatbubble"
                        size={18}
                        color={COLORS.light.primary}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={S.modalSecondaryButtonText}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[S.modalPrimaryButton, { flex: 1, marginLeft: 4 }]}
                      onPress={() => makePhoneCall(delivery.customer_phone!)}
                    >
                      <Ionicons
                        name="call"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={S.modalPrimaryButtonText}>Call</Text>
                    </TouchableOpacity>
                  </View>
                )}
            </View>

            {/* ── Vendor Info ── */}
            <View style={S.modalSection}>
              <Text style={S.modalSectionTitle}>Vendor</Text>
              <ContactCard
                role="Pickup Location"
                name={delivery.vendor_name}
                phone={delivery.vendor_phone}
                address={delivery.vendor_address}
                isVendor
              />

              {/* Vendor Action Buttons */}
              {delivery.vendor_phone &&
                delivery.vendor_phone !== "No phone" && (
                  <View style={S.modalActionButtonsContainer}>
                    <TouchableOpacity
                      style={[
                        S.modalSecondaryButton,
                        { flex: 1, marginRight: 4 },
                      ]}
                      onPress={handleChatWithVendor}
                    >
                      <Ionicons
                        name="chatbubble"
                        size={18}
                        color={COLORS.light.primary}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={S.modalSecondaryButtonText}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[S.modalPrimaryButton, { flex: 1, marginLeft: 4 }]}
                      onPress={() => makePhoneCall(delivery.vendor_phone!)}
                    >
                      <Ionicons
                        name="call"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={S.modalPrimaryButtonText}>Call</Text>
                    </TouchableOpacity>
                  </View>
                )}
            </View>

            {/* Track Order Button - Only show if status is picked_up (in transit) */}
            {delivery.status === "picked_up" && (
              <View style={[S.modalSection, { marginTop: 0 }]}>
                <Text style={S.trackLabel}>Track Location</Text>
                <TouchableOpacity
                  style={S.trackOrderButton}
                  onPress={handleTrackOrder}
                >
                  <Image
                    source={require("../../assets/img/ridermap.png")}
                    style={S.trackOrderImage}
                    resizeMode="cover"
                  />
                  <View style={S.proofOverlay}>
                    <Ionicons name="expand-outline" size={22} color="#fff" />
                    <Text style={S.proofOverlayText}>Tap to view</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            {/* ── Proof Photos — View buttons only (UPDATED) ── */}
            {(delivery.pickup_proof_url || delivery.delivered_proof_url) && (
              <View style={S.modalSection}>
                <Text style={S.modalSectionTitle}>Delivery Proof</Text>
                <View style={S.modalPaymentCard}>
                  {delivery.pickup_proof_url && (
                    <View
                      style={[
                        S.proofRow,
                        { marginBottom: delivery.delivered_proof_url ? 10 : 0 },
                      ]}
                    >
                      <Text style={S.proofRowLabel}>Pickup Proof</Text>
                      <TouchableOpacity
                        style={S.viewProofButton}
                        onPress={() =>
                          openProofImage(delivery.pickup_proof_url!)
                        }
                      >
                        <Ionicons
                          name="eye-outline"
                          size={14}
                          color={COLORS.light.primary}
                        />
                        <Text style={S.viewProofButtonText}>View Proof</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {delivery.delivered_proof_url && (
                    <View style={S.proofRow}>
                      <Text style={S.proofRowLabel}>Delivery Proof</Text>
                      <TouchableOpacity
                        style={S.viewProofButton}
                        onPress={() =>
                          openProofImage(delivery.delivered_proof_url!)
                        }
                      >
                        <Ionicons
                          name="eye-outline"
                          size={14}
                          color={COLORS.light.primary}
                        />
                        <Text style={S.viewProofButtonText}>View Proof</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ── Items ── */}
            <View style={S.modalSection}>
              <Text style={S.modalSectionTitle}>Items</Text>
              {delivery.items.map((item) => (
                <View key={item.id} style={S.modalItemRow}>
                  <Image
                    source={item.image}
                    style={RiderDeliveryStyles.modalItemImage}
                  />
                  <View style={S.modalItemDetails}>
                    <Text style={S.modalItemName}>{item.name}</Text>
                    <Text style={S.modalItemVendor}>{item.vendor}</Text>
                  </View>
                  <View style={S.modalItemPrice}>
                    <Text style={S.modalItemPriceText}>
                      ₱{item.price.toLocaleString()}
                    </Text>
                    <Text style={S.modalItemQuantity}>×{item.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* ── Price Summary ── */}
            <View style={S.modalSection}>
              <Text style={S.modalSectionTitle}>Summary</Text>
              <View style={S.modalPriceSummaryCard}>
                {/* Subtotal */}
                <View style={S.modalPriceRow}>
                  <Text style={S.modalPriceLabel}>Subtotal</Text>
                  <Text style={S.modalPriceValue}>
                    ₱{(delivery.subtotal || 0).toLocaleString()}
                  </Text>
                </View>

                {/* Delivery Fee */}
                {delivery.delivery_fee ? (
                  <View style={S.modalPriceRow}>
                    <Text style={S.modalPriceLabel}>Delivery Fee</Text>
                    <Text style={S.modalPriceValue}>
                      ₱{delivery.delivery_fee.toLocaleString()}
                    </Text>
                  </View>
                ) : null}

                {/* Total */}
                <View style={S.modalTotalRow}>
                  <Text style={S.modalTotalLabel}>Total Amount</Text>
                  <Text style={S.modalTotalValue}>
                    ₱{delivery.total_amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Report Buttons - Only show for failed deliveries */}
            {delivery.status === "failed" && (
              <>
                {/* Report Buyer Button */}
                {delivery.customer_id && delivery.customer_name && (
                  <TouchableOpacity
                    style={[S.reportButton]}
                    onPress={() =>
                      onReportBuyer?.(
                        delivery.order_id,
                        delivery.customer_id!,
                        delivery.customer_name!,
                      )
                    }
                  >
                    <Ionicons name="flag-outline" size={16} color="#ef4444" />
                    <Text style={S.reportButtonText}>Report Buyer</Text>
                  </TouchableOpacity>
                )}

                {/* Report Seller Button */}
                {delivery.vendor_id && delivery.vendor_name && (
                  <TouchableOpacity
                    style={[
                      S.reportButton,
                      { marginTop: 12, marginBottom: 24 },
                    ]}
                    onPress={() =>
                      onReportSeller?.(
                        delivery.order_id,
                        delivery.vendor_id!,
                        delivery.vendor_name!,
                      )
                    }
                  >
                    <Ionicons name="flag-outline" size={16} color="#ef4444" />
                    <Text style={S.reportButtonText}>Report Seller</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
// Alias for brevity inside the component
const S = RiderDeliveryStyles;
const RiderDelivery = () => {
  const [activeTab, setActiveTab] = useState<UITabStatus>("to-pickup");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedReceiptDelivery, setSelectedReceiptDelivery] =
    useState<Delivery | null>(null);
  const [failModalVisible, setFailModalVisible] = useState(false);
  const [failDeliveryData, setFailDeliveryData] = useState<{
    delivery: Delivery | null;
    reason: string;
  }>({ delivery: null, reason: "" });
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const { refreshPendingDeliveries } = useRiderDeliveryContext();
  // NEW: Report modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    id: string;
    name: string;
    type: "buyer" | "seller" | "rider" | "order";
  } | null>(null);

  // Use a ref to track if location tracking has been initialized
  const locationInitialized = useRef(false);

  const navigation = useNavigation();

  const tabs: { key: UITabStatus; label: string }[] = [
    { key: "to-pickup", label: "To Pickup" },
    { key: "in-transit", label: "In Transit" },
    { key: "delivered", label: "Delivered" },
    { key: "failed", label: "Failed" },
    { key: "canceled", label: "Canceled" },
  ];

  const handleReport = (
    targetId: string,
    targetName: string,
    type: "buyer" | "seller" | "rider" | "order",
    orderId?: string,
  ) => {
    setReportTarget({ id: targetId, name: targetName, type });
    setReportModalVisible(true);
  };
  // Handle delivery card press
  const handleDeliveryPress = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setModalVisible(true);
  };
  const handleReceiptPress = (delivery: Delivery) => {
    setSelectedReceiptDelivery(delivery);
    setReceiptModalVisible(true);
  };

  // Get current rider ID
  useEffect(() => {
    const getCurrentRider = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setRiderId(user.id);
      }
    };
    getCurrentRider();
  }, []);

  // Start/stop location tracking based on app state - OPTIMIZED VERSION
  useEffect(() => {
    if (!riderId) return;

    // Only initialize once
    if (locationInitialized.current) {
      console.log("Location tracking already initialized, skipping...");
      return;
    }

    let isMounted = true;
    let appStateSubscription: any = null;

    const initializeLocationTracking = async () => {
      try {
        console.log("Initializing location tracking for rider:", riderId);

        // Start tracking immediately
        await locationService.startTracking(riderId);

        if (isMounted) {
          setIsTracking(true);
          locationInitialized.current = true;
        }
      } catch (error) {
        console.error("Failed to start location tracking:", error);
      }
    };

    // Initialize tracking
    initializeLocationTracking();

    // Listen for app state changes (but don't re-initialize)
    appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        console.log("App state changed to:", nextAppState);

        if (nextAppState === "active") {
          // App came to foreground - resume tracking if not already tracking
          if (!locationService.isTrackingActive() && riderId) {
            console.log("App active, resuming location tracking");
            locationService
              .startTracking(riderId)
              .then(() => {
                if (isMounted) setIsTracking(true);
              })
              .catch(console.error);
          }
        } else if (nextAppState === "background") {
          // App went to background - stop tracking to save battery
          console.log("App background, stopping location tracking");
          locationService.stopTracking();
          if (isMounted) setIsTracking(false);
        }
      },
    );

    // Cleanup when component unmounts
    return () => {
      console.log("Cleaning up location tracking");
      isMounted = false;

      if (appStateSubscription) {
        appStateSubscription.remove();
      }

      locationService.stopTracking();
      locationInitialized.current = false;
    };
  }, [riderId]);

  // Load deliveries when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (riderId) {
        loadDeliveries();
      }
    }, [riderId]),
  );

  // Filter deliveries when tab changes or deliveries update
  useEffect(() => {
    const statuses = tabToStatuses[activeTab] || [];
    const filtered = deliveries.filter((d) => statuses.includes(d.status));
    setFilteredDeliveries(filtered);
  }, [activeTab, deliveries]);

  const loadDeliveries = async () => {
    if (!riderId) return;

    setLoading(true);
    try {
      const data = await deliveryService.getRiderDeliveries(riderId);
      setDeliveries(data);
    } catch (error) {
      console.error("Error loading deliveries:", error);
      Alert.alert("Error", "Failed to load deliveries");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDeliveries();
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
    if (!riderId) return;

    setAcceptingId(deliveryId);
    try {
      // Find the delivery to get vendor info
      const delivery = deliveries.find((d) => d.id === deliveryId);

      // Clear timeout first
      await dispatchService.clearDeliveryTimeout(deliveryId);

      const result = await deliveryService.respondToOffer(
        deliveryId,
        riderId,
        true,
      );

      // ========== SEND NOTIFICATION ==========
      if (delivery) {
        // Get vendor ID from the order
        const { data: order } = await supabase
          .from("orders")
          .select("vendor_user_id")
          .eq("order_id", delivery.order_id)
          .single();

        if (order?.vendor_user_id) {
          await sendDeliveryResponseNotification(
            delivery,
            true,
            order.vendor_user_id,
          );
        }
      }
      // ========== END NOTIFICATION ==========

      Alert.alert("Success", "You have accepted this delivery!");
      refreshPendingDeliveries();
      loadDeliveries();
    } catch (error: any) {
      console.error("Error accepting delivery:", error);
      Alert.alert("Error", error.message || "Failed to accept delivery");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectDelivery = async (deliveryId: string) => {
    if (!riderId) return;

    Alert.alert(
      "Reject Delivery",
      "Are you sure you want to reject this delivery?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            setRejectingId(deliveryId);
            try {
              // Find the delivery to get vendor info
              const delivery = deliveries.find((d) => d.id === deliveryId);

              // Clear timeout first
              await dispatchService.clearDeliveryTimeout(deliveryId);

              await deliveryService.respondToOffer(deliveryId, riderId, false);

              // ========== SEND NOTIFICATION ==========
              if (delivery) {
                const { data: order } = await supabase
                  .from("orders")
                  .select("vendor_user_id")
                  .eq("order_id", delivery.order_id)
                  .single();

                if (order?.vendor_user_id) {
                  await sendDeliveryResponseNotification(
                    delivery,
                    false,
                    order.vendor_user_id,
                  );
                }
              }
              // ========== END NOTIFICATION ==========

              Alert.alert("Success", "Delivery rejected");
              refreshPendingDeliveries();
              loadDeliveries();
            } catch (error) {
              console.error("Error rejecting delivery:", error);
              Alert.alert("Error", "Failed to reject delivery");
            } finally {
              setRejectingId(null);
            }
          },
        },
      ],
    );
  };

  const handlePickupWithProof = async (delivery: Delivery) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to take pickup proof photo.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingId(delivery.id);
        const imageUri = result.assets[0].uri;

        const imageUrl = await deliveryService.uploadProofImage(
          imageUri,
          delivery.id,
          riderId!,
          "pickup",
        );

        await deliveryService.confirmPickupWithProof(
          delivery.id,
          delivery.order_id,
          imageUrl,
        );

        // ========== SEND NOTIFICATIONS ==========
        // Get vendor and buyer IDs
        const { data: order } = await supabase
          .from("orders")
          .select("vendor_user_id, user_id")
          .eq("order_id", delivery.order_id)
          .single();

        if (order?.vendor_user_id && order?.user_id) {
          await sendPickupConfirmationNotification(
            delivery,
            order.vendor_user_id,
            order.user_id,
          );
        }
        // ========== END NOTIFICATIONS ==========

        Alert.alert("Success", "Pickup confirmed with proof photo!");
        loadDeliveries();
      }
    } catch (error: any) {
      console.error("Error in pickup with proof:", error);
      Alert.alert("Error", error.message || "Failed to process pickup");
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeliveredWithProof = async (delivery: Delivery) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to take delivery proof photo.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingId(delivery.id);
        const imageUri = result.assets[0].uri;

        const imageUrl = await deliveryService.uploadProofImage(
          imageUri,
          delivery.id,
          riderId!,
          "delivery",
        );

        await deliveryService.confirmDeliveryWithProof(
          delivery.id,
          delivery.order_id,
          riderId!,
          imageUrl,
        );

        // ========== SEND NOTIFICATIONS ==========
        const { data: order } = await supabase
          .from("orders")
          .select("vendor_user_id, user_id")
          .eq("order_id", delivery.order_id)
          .single();

        if (order?.vendor_user_id && order?.user_id) {
          await sendDeliveryCompletionNotification(
            delivery,
            order.vendor_user_id,
            order.user_id,
          );
        }
        // ========== END NOTIFICATIONS ==========

        Alert.alert("Success", "Delivery completed with proof photo!");
        loadDeliveries();
      }
    } catch (error: any) {
      console.error("Error in delivery with proof:", error);
      Alert.alert("Error", error.message || "Failed to process delivery");
    } finally {
      setUploadingId(null);
    }
  };

  // Send notification for delivery acceptance/rejection
  const sendDeliveryResponseNotification = async (
    delivery: Delivery,
    accepted: boolean,
    vendorId: string,
  ) => {
    try {
      if (accepted) {
        await createNotificationWithPush(
          {
            userId: vendorId,
            userType: "vendor",
            type: "delivery_accepted",
            title: "Delivery Accepted!",
            message: `Rider has accepted delivery for order #${delivery.order_number}`,
            metadata: {
              delivery_id: delivery.id,
              order_number: delivery.order_number,
              rider_id: riderId,
            },
            relatedId: delivery.id,
          },
          true,
        );
      } else {
        await createNotificationWithPush(
          {
            userId: vendorId,
            userType: "vendor",
            type: "delivery_rejected",
            title: "❌ Delivery Rejected",
            message: `Rider rejected delivery for order #${delivery.order_number}`,
            metadata: {
              delivery_id: delivery.id,
              order_number: delivery.order_number,
            },
            relatedId: delivery.id,
          },
          true,
        );
        console.log(
          `✅ Delivery rejection notification sent to vendor: ${vendorId}`,
        );
      }
    } catch (error) {
      console.error("Error sending delivery response notification:", error);
    }
  };

  // Send notification for pickup confirmation
  const sendPickupConfirmationNotification = async (
    delivery: Delivery,
    vendorId: string,
    buyerId: string,
  ) => {
    try {
      // Notify vendor that items were picked up
      await createNotificationWithPush(
        {
          userId: vendorId,
          userType: "vendor",
          type: "pickup_confirmed",
          title: "📦 Order Picked Up!",
          message: `Order #${delivery.order_number} has been picked up by rider`,
          metadata: {
            delivery_id: delivery.id,
            order_number: delivery.order_number,
          },
          relatedId: delivery.id,
        },
        true,
      );

      // Notify buyer that order is on the way
      await createNotificationWithPush(
        {
          userId: buyerId,
          userType: "buyer",
          type: "order_on_the_way",
          title: "Your Order is On the Way!",
          message: `Order #${delivery.order_number} has been picked up and is on its way to you.`,
          metadata: {
            delivery_id: delivery.id,
            order_number: delivery.order_number,
          },
          relatedId: delivery.id,
        },
        true,
      );
      console.log(
        `✅ Pickup confirmation notifications sent for order: ${delivery.order_number}`,
      );
    } catch (error) {
      console.error("Error sending pickup confirmation notifications:", error);
    }
  };

  // Send notification for delivery completion
  const sendDeliveryCompletionNotification = async (
    delivery: Delivery,
    vendorId: string,
    buyerId: string,
  ) => {
    try {
      // Notify vendor that delivery is complete
      await createNotificationWithPush(
        {
          userId: vendorId,
          userType: "vendor",
          type: "delivery_completed",
          title: "✅ Delivery Completed!",
          message: `Order #${delivery.order_number} has been delivered successfully.`,
          metadata: {
            delivery_id: delivery.id,
            order_number: delivery.order_number,
          },
          relatedId: delivery.id,
        },
        true,
      );

      // Notify buyer that order is delivered
      await createNotificationWithPush(
        {
          userId: buyerId,
          userType: "buyer",
          type: "order_delivered",
          title: "🎉 Order Delivered!",
          message: `Your order #${delivery.order_number} has been delivered. Enjoy!`,
          metadata: {
            delivery_id: delivery.id,
            order_number: delivery.order_number,
          },
          relatedId: delivery.id,
        },
        true,
      );
      console.log(
        `✅ Delivery completion notifications sent for order: ${delivery.order_number}`,
      );
    } catch (error) {
      console.error("Error sending delivery completion notifications:", error);
    }
  };

  // Send notification for failed delivery
  const sendDeliveryFailedNotification = async (
    delivery: Delivery,
    vendorId: string,
    buyerId: string,
    reason: string,
  ) => {
    try {
      // Notify vendor about failed delivery
      await createNotificationWithPush(
        {
          userId: vendorId,
          userType: "vendor",
          type: "delivery_failed",
          title: "⚠️ Delivery Failed",
          message: `Order #${delivery.order_number} could not be delivered. Reason: ${reason}`,
          metadata: {
            delivery_id: delivery.id,
            order_number: delivery.order_number,
            failure_reason: reason,
          },
          relatedId: delivery.id,
        },
        true,
      );

      // Notify buyer about failed delivery
      await createNotificationWithPush(
        {
          userId: buyerId,
          userType: "buyer",
          type: "delivery_failed",
          title: "Delivery Issue",
          message: `Your order #${delivery.order_number} could not be delivered. Reason: ${reason}. Please contact support.`,
          metadata: {
            delivery_id: delivery.id,
            order_number: delivery.order_number,
            failure_reason: reason,
          },
          relatedId: delivery.id,
        },
        true,
      );
      console.log(
        `✅ Delivery failure notifications sent for order: ${delivery.order_number}`,
      );
    } catch (error) {
      console.error("Error sending delivery failure notifications:", error);
    }
  };

  const getStatusColor = (status: DatabaseDeliveryStatus) => {
    switch (status) {
      case "assigned":
      case "pending":
      case "ready_to_pickup":
        return "#f59e0b";
      case "picked_up":
        return "#3b82f6";
      case "delivered":
        return "#10b981";
      case "failed":
        return "#ef4444";
      case "cancelled":
      case "rejected":
        return "#6b7280";
      default:
        return COLORS.light.primary;
    }
  };

  const getStatusLabel = (status: DatabaseDeliveryStatus): string => {
    const map: Record<DatabaseDeliveryStatus, string> = {
      assigned: "To Pickup",
      ready_to_pickup: "Ready to Pickup",
      pending: "To Pickup",
      picked_up: "In Transit",
      delivered: "Delivered",
      failed: "Failed",
      cancelled: "Canceled",
      rejected: "Canceled",
    };
    return map[status] || status;
  };

  const renderDeliveryCard = (delivery: Delivery) => {
    const isUploading = uploadingId === delivery.id;

    return (
      <TouchableOpacity
        key={delivery.id}
        style={RiderDeliveryStyles.orderCard}
        onPress={() => handleDeliveryPress(delivery)}
        activeOpacity={0.7}
      >
        <View style={RiderDeliveryStyles.orderHeader}>
          <View>
            <Text style={RiderDeliveryStyles.orderId}>
              #{delivery.order_number}
            </Text>
            <Text style={RiderDeliveryStyles.orderDate}>
              {delivery.scheduled_date}
            </Text>
            {/* Quick customer info on card */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: COLORS.light.primary,
                  fontWeight: "600",
                }}
              >
                {delivery.customer_name || "Customer"}
              </Text>
            </View>
          </View>
          <View
            style={[
              RiderDeliveryStyles.statusBadge,
              { backgroundColor: getStatusColor(delivery.status) },
            ]}
          >
            <Text style={RiderDeliveryStyles.statusText}>
              {getStatusLabel(delivery.status)}
            </Text>
          </View>
        </View>

        {/* Delivery Items */}
        {delivery.items.slice(0, 2).map((item) => (
          <View key={item.id} style={RiderDeliveryStyles.itemRow}>
            <Image source={item.image} style={RiderDeliveryStyles.itemImage} />
            <View style={RiderDeliveryStyles.itemDetails}>
              <Text style={RiderDeliveryStyles.itemName}>{item.name}</Text>
              <Text style={RiderDeliveryStyles.itemVendor}>{item.vendor}</Text>
              <Text style={RiderDeliveryStyles.itemPrice}>
                ₱{item.price} × {item.quantity}
              </Text>
            </View>
          </View>
        ))}

        {delivery.items.length > 2 && (
          <Text style={RiderDeliveryStyles.moreItemsText}>
            +{delivery.items.length - 2} more item(s)
          </Text>
        )}

        <View style={RiderDeliveryStyles.orderFooter}>
          <View style={RiderDeliveryStyles.totalRow}>
            <Text style={RiderDeliveryStyles.totalLabel}>Total Amount:</Text>
            <Text style={RiderDeliveryStyles.totalAmount}>
              ₱{delivery.total_amount.toLocaleString()}
            </Text>
          </View>

          {/* Action Buttons on Card */}
          <View style={RiderDeliveryStyles.actionButtons}>
            {/* STAGE 1: New offer - Rider can accept or reject */}
            {delivery.status === "pending" && (
              <>
                <TouchableOpacity
                  style={RiderDeliveryStyles.secondaryButton}
                  onPress={() => handleRejectDelivery(delivery.id)}
                  disabled={
                    acceptingId === delivery.id || rejectingId === delivery.id
                  }
                >
                  {rejectingId === delivery.id ? (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <ActivityIndicator
                        size="small"
                        color="#666"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={RiderDeliveryStyles.secondaryButtonText}>
                        Rejecting...
                      </Text>
                    </View>
                  ) : (
                    <Text style={RiderDeliveryStyles.secondaryButtonText}>
                      Reject Order
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={RiderDeliveryStyles.primaryButton}
                  onPress={() => handleAcceptDelivery(delivery.id)}
                  disabled={
                    acceptingId === delivery.id || rejectingId === delivery.id
                  }
                >
                  {acceptingId === delivery.id ? (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={RiderDeliveryStyles.primaryButtonText}>
                        Accepting...
                      </Text>
                    </View>
                  ) : (
                    <Text style={RiderDeliveryStyles.primaryButtonText}>
                      Accept Order
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* STAGE 3: Seller marked as ready - Rider can pickup */}
            {(delivery.status === "assigned" ||
              delivery.status === "ready_to_pickup") && (
              <>
                <TouchableOpacity
                  style={RiderDeliveryStyles.secondaryButton}
                  onPress={() => handleRejectDelivery(delivery.id)}
                  disabled={isUploading}
                >
                  <Text style={RiderDeliveryStyles.secondaryButtonText}>
                    Cancel Delivery
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={RiderDeliveryStyles.primaryButton}
                  onPress={() => handlePickupWithProof(delivery)}
                  disabled={isUploading}
                >
                  <Ionicons
                    name="camera"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={RiderDeliveryStyles.primaryButtonText}>
                    {isUploading ? "..." : "Pickup"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* STAGE 4: Picked up - En route to customer - REPLACED Contact Customer with Report Issue */}
            {delivery.status === "picked_up" && (
              <>
                <TouchableOpacity
                  style={RiderDeliveryStyles.reportButton}
                  onPress={() => {
                    setFailDeliveryData({ delivery, reason: "" });
                    setFailModalVisible(true);
                  }}
                  disabled={isUploading}
                >
                  <Ionicons
                    name="warning-outline"
                    size={16}
                    color="#ef4444"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={RiderDeliveryStyles.reportButtonText}>
                    Report Issue
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={RiderDeliveryStyles.primaryButton}
                  onPress={() => handleDeliveredWithProof(delivery)}
                  disabled={isUploading}
                >
                  <Ionicons
                    name="camera"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={RiderDeliveryStyles.primaryButtonText}>
                    {isUploading ? "..." : "Submit"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* STAGE 5: Delivered - Show receipt option */}
            {delivery.status === "delivered" && (
              <TouchableOpacity
                style={RiderDeliveryStyles.secondaryButton}
                onPress={() => handleReceiptPress(delivery)}
              >
                <Text style={RiderDeliveryStyles.secondaryButtonText}>
                  Receipt
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={RiderDeliveryStyles.container}>
        <View style={RiderDeliveryStyles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={RiderDeliveryStyles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={RiderDeliveryStyles.headerTitle}>My Deliveries</Text>
          <View style={{ width: 24 }} />
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.light.primary} />
          <Text style={{ marginTop: 12 }}>Loading deliveries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={RiderDeliveryStyles.container}>
      {/* Tracking Status Indicator - Using memoized component */}
      <TrackingIndicator isTracking={isTracking} />

      {/* Header */}
      <View style={RiderDeliveryStyles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={RiderDeliveryStyles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={RiderDeliveryStyles.headerTitle}>My Deliveries</Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={RiderDeliveryStyles.tabsContainer}
        contentContainerStyle={RiderDeliveryStyles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              RiderDeliveryStyles.tab,
              activeTab === tab.key && RiderDeliveryStyles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                RiderDeliveryStyles.tabText,
                activeTab === tab.key && RiderDeliveryStyles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Deliveries List */}
      <FlatList
        data={filteredDeliveries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderDeliveryCard(item)}
        style={RiderDeliveryStyles.ordersContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.light.primary]}
          />
        }
        ListEmptyComponent={
          <View style={RiderDeliveryStyles.emptyState}>
            <Text style={RiderDeliveryStyles.emptyIcon}>📦</Text>
            <Text style={RiderDeliveryStyles.emptyTitle}>
              No deliveries found
            </Text>
            <Text style={RiderDeliveryStyles.emptyDescription}>
              You don't have any deliveries in this category yet
            </Text>
          </View>
        }
      />

      {/* Delivery Details Modal (View-Only) */}
      <DeliveryDetailsModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedDelivery(null);
        }}
        delivery={selectedDelivery}
        onReportBuyer={(orderId, buyerId, buyerName) => {
          setReportTarget({
            id: buyerId,
            name: buyerName,
            type: "buyer",
          });
          setReportModalVisible(true);
        }}
        onReportSeller={(orderId, sellerId, sellerName) => {
          setReportTarget({
            id: sellerId,
            name: sellerName,
            type: "seller",
          });
          setReportModalVisible(true);
        }}
      />
      <ReportModal
        visible={reportModalVisible}
        onClose={() => {
          setReportModalVisible(false);
          setReportTarget(null);
        }}
        reportType={reportTarget?.type || "order"}
        targetId={reportTarget?.id || ""}
        targetName={reportTarget?.name || ""}
        reporterId={riderId || ""}
        orderId={
          reportTarget?.type !== "order"
            ? selectedDelivery?.order_id
            : undefined
        }
        onReportSubmitted={() => {
          Alert.alert("Success", "Report submitted successfully");
        }}
      />
      <ReceiptModal
        visible={receiptModalVisible}
        onClose={() => {
          setReceiptModalVisible(false);
          setSelectedReceiptDelivery(null);
        }}
        delivery={selectedReceiptDelivery}
        riderId={riderId}
      />

      {/* Fail Delivery Modal */}
      <Modal
        visible={failModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFailModalVisible(false)}
      >
        <View style={S.modalOverlay}>
          <View style={[S.modalContent, { maxHeight: "50%" }]}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Report Issue</Text>
              <TouchableOpacity
                style={S.modalCloseButton}
                onPress={() => setFailModalVisible(false)}
              >
                <Ionicons name="close" size={16} color="#555" />
              </TouchableOpacity>
            </View>

            <ScrollView style={S.modalBody}>
              <Text style={RiderDeliveryStyles.failInstruction}>
                Please select a reason for reporting this delivery issue:
              </Text>

              {[
                "Customer not available",
                "Wrong address",
                "Customer refused delivery",
                "Unable to locate address",
                "Delivery area unsafe",
                "Vehicle issue",
                "Other",
              ].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    RiderDeliveryStyles.failReasonOption,
                    failDeliveryData.reason === reason &&
                      RiderDeliveryStyles.failReasonSelected,
                  ]}
                  onPress={() =>
                    setFailDeliveryData((prev) => ({ ...prev, reason }))
                  }
                >
                  <Text
                    style={[
                      RiderDeliveryStyles.failReasonText,
                      failDeliveryData.reason === reason &&
                        RiderDeliveryStyles.failReasonTextSelected,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={RiderDeliveryStyles.failActionButtons}>
                <TouchableOpacity
                  style={RiderDeliveryStyles.failCancelButton}
                  onPress={() => setFailModalVisible(false)}
                >
                  <Text style={RiderDeliveryStyles.failCancelButtonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    RiderDeliveryStyles.failConfirmButton,
                    (!failDeliveryData.reason || uploadingId) &&
                      RiderDeliveryStyles.disabledButton,
                  ]}
                  // Inside the fail modal's confirm button onPress
                  onPress={async () => {
                    if (!failDeliveryData.delivery || !failDeliveryData.reason)
                      return;

                    setUploadingId(failDeliveryData.delivery.id);
                    try {
                      await deliveryService.failDelivery(
                        failDeliveryData.delivery.id,
                        failDeliveryData.delivery.order_id,
                        riderId!,
                        failDeliveryData.reason,
                      );

                      // ========== SEND NOTIFICATIONS ==========
                      const { data: order } = await supabase
                        .from("orders")
                        .select("vendor_user_id, user_id")
                        .eq("order_id", failDeliveryData.delivery.order_id)
                        .single();

                      if (order?.vendor_user_id && order?.user_id) {
                        await sendDeliveryFailedNotification(
                          failDeliveryData.delivery,
                          order.vendor_user_id,
                          order.user_id,
                          failDeliveryData.reason,
                        );
                      }
                      // ========== END NOTIFICATIONS ==========

                      Alert.alert("Success", "Issue reported successfully");
                      setFailModalVisible(false);
                      setFailDeliveryData({ delivery: null, reason: "" });
                      loadDeliveries();
                    } catch (error: any) {
                      Alert.alert(
                        "Error",
                        error.message || "Failed to report issue",
                      );
                    } finally {
                      setUploadingId(null);
                    }
                  }}
                  disabled={!failDeliveryData.reason || !!uploadingId}
                >
                  {uploadingId === failDeliveryData.delivery?.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={RiderDeliveryStyles.failConfirmButtonText}>
                      Confirm
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default RiderDelivery;
