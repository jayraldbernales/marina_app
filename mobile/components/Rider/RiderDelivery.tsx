import React, { useState, useEffect, useCallback } from "react";
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
  AppStateStatus,
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
import * as ImagePicker from "expo-image-picker";

// Map database status to UI tabs
const statusToTab = (status: DatabaseDeliveryStatus): UITabStatus => {
  const map: Record<DatabaseDeliveryStatus, UITabStatus> = {
    assigned: "to-pickup",
    ready_to_pickup: "to-pickup",
    picked_up: "in-transit",
    delivered: "delivered",
    failed: "failed",
    cancelled: "canceled",
    rejected: "canceled",
    pending: "to-pickup", // fallback
  };
  return map[status] || "to-pickup";
};

// Map UI tabs to database statuses (for filtering)
const tabToStatuses: Record<UITabStatus, DatabaseDeliveryStatus[]> = {
  "to-pickup": ["assigned", "pending", "ready_to_pickup"],
  "in-transit": ["picked_up"],
  delivered: ["delivered"],
  failed: ["failed"],
  canceled: ["cancelled", "rejected"],
};

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

  const generateReceiptPDF = async () => {
    // Optional: Generate PDF receipt
    Alert.alert("Info", "PDF generation coming soon");
  };

  const shareReceipt = async () => {
    // Optional: Share receipt via messaging/email
    Alert.alert("Info", "Sharing feature coming soon");
  };

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

// Delivery Details Modal Component (View-Only)
const DeliveryDetailsModal = ({
  visible,
  onClose,
  delivery,
}: {
  visible: boolean;
  onClose: () => void;
  delivery: Delivery | null;
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

  // ─── Reusable Contact Card ─────────────────────────────────────────────────
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
      {/* Avatar + name */}
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
        {/* Call button */}
        {phone && phone !== "No phone" && (
          <TouchableOpacity
            onPress={() => makePhoneCall(phone)}
            style={S.modalCallButton}
          >
            <Ionicons name="call" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={S.modalContactDivider} />

      {/* Phone */}
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

      {/* Address */}
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

            {/* ── Customer ── */}
            <View style={S.modalSection}>
              <Text style={S.modalSectionTitle}>Customer</Text>
              <ContactCard
                role="Recipient"
                name={delivery.customer_name || "Customer"}
                phone={delivery.customer_phone}
                address={delivery.delivery_address}
              />
            </View>

            {/* ── Vendor ── */}
            <View style={S.modalSection}>
              <Text style={S.modalSectionTitle}>Vendor</Text>
              <ContactCard
                role="Pickup Location"
                name={delivery.vendor_name}
                phone={delivery.vendor_phone}
                address={delivery.vendor_address}
                isVendor
              />
            </View>

            {/* ── Proof Photos ── */}
            {(delivery.pickup_proof_url || delivery.delivered_proof_url) && (
              <View style={S.proofSection}>
                <Text style={S.proofLabel}>Proof Photos</Text>

                {delivery.pickup_proof_url && (
                  <>
                    <Text
                      style={[
                        S.modalSectionTitle,
                        { marginBottom: 6, fontSize: 12 },
                      ]}
                    >
                      Pickup
                    </Text>
                    <TouchableOpacity
                      style={S.proofImageContainer}
                      onPress={() => openProofImage(delivery.pickup_proof_url!)}
                    >
                      <Image
                        source={{ uri: delivery.pickup_proof_url }}
                        style={S.proofImage}
                        resizeMode="cover"
                      />
                      <View style={S.proofOverlay}>
                        <Ionicons
                          name="expand-outline"
                          size={22}
                          color="#fff"
                        />
                        <Text style={S.proofOverlayText}>Tap to view</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}

                {delivery.delivered_proof_url && (
                  <>
                    <Text
                      style={[
                        S.modalSectionTitle,
                        { marginBottom: 6, fontSize: 12 },
                      ]}
                    >
                      Delivery
                    </Text>
                    <TouchableOpacity
                      style={S.proofImageContainer}
                      onPress={() =>
                        openProofImage(delivery.delivered_proof_url!)
                      }
                    >
                      <Image
                        source={{ uri: delivery.delivered_proof_url }}
                        style={S.proofImage}
                        resizeMode="cover"
                      />
                      <View style={S.proofOverlay}>
                        <Ionicons
                          name="expand-outline"
                          size={22}
                          color="#fff"
                        />
                        <Text style={S.proofOverlayText}>Tap to view</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
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

  const navigation = useNavigation();

  const tabs: { key: UITabStatus; label: string }[] = [
    { key: "to-pickup", label: "To Pickup" },
    { key: "in-transit", label: "In Transit" },
    { key: "delivered", label: "Delivered" },
    { key: "failed", label: "Failed" },
    { key: "canceled", label: "Canceled" },
  ];

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

  // Start/stop location tracking based on app state
  useEffect(() => {
    if (!riderId) return;

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          locationService
            .startTracking(riderId)
            .then(() => {
              setIsTracking(true);
            })
            .catch(console.error);
        } else if (nextAppState === "background") {
          locationService.stopTracking();
          setIsTracking(false);
        }
      },
    );

    locationService
      .startTracking(riderId)
      .then(() => {
        setIsTracking(true);
      })
      .catch(console.error);

    return () => {
      subscription.remove();
      locationService.stopTracking();
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
      // Clear timeout first
      await dispatchService.clearDeliveryTimeout(deliveryId);

      const result = await deliveryService.respondToOffer(
        deliveryId,
        riderId,
        true,
      );
      Alert.alert("Success", "You have accepted this delivery!");
      loadDeliveries();
    } catch (error: any) {
      console.error("Error accepting delivery:", error);
      Alert.alert("Error", error.message || "Failed to accept delivery");
    } finally {
      setAcceptingId(null);
    }
  };

  // Handle rejecting a delivery
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
              // Clear timeout first
              await dispatchService.clearDeliveryTimeout(deliveryId);

              await deliveryService.respondToOffer(deliveryId, riderId, false);
              Alert.alert("Success", "Delivery rejected");
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

  // Handle pickup with photo proof
  const handlePickupWithProof = async (delivery: Delivery) => {
    try {
      // Request camera permission
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to take pickup proof photo.",
        );
        return;
      }

      // Open camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingId(delivery.id);
        const imageUri = result.assets[0].uri;

        // Upload image and update status
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

  // Handle delivery with photo proof
  const handleDeliveredWithProof = async (delivery: Delivery) => {
    try {
      // Request camera permission
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Camera access is needed to take delivery proof photo.",
        );
        return;
      }

      // Open camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingId(delivery.id);
        const imageUri = result.assets[0].uri;

        // Upload image and update status
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

  // Make phone call
  const makePhoneCall = (phoneNumber: string) => {
    if (phoneNumber && phoneNumber !== "No phone") {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("Error", "No phone number available");
    }
  };

  // View proof image
  const handleViewProof = (imageUrl: string) => {
    Linking.openURL(imageUrl);
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

            {/* STAGE 2: Accepted but waiting for seller to prepare */}
            {delivery.status === "assigned" && (
              <TouchableOpacity
                style={RiderDeliveryStyles.secondaryButton}
                onPress={() => handleRejectDelivery(delivery.id)}
                disabled={isUploading}
              >
                <Text style={RiderDeliveryStyles.secondaryButtonText}>
                  Cancel Delivery
                </Text>
              </TouchableOpacity>
            )}

            {/* STAGE 3: Seller marked as ready - Rider can pickup */}
            {delivery.status === "ready_to_pickup" && (
              <>
                <TouchableOpacity
                  style={RiderDeliveryStyles.secondaryButton}
                  onPress={() => handleRejectDelivery(delivery.id)}
                  disabled={isUploading}
                >
                  <Text style={RiderDeliveryStyles.secondaryButtonText}>
                    Reject
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

  // Show tracking status indicator
  const renderTrackingIndicator = () => (
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
  );

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
      {/* Tracking Status Indicator */}
      {renderTrackingIndicator()}

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
