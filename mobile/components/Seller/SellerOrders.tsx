import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ImageSourcePropType,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Linking,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { COLORS } from "@/constants";
import { sellerOrderStyles } from "./styles/sellerOrderStyles";
import { supabase } from "@/lib/supabase";
import { chatService } from "@/lib/chat";
import { useUserStore } from "@/store/userStore";
import { computeFreshness } from "@/utils/freshness";
import { dispatchService } from "@/services/dispatchService";
import { useVendorOrderContext } from "@/contexts/VendorOrderContext";
import { createNotificationWithPush } from "@/services/notificationService";
import { ReportModal } from "@/components/ReportModal";

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready-to-ship"
  | "shipped"
  | "delivered"
  | "failed"
  | "cancelled"
  | "rejected"
  | "finding_rider"
  | "dispatch_failed";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "pending_verification";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | ImageSourcePropType | null;
  productId?: string;
  harvested_at?: string;
};

type RiderAssignment = {
  id: string;
  name: string;
  avatar: ImageSourcePropType | null;
  status: string;
  vehicle?: string | null;
};

type DisplayOrder = {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  orderDate: string;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  paymentProofUrl?: string;
  gcashReference?: string;
  deliveryAddress?: string;
  customerName?: string;
  customerId?: string;
  specialInstructions?: string;
  riderAssignment?: RiderAssignment | null;
  failureReason?: string;
};

// OrderDetailsModal component (keep as is from your original code)
const OrderDetailsModal = ({
  visible,
  onClose,
  order,
  onVerifyPayment,
  onRejectPayment,
  onFindRider,
  onReportBuyer,
  onReportRider,
}: {
  visible: boolean;
  onClose: () => void;
  order: DisplayOrder | null;
  onVerifyPayment?: (orderId: string) => void;
  onRejectPayment?: (orderId: string) => void;
  onFindRider?: (orderId: string) => void;
  onReportBuyer?: (
    orderId: string,
    customerId: string,
    customerName: string,
  ) => void;
  onReportRider?: (orderId: string, riderId: string, riderName: string) => void;
}) => {
  const [pickupProofUrl, setPickupProofUrl] = useState<string | null>(null);
  const [deliveryProofUrl, setDeliveryProofUrl] = useState<string | null>(null);

  useEffect(() => {
    if (order?.id) {
      fetchDeliveryProofs(order.id);
    } else {
      setPickupProofUrl(null);
      setDeliveryProofUrl(null);
    }
  }, [order]);

  const fetchDeliveryProofs = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select("pickup_proof_url, delivered_proof_url")
        .eq("order_id", orderId)
        .maybeSingle();
      if (!error && data) {
        setPickupProofUrl(data.pickup_proof_url);
        setDeliveryProofUrl(data.delivered_proof_url);
      } else {
        setPickupProofUrl(null);
        setDeliveryProofUrl(null);
      }
    } catch (e) {
      console.error("fetchDeliveryProofs:", e);
    }
  };

  const openProofImage = (url: string) => Linking.openURL(url);

  const S = sellerOrderStyles;

  if (!order) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={S.modalOverlay}>
          <View style={S.modalContent}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={onClose} style={S.modalCloseButton}>
                <Ionicons name="close" size={16} color="#555" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20, alignItems: "center" }}>
              <Text>No order selected</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = order.totalAmount - subtotal;

  const getStatusColor = (status: OrderStatus) => {
    const map: Record<string, string> = {
      pending: "#f59e0b",
      preparing: "#3b82f6",
      "ready-to-ship": "#8b5cf6",
      shipped: "#10b981",
      delivered: "#10b981",
      cancelled: "#6b7280",
      rejected: "#ef4444",
      failed: "#ef4444",
      finding_rider: "#f97316",
      dispatch_failed: "#ef4444",
    };
    return map[status] ?? COLORS.light.primary;
  };

  const getStatusText = (status: OrderStatus) => {
    const map: Record<string, string> = {
      pending: "Pending",
      preparing: "Preparing",
      "ready-to-ship": "Ready to Ship",
      shipped: "Shipped",
      delivered: "Delivered",
      failed: "Failed",
      cancelled: "Cancelled",
      rejected: "Rejected",
      finding_rider: "Finding Rider",
      dispatch_failed: "Dispatch Failed",
    };
    return map[status] ?? status;
  };

  const getPaymentStatusColor = (status?: PaymentStatus) => {
    const map: Record<string, string> = {
      paid: "#10b981",
      pending: "#f59e0b",
      pending_verification: "#8b5cf6",
      failed: "#ef4444",
      cancelled: "#ef4444",
    };
    return map[status ?? ""] ?? "#6b7280";
  };

  const getPaymentStatusText = (status?: PaymentStatus) => {
    const map: Record<string, string> = {
      paid: "Paid",
      pending: "Pending",
      pending_verification: "Pending Verification",
      failed: "Failed",
      cancelled: "Cancelled",
    };
    return map[status ?? ""] ?? "Unknown";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={S.modalOverlay}>
        <View style={S.modalContent}>
          {/* ── Header ── */}
          <View style={S.modalHeader}>
            <Text style={S.modalTitle}>Order Details</Text>
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
                  <Text style={S.modalOrderNumber}>#{order.orderNumber}</Text>
                </View>
                <View>
                  <View
                    style={[
                      S.statusBadge,
                      { backgroundColor: getStatusColor(order.status) },
                    ]}
                  >
                    <Text style={S.statusText}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      S.modalOrderDate,
                      { marginTop: 6, textAlign: "right" },
                    ]}
                  >
                    {order.orderDate}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Customer ── */}
            <View style={S.modalSection}>
              <Text style={S.modalSectionTitle}>Customer</Text>
              <View style={S.modalCustomerCard}>
                <View style={S.modalCustomerTopRow}>
                  <View style={S.modalCustomerAvatar}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={COLORS.light.primary}
                    />
                  </View>
                  <View style={S.modalCustomerNameBlock}>
                    <Text style={S.modalCustomerName}>
                      {order.customerName || "N/A"}
                    </Text>
                    <Text style={S.modalCustomerRole}>Recipient</Text>
                  </View>
                </View>
                <View style={S.modalCustomerDivider} />
                <View style={S.modalCustomerAddressRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color="#aaa"
                    style={S.modalCustomerAddressIcon}
                  />
                  <Text style={S.modalAddress}>
                    {order.deliveryAddress || "Address not specified"}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Special Instructions ── */}
            {order.specialInstructions && (
              <View style={S.modalSection}>
                <Text style={S.modalSectionTitle}>Special Instructions</Text>
                <View style={S.specialInstructionsBox}>
                  <Text style={S.specialInstructionsText}>
                    {order.specialInstructions}
                  </Text>
                </View>
              </View>
            )}

            {/* ── Payment ── */}
            {order.paymentMethod && (
              <View style={S.modalSection}>
                <Text style={S.modalSectionTitle}>Payment</Text>
                <View style={S.modalPaymentCard}>
                  {/* Method row */}
                  <View style={S.modalPaymentRow}>
                    <Text style={S.modalPaymentLabel}>Method</Text>
                    <Text style={S.modalPaymentValue}>
                      {order.paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : "GCash"}
                    </Text>
                  </View>

                  {/* Status row */}
                  <View style={S.modalPaymentRow}>
                    <Text style={S.modalPaymentLabel}>Status</Text>
                    <Text
                      style={[
                        S.modalPaymentValue,
                        {
                          color: getPaymentStatusColor(order.paymentStatus),
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {getPaymentStatusText(order.paymentStatus)}
                    </Text>
                  </View>

                  {/* GCash extras */}
                  {order.paymentMethod === "gcash" && order.paymentProofUrl && (
                    <>
                      <View style={S.modalPaymentDivider} />

                      {/* Reference number */}
                      <View style={S.modalPaymentRow}>
                        <Text style={S.modalPaymentLabel}>Ref Number</Text>
                        <Text style={S.gcashReference}>
                          {order.gcashReference || "N/A"}
                        </Text>
                      </View>

                      {/* Payment proof — View button only */}
                      <View style={S.proofRow}>
                        <Text style={S.proofRowLabel}>Payment Proof</Text>
                        <TouchableOpacity
                          style={S.viewProofButton}
                          onPress={() => openProofImage(order.paymentProofUrl!)}
                        >
                          <Ionicons
                            name="eye-outline"
                            size={14}
                            color={COLORS.light.primary}
                          />
                          <Text style={S.viewProofButtonText}>View Proof</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Verification actions */}
                      {order.paymentStatus === "pending_verification" && (
                        <View style={S.verificationActions}>
                          <TouchableOpacity
                            style={S.verifyButton}
                            onPress={() => onVerifyPayment?.(order.id)}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color="#fff"
                            />
                            <Text style={S.verifyButtonText}>
                              Verify Payment
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={S.rejectButton}
                            onPress={() => onRejectPayment?.(order.id)}
                          >
                            <Ionicons
                              name="close-circle"
                              size={18}
                              color="#fff"
                            />
                            <Text style={S.rejectButtonText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
            )}

            {/* ── Delivery Proof Photos — View buttons only ── */}
            {(pickupProofUrl || deliveryProofUrl) && (
              <View style={S.modalSection}>
                <Text style={S.modalSectionTitle}>Delivery Proof</Text>
                <View style={S.modalPaymentCard}>
                  {pickupProofUrl && (
                    <View
                      style={[
                        S.proofRow,
                        { marginBottom: deliveryProofUrl ? 10 : 0 },
                      ]}
                    >
                      <Text style={S.proofRowLabel}>Pickup Proof</Text>
                      <TouchableOpacity
                        style={S.viewProofButton}
                        onPress={() => openProofImage(pickupProofUrl)}
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
                  {deliveryProofUrl && (
                    <View style={S.proofRow}>
                      <Text style={S.proofRowLabel}>Delivery Proof</Text>
                      <TouchableOpacity
                        style={S.viewProofButton}
                        onPress={() => openProofImage(deliveryProofUrl)}
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
            {/* ── Failure Reason (for failed orders) ── */}
            {order.status === "failed" && (
              <View style={S.modalSection}>
                <Text style={S.modalSectionTitle}>Failure Reason</Text>
                <View
                  style={{
                    backgroundColor: "#fef2f2",
                    borderRadius: 12,
                    padding: 14,
                    borderLeftWidth: 4,
                    borderLeftColor: "#dc2626",
                  }}
                >
                  <View
                    style={{ flexDirection: "row", alignItems: "flex-start" }}
                  >
                    <Ionicons
                      name="warning-outline"
                      size={20}
                      color="#dc2626"
                      style={{ marginRight: 10, marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#991b1b",
                          fontSize: 15,
                          fontWeight: "600",
                          marginBottom: 4,
                        }}
                      >
                        {order.failureReason || "No reason provided"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
            {/* ── Rider ── */}
            {order.riderAssignment && (
              <View style={S.modalSection}>
                <Text style={S.modalSectionTitle}>Rider</Text>
                <TouchableOpacity
                  style={S.modalRiderCard}
                  onPress={() =>
                    router.push({
                      pathname: "../seller/view-rider",
                      params: { rider_user_id: order.riderAssignment?.id },
                    })
                  }
                  activeOpacity={0.7}
                >
                  {order.riderAssignment.avatar ? (
                    <Image
                      source={order.riderAssignment.avatar}
                      style={S.riderAvatar}
                    />
                  ) : (
                    <View style={S.riderAvatarPlaceholder}>
                      <Text style={S.riderAvatarText}>
                        {order.riderAssignment.name?.charAt(0) || "R"}
                      </Text>
                    </View>
                  )}
                  <View style={S.riderInfo}>
                    <Text style={S.riderName} numberOfLines={1}>
                      {order.riderAssignment.name}
                    </Text>
                    {order.riderAssignment.status && (
                      <Text style={S.riderStatus} numberOfLines={1}>
                        {order.riderAssignment.status}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
              </View>
            )}

            {/* ── Items ── */}
            <View style={S.modalSection}>
              <Text style={S.modalSectionTitle}>Items</Text>
              {order.items.map((item) => {
                const freshness = computeFreshness(item.harvested_at);
                return (
                  <View key={item.id} style={S.modalItemRow}>
                    {typeof item.image === "string" && item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={S.modalItemImage}
                      />
                    ) : (
                      <View
                        style={[
                          S.modalItemImage,
                          { backgroundColor: "#e0e0e0" },
                        ]}
                      />
                    )}
                    <View style={S.modalItemDetails}>
                      <Text style={S.modalItemName}>{item.name}</Text>
                      {freshness.isPreOrder && (
                        <View style={S.preOrderBadge}>
                          <Text style={S.preOrderBadgeText}>Pre-order</Text>
                        </View>
                      )}
                    </View>
                    <View style={S.modalItemPrice}>
                      <Text style={S.modalItemPriceText}>
                        ₱{item.price.toLocaleString()}
                      </Text>
                      <Text style={S.modalItemQuantity}>×{item.quantity}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* ── Price Summary ── */}
            <View style={S.modalSection}>
              <Text style={S.modalSectionTitle}>Summary</Text>
              <View style={S.modalPriceSummaryCard}>
                <View style={S.modalPriceRow}>
                  <Text style={S.modalPriceLabel}>Subtotal</Text>
                  <Text style={S.modalPriceValue}>
                    ₱{subtotal.toLocaleString()}
                  </Text>
                </View>
                {deliveryFee > 0 && (
                  <View style={S.modalPriceRow}>
                    <Text style={S.modalPriceLabel}>Delivery Fee</Text>
                    <Text style={S.modalPriceValue}>
                      ₱{deliveryFee.toLocaleString()}
                    </Text>
                  </View>
                )}
                <View style={S.modalTotalRow}>
                  <Text style={S.modalTotalLabel}>Total</Text>
                  <Text style={S.modalTotalValue}>
                    ₱{order.totalAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
            {/* Report Buyer Button */}
            {order.status === "failed" &&
              order.customerId &&
              order.customerName && (
                <TouchableOpacity
                  style={[S.reportButton]}
                  onPress={() =>
                    onReportBuyer?.(
                      order.id,
                      order.customerId!,
                      order.customerName!,
                    )
                  }
                >
                  <Ionicons name="flag-outline" size={16} color="#ef4444" />
                  <Text style={S.reportButtonText}>Report Buyer</Text>
                </TouchableOpacity>
              )}

            {/* Report Rider Button */}
            {order.status === "failed" &&
              order.riderAssignment?.id &&
              order.riderAssignment?.name && (
                <TouchableOpacity
                  style={[S.reportButton, { marginTop: 12, marginBottom: 24 }]}
                  onPress={() =>
                    onReportRider?.(
                      order.id,
                      order.riderAssignment!.id,
                      order.riderAssignment!.name,
                    )
                  }
                >
                  <Ionicons name="flag-outline" size={16} color="#ef4444" />
                  <Text style={S.reportButtonText}>Report Rider</Text>
                </TouchableOpacity>
              )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const SellerOrders = () => {
  const [activeTab, setActiveTab] = useState<OrderStatus | "finding_rider">(
    "pending",
  );
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<DisplayOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { refreshPendingOrders } = useVendorOrderContext();

  // NEW: Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // NEW: Report modal state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    id: string;
    name: string;
    type: "buyer" | "seller" | "rider" | "order";
  } | null>(null);

  const navigation = useNavigation();
  const user = useUserStore((s) => s.user);

  const tabs: { key: OrderStatus | "finding_rider"; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "preparing", label: "Preparing" },
    { key: "ready-to-ship", label: "Ready to Ship" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "failed", label: "Failed" },
    { key: "cancelled", label: "Cancelled / Rejected" },
  ];

  // Handle order card press
  const handleOrderPress = (order: DisplayOrder) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  // NEW: Toggle search visibility
  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery("");
    }
  };

  const handleReport = (
    targetId: string,
    targetName: string,
    type: "buyer" | "seller" | "rider" | "order",
    orderId?: string,
  ) => {
    setReportTarget({ id: targetId, name: targetName, type });
    setReportModalVisible(true);
  };

  // Handle Cancel/Refund for failed orders - REUSING existing function
  const handleCancelFailedOrder = async (orderId: string) => {
    Alert.alert(
      "Cancel Order & Refund",
      "Are you sure you want to cancel this failed order? This will restore stock and process a refund if payment was made.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel Order",
          style: "destructive",
          onPress: async () => {
            try {
              setUpdatingOrderId(orderId);

              // Find current order for notification
              const currentOrder = orders.find((o) => o.id === orderId);

              // REUSE the existing vendor_cancel_order function
              const { error } = await supabase.rpc("vendor_cancel_order", {
                p_order_id: orderId,
                p_vendor_user_id: user?.id,
              });

              if (error) throw error;

              // Update local state
              setOrders((prevOrders) =>
                prevOrders.map((order) =>
                  order.id === orderId
                    ? { ...order, status: "cancelled" as OrderStatus }
                    : order,
                ),
              );

              if (selectedOrder?.id === orderId) {
                setSelectedOrder((prev) =>
                  prev ? { ...prev, status: "cancelled" as OrderStatus } : null,
                );
              }
              refreshPendingOrders();

              // Send notification to buyer
              if (currentOrder?.customerId && currentOrder) {
                await sendStatusUpdateNotification(
                  currentOrder,
                  "cancelled",
                  currentOrder.customerId,
                );
              }

              Alert.alert(
                "Success",
                currentOrder?.paymentStatus === "paid"
                  ? "Order has been cancelled and refund processed"
                  : "Order has been cancelled and stock restored",
              );

              setTimeout(() => {
                fetchOrders();
              }, 1000);
            } catch (error: any) {
              console.error("Cancel failed order error:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to cancel order. Please try again.",
              );
            } finally {
              setUpdatingOrderId(null);
            }
          },
        },
      ],
    );
  };
  // Handle Find Rider (retry dispatch)
  const handleFindRider = async (orderId: string) => {
    Alert.alert("Find Rider", "Looking for available riders again?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Find Rider",
        onPress: async () => {
          try {
            setUpdatingOrderId(orderId);

            const result = await dispatchService.handleOrderAcceptance(
              orderId,
              user?.id!,
            );

            if (result.success) {
              Alert.alert(
                "Success",
                `Found ${result.riderCount} rider(s)! Waiting for acceptance.`,
                [{ text: "OK" }],
              );
              // Refresh orders to show updated status
              fetchOrders();
            } else if (result.reason === "no_riders") {
              Alert.alert(
                "No Riders Available",
                "Still no riders available in your area. The order will remain in 'finding rider' status.",
                [{ text: "OK" }],
              );
            } else {
              Alert.alert(
                "Dispatch Failed",
                "Failed to find a rider. Please try again.",
                [{ text: "OK" }],
              );
            }
          } catch (error) {
            console.error("Find rider error:", error);
            Alert.alert(
              "Error",
              "An error occurred while finding a rider. Please try again.",
            );
          } finally {
            setUpdatingOrderId(null);
          }
        },
      },
    ]);
  };

  // Handle verify payment
  const handleVerifyPayment = async (orderId: string) => {
    Alert.alert(
      "Verify Payment",
      "Are you sure you want to verify this payment? The order will be marked as paid.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Verify",
          onPress: async () => {
            try {
              setUpdatingOrderId(orderId);

              const { error } = await supabase
                .from("orders")
                .update({
                  payment_status: "paid",
                  updated_at: new Date().toISOString(),
                })
                .eq("order_id", orderId)
                .eq("vendor_user_id", user?.id);

              if (error) throw error;

              // Update local state
              setOrders((prevOrders) =>
                prevOrders.map((order) =>
                  order.id === orderId
                    ? { ...order, paymentStatus: "paid" as PaymentStatus }
                    : order,
                ),
              );

              // Update selected order if modal is open
              if (selectedOrder?.id === orderId) {
                setSelectedOrder((prev) =>
                  prev
                    ? { ...prev, paymentStatus: "paid" as PaymentStatus }
                    : null,
                );
              }

              Alert.alert("Success", "Payment has been verified successfully");
            } catch (error: any) {
              console.error("Verify payment error:", error);
              Alert.alert("Error", error.message || "Failed to verify payment");
            } finally {
              setUpdatingOrderId(null);
            }
          },
        },
      ],
    );
  };

  // Handle reject payment
  const handleRejectPayment = async (orderId: string) => {
    Alert.alert(
      "Reject Payment",
      "Are you sure you want to reject this payment? This will cancel the order and restore stock.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              setUpdatingOrderId(orderId);

              // Call the database function to reject payment and restore stock
              const { error } = await supabase.rpc(
                "reject_payment_with_restock",
                {
                  p_order_id: orderId,
                  p_vendor_user_id: user?.id,
                },
              );

              if (error) throw error;

              // Update local state
              setOrders((prevOrders) =>
                prevOrders.map((order) =>
                  order.id === orderId
                    ? {
                        ...order,
                        paymentStatus: "failed" as PaymentStatus,
                        status: "rejected" as OrderStatus,
                      }
                    : order,
                ),
              );

              // Update selected order if modal is open
              if (selectedOrder?.id === orderId) {
                setSelectedOrder((prev) =>
                  prev
                    ? {
                        ...prev,
                        paymentStatus: "failed" as PaymentStatus,
                        status: "rejected" as OrderStatus,
                      }
                    : null,
                );
              }

              Alert.alert(
                "Success",
                "Payment has been rejected and stock restored",
              );
            } catch (error: any) {
              console.error("Reject payment error:", error);
              Alert.alert("Error", error.message || "Failed to reject payment");
            } finally {
              setUpdatingOrderId(null);
            }
          },
        },
      ],
    );
  };

  // Fetch rider assignment for an order
  const fetchRiderAssignment = async (orderId: string) => {
    try {
      const assignment = await dispatchService.getRiderAssignment(orderId);

      if (assignment) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  riderAssignment: {
                    id: assignment.id,
                    name: assignment.name,
                    avatar: assignment.avatar
                      ? { uri: assignment.avatar }
                      : null,
                    status:
                      assignment.status === "assigned"
                        ? "Assigned"
                        : assignment.status === "picked_up"
                          ? "Picked up"
                          : assignment.status === "ready_to_pickup"
                            ? "Ready to Pickup"
                            : assignment.status === "failed"
                              ? "Failed"
                              : assignment.status,
                    vehicle: assignment.vehicle,
                  },
                }
              : order,
          ),
        );

        // Update selected order if modal is open
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  riderAssignment: {
                    id: assignment.id,
                    name: assignment.name,
                    avatar: assignment.avatar
                      ? { uri: assignment.avatar }
                      : null,
                    status:
                      assignment.status === "assigned"
                        ? "Assigned"
                        : assignment.status === "picked_up"
                          ? "Picked up"
                          : assignment.status === "ready_to_pickup"
                            ? "Ready to Pickup"
                            : assignment.status,
                    vehicle: assignment.vehicle,
                  },
                }
              : null,
          );
        }
      }
    } catch (error) {
      console.error("Error fetching rider assignment:", error);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "preparing":
        return "#3b82f6";
      case "ready-to-ship":
        return "#8b5cf6";
      case "shipped":
        return "#10b981";
      case "delivered":
        return "#10b981";
      case "cancelled":
        return "#6b7280";
      case "failed":
        return "#ef4444";
      case "rejected":
        return "#ef4444";
      case "finding_rider":
        return "#f97316";
      case "dispatch_failed":
        return "#ef4444";
      default:
        return COLORS.light.primary;
    }
  };

  const fetchOrders = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `*, user_id, addresses:addresses(full_address), profiles:profiles(full_name)`,
        )
        .eq("vendor_user_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching vendor orders:", ordersError);
        Alert.alert("Error", "Failed to load orders");
        setOrders([]);
        return;
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        return;
      }

      // Batch-fetch order items for all orders
      const orderIds = (ordersData as any[]).map((o) => o.order_id);
      const { data: itemsAll, error: itemsAllError } = await supabase
        .from("order_items")
        .select(
          `*, products:products(product_id, product_name, images, harvested_at), order_id`,
        )
        .in("order_id", orderIds);

      if (itemsAllError) {
        console.error("Error fetching order items:", itemsAllError);
      }

      // Batch-fetch delivery info (for failure reasons and rider ids)
      const { data: deliveriesAll } = await supabase
        .from("deliveries")
        .select("order_id, failure_reason, rider_user_id, status")
        .in("order_id", orderIds);

      const itemsByOrder: Record<string, any[]> = {};
      (itemsAll || []).forEach((it: any) => {
        const oid = it.order_id;
        if (!itemsByOrder[oid]) itemsByOrder[oid] = [];
        itemsByOrder[oid].push(it);
      });

      const deliveriesByOrder: Record<string, any> = {};
      (deliveriesAll || []).forEach((d: any) => {
        if (d?.order_id) deliveriesByOrder[d.order_id] = d;
      });

      const displayOrders: DisplayOrder[] = (ordersData as any[]).map(
        (order) => {
          const itemsData = itemsByOrder[order.order_id] || [];
          const displayItems: OrderItem[] = itemsData.map((item: any) => ({
            id: item.order_item_id,
            productId: item.product_id,
            name: item.products?.product_name || "Unknown",
            price: parseFloat(item.unit_price) || 0,
            quantity: item.quantity,
            image: item.products?.images?.[0] || null,
            harvested_at: item.products?.harvested_at,
          }));

          const deliveryInfo = deliveriesByOrder[order.order_id];
          const failureReason = deliveryInfo?.failure_reason;

          return {
            id: order.order_id,
            orderNumber: order.order_number,
            items: displayItems,
            status: order.order_status as OrderStatus,
            totalAmount: parseFloat(order.total_amount) || 0,
            orderDate: new Date(order.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            paymentProofUrl: order.payment_proof_url,
            gcashReference: order.gcash_reference,
            deliveryAddress: order.addresses?.full_address,
            customerName: order.profiles?.full_name,
            customerId: order.user_id,
            specialInstructions: order.note,
            riderAssignment: null,
            failureReason,
          };
        },
      );

      setOrders(displayOrders);

      // Parallelize rider assignment fetching for relevant orders
      const riderPromises = displayOrders.map((order) => {
        const needs = [
          "preparing",
          "ready-to-ship",
          "shipped",
          "delivered",
          "failed",
          "finding_rider",
        ].includes(order.status as string);
        return needs ? fetchRiderAssignment(order.id) : Promise.resolve(null);
      });

      const riderResults = await Promise.all(riderPromises);
      riderResults.forEach((assignment, idx) => {
        if (assignment) {
          setOrders((prev) => {
            const copy = [...prev];
            const i = copy.findIndex((o) => o.id === displayOrders[idx].id);
            if (i >= 0) copy[i] = { ...copy[i], riderAssignment: assignment };
            return copy;
          });
        }
      });
    } catch (error) {
      console.error("Unexpected error fetching vendor orders:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Real-time subscription for delivery updates
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel("vendor-deliveries")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliveries",
        },
        async (payload) => {
          const deliveryId =
            (payload.new as any)?.delivery_id ||
            (payload.old as any)?.delivery_id;

          if (!deliveryId) return;

          const { data: order } = await supabase
            .from("orders")
            .select("order_id, vendor_user_id")
            .eq("delivery_id", deliveryId)
            .single();

          if (order?.vendor_user_id === user.id) {
            await fetchRiderAssignment(order.order_id);
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
  };

  // Check stock availability before accepting
  const checkStockAvailability = async (orderId: string): Promise<boolean> => {
    try {
      const { data: items, error } = await supabase
        .from("order_items")
        .select(
          `
          quantity,
          products!inner(
            product_id,
            product_name,
            stock
          )
        `,
        )
        .eq("order_id", orderId);

      if (error) throw error;

      const insufficientStock = items.filter(
        (item: any) => (item.products?.stock || 0) < item.quantity,
      );

      if (insufficientStock.length > 0) {
        const productNames = insufficientStock
          .map((item: any) => item.products.product_name)
          .join(", ");

        Alert.alert(
          "Insufficient Stock",
          `The following products don't have enough stock: ${productNames}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking stock:", error);
      Alert.alert("Error", "Failed to check stock availability");
      return false;
    }
  };

  const rejectOrderWithRestock = async (orderId: string) => {
    try {
      setUpdatingOrderId(orderId);

      // Find current order for notification
      const currentOrder = orders.find((o) => o.id === orderId);

      const { error } = await supabase.rpc("reject_order_with_restock", {
        p_order_id: orderId,
        p_vendor_user_id: user?.id,
      });

      if (error) {
        if (error.message.includes("Order not found")) {
          Alert.alert("Error", "Order not found or unauthorized");
          return;
        }
        if (error.message.includes("cannot be rejected")) {
          Alert.alert(
            "Cannot Reject",
            "This order cannot be rejected in its current status",
          );
          return;
        }
        throw error;
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, status: "rejected" as OrderStatus }
            : order,
        ),
      );
      refreshPendingOrders();

      // ========== SEND PUSH NOTIFICATION ==========
      if (currentOrder?.customerId && currentOrder) {
        await sendStatusUpdateNotification(
          currentOrder,
          "rejected",
          currentOrder.customerId,
        );
      }
      // ========== END PUSH NOTIFICATION ==========

      Alert.alert(
        "Success",
        "Order has been rejected and stock has been restored",
      );

      setTimeout(() => {
        fetchOrders();
      }, 1000);
    } catch (error: any) {
      console.error("Reject order error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to reject order. Please try again.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Update order status function
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);

      // Find the current order to get buyer ID and details
      const currentOrder = orders.find((o) => o.id === orderId);

      if (newStatus === "cancelled" || newStatus === "rejected") {
        await rejectOrderWithRestock(orderId);
        return;
      }

      const { error } = await supabase
        .from("orders")
        .update({
          order_status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === "preparing" && {
            processed_at: new Date().toISOString(),
          }),
        })
        .eq("order_id", orderId)
        .eq("vendor_user_id", user?.id);

      if (error) {
        console.error("Error updating order status:", error);
        Alert.alert("Error", "Failed to update order status");
        return;
      }

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );
      refreshPendingOrders();

      // ========== SEND PUSH NOTIFICATION ==========
      // Send notification to buyer about status change
      if (currentOrder?.customerId && currentOrder) {
        await sendStatusUpdateNotification(
          currentOrder,
          newStatus,
          currentOrder.customerId,
        );
      }
      // ========== END PUSH NOTIFICATION ==========

      if (newStatus === "preparing") {
        dispatchService
          .handleOrderAcceptance(orderId, user?.id!)
          .then((result) => {
            if (result.success) {
              console.log(
                `✅ Dispatch started: ${result.riderCount} riders found`,
              );
              fetchOrders();
            } else if (result.reason === "no_riders") {
              Alert.alert(
                "No Riders Available",
                "No riders are currently available in your area. The order will be placed in 'finding rider' status.",
                [{ text: "OK" }],
              );
              fetchOrders();
            }
          })
          .catch((error) => {
            console.error("Dispatch error:", error);
            Alert.alert(
              "Dispatch Error",
              "There was an error finding a rider. Please try again or contact support.",
              [{ text: "OK" }],
            );
            fetchOrders();
          });
      }

      Alert.alert("Success", `Order updated to ${newStatus} successfully`);
    } catch (error) {
      console.error("Unexpected error updating order:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Handle Accept Order with stock check
  const handleAcceptOrder = async (orderId: string) => {
    const hasStock = await checkStockAvailability(orderId);
    if (!hasStock) return;

    Alert.alert("Accept Order", "Accept this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: () => updateOrderStatus(orderId, "preparing"),
      },
    ]);
  };

  // Handle Reject Order
  const handleRejectOrder = (orderId: string) => {
    Alert.alert("Reject Order", "Are you sure you want to reject this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () => updateOrderStatus(orderId, "rejected"),
      },
    ]);
  };

  // Handle Cancel Order (for finding_rider, preparing, ready-to-ship)
  const handleCancelOrder = (orderId: string) => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? This action cannot be undone and will restore stock.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              setUpdatingOrderId(orderId);

              // Find current order for notification
              const currentOrder = orders.find((o) => o.id === orderId);

              const { error } = await supabase.rpc("vendor_cancel_order", {
                p_order_id: orderId,
                p_vendor_user_id: user?.id,
              });

              if (error) throw error;

              setOrders((prevOrders) =>
                prevOrders.map((order) =>
                  order.id === orderId
                    ? { ...order, status: "cancelled" as OrderStatus }
                    : order,
                ),
              );

              if (selectedOrder?.id === orderId) {
                setSelectedOrder((prev) =>
                  prev ? { ...prev, status: "cancelled" as OrderStatus } : null,
                );
              }
              refreshPendingOrders();

              // ========== SEND PUSH NOTIFICATION ==========
              if (currentOrder?.customerId && currentOrder) {
                await sendStatusUpdateNotification(
                  currentOrder,
                  "cancelled",
                  currentOrder.customerId,
                );
              }
              // ========== END PUSH NOTIFICATION ==========

              Alert.alert(
                "Success",
                "Order has been cancelled and stock restored",
              );
            } catch (error: any) {
              console.error("Cancel order error:", error);
              Alert.alert("Error", error.message || "Failed to cancel order");
            } finally {
              setUpdatingOrderId(null);
            }
          },
        },
      ],
    );
  };

  // Handle Mark Ready to Ship
  const handleMarkReadyToShip = (orderId: string) => {
    Alert.alert(
      "Mark Ready to Ship",
      "Is this order ready for pickup by the rider?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Ready",
          onPress: async () => {
            try {
              await updateOrderStatus(orderId, "ready-to-ship");

              const { data: delivery } = await supabase
                .from("deliveries")
                .select("delivery_id")
                .eq("order_id", orderId)
                .single();

              if (delivery) {
                const { error } = await supabase
                  .from("deliveries")
                  .update({
                    status: "ready_to_pickup",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("delivery_id", delivery.delivery_id);

                if (error) {
                  console.error("Error updating delivery status:", error);
                } else {
                  console.log(
                    `✅ Delivery ${delivery.delivery_id} marked as ready_to_pickup`,
                  );
                }
              }
            } catch (error) {
              console.error("Error in mark ready to ship:", error);
            }
          },
        },
      ],
    );
  };

  // Handle Mark as Shipped
  const handleMarkAsShipped = (orderId: string) => {
    Alert.alert(
      "Mark as Shipped",
      "Confirm that this order has been picked up by the rider?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => updateOrderStatus(orderId, "shipped"),
        },
      ],
    );
  };

  // Handle Process Payment
  const handleProcessPayment = async (orderId: string) => {
    Alert.alert(
      "Process Payment",
      "Have you received the cash payment for this order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Payment Received",
          onPress: async () => {
            try {
              setUpdatingOrderId(orderId);

              const { error } = await supabase
                .from("orders")
                .update({
                  payment_status: "paid",
                  updated_at: new Date().toISOString(),
                })
                .eq("order_id", orderId)
                .eq("vendor_user_id", user?.id);

              if (error) throw error;

              setOrders((prevOrders) =>
                prevOrders.map((order) =>
                  order.id === orderId
                    ? { ...order, paymentStatus: "paid" as PaymentStatus }
                    : order,
                ),
              );

              if (selectedOrder?.id === orderId) {
                setSelectedOrder((prev) =>
                  prev
                    ? { ...prev, paymentStatus: "paid" as PaymentStatus }
                    : null,
                );
              }

              Alert.alert("Success", "Payment has been processed successfully");
            } catch (error: any) {
              console.error("Process payment error:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to process payment",
              );
            } finally {
              setUpdatingOrderId(null);
            }
          },
        },
      ],
    );
  };
  // Send push notification for order status update
  const sendStatusUpdateNotification = async (
    order: DisplayOrder,
    newStatus: OrderStatus,
    buyerId: string,
  ) => {
    try {
      const statusMessages: Record<OrderStatus, string> = {
        pending: "Order is pending confirmation",
        preparing: "Order is being prepared",
        "ready-to-ship": "Order is ready for pickup",
        shipped: "Order is on its way!",
        delivered: "Order has been delivered! 🎉",
        failed: "Order delivery failed",
        cancelled: "Order has been cancelled",
        rejected: "Order has been rejected",
        finding_rider: "Looking for a rider",
        dispatch_failed: "Dispatch failed",
      };

      const statusTitles: Record<OrderStatus, string> = {
        pending: "Order Status Update",
        preparing: "Order Being Prepared",
        "ready-to-ship": "Order Ready for Pickup",
        shipped: "Order Shipped! 🚚",
        delivered: "Order Delivered! ✅",
        failed: "Delivery Failed ❌",
        cancelled: "Order Cancelled",
        rejected: "Order Rejected",
        finding_rider: "Finding Rider",
        dispatch_failed: "Dispatch Failed",
      };

      await createNotificationWithPush(
        {
          userId: buyerId,
          userType: "buyer",
          type: "order_status_update",
          title: statusTitles[newStatus],
          message: `${statusMessages[newStatus]}\nOrder #${order.orderNumber}`,
          metadata: {
            order_id: order.id,
            order_number: order.orderNumber,
            new_status: newStatus,
            old_status: order.status,
          },
          relatedId: order.id,
        },
        true,
      );
      console.log(
        `✅ Status update notification sent to buyer for order: ${order.orderNumber}`,
      );
    } catch (error) {
      console.error("Error sending status update notification:", error);
    }
  };
  // NEW: Filter orders based on search query (memoized)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // First filter by tab
      let tabMatch = false;
      if (activeTab === "cancelled") {
        tabMatch = order.status === "cancelled" || order.status === "rejected";
      } else if (activeTab === "preparing") {
        tabMatch =
          order.status === "preparing" || order.status === "finding_rider";
      } else {
        tabMatch = order.status === activeTab;
      }

      if (!tabMatch) return false;

      // Then filter by search query if present
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();

      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.items.some((item) => item.name.toLowerCase().includes(query)) ||
        order.deliveryAddress?.toLowerCase().includes(query) ||
        (order.paymentMethod &&
          order.paymentMethod.toLowerCase().includes(query)) ||
        (order.specialInstructions &&
          order.specialInstructions.toLowerCase().includes(query))
      );
    });
  }, [orders, activeTab, searchQuery]);

  const renderListItem = useCallback(
    ({ item }: { item: DisplayOrder }) => {
      return renderOrderCard(item);
    },
    [updatingOrderId, selectedOrder],
  );

  const renderOrderCard = (order: DisplayOrder) => {
    const isUpdating = updatingOrderId === order.id;

    return (
      <TouchableOpacity
        key={order.id}
        style={sellerOrderStyles.orderCard}
        onPress={() => handleOrderPress(order)}
        activeOpacity={0.7}
      >
        <View style={sellerOrderStyles.orderHeader}>
          <View style={sellerOrderStyles.leftColumn}>
            <Text style={sellerOrderStyles.orderId}>#{order.orderNumber}</Text>
            <Text style={sellerOrderStyles.orderDate}>{order.orderDate}</Text>
            <Text style={sellerOrderStyles.customerName}>
              {order.customerName}
            </Text>
          </View>
          <View
            style={[
              sellerOrderStyles.statusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Text style={sellerOrderStyles.statusText}>
              {order.status === "rejected"
                ? "Rejected"
                : order.status === "cancelled"
                  ? "Cancelled"
                  : order.status === "finding_rider"
                    ? "Finding Rider"
                    : order.status === "failed"
                      ? "Failed"
                      : order.status === "dispatch_failed"
                        ? "Dispatch Failed"
                        : tabs.find((t) => t.key === order.status)?.label ||
                          order.status}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        {order.items.slice(0, 2).map((item) => {
          const freshness = computeFreshness(item.harvested_at);

          return (
            <View key={item.id} style={sellerOrderStyles.itemRow}>
              {typeof item.image === "string" && item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={sellerOrderStyles.itemImage}
                />
              ) : (
                <Image
                  source={
                    (item.image as any) || require("@/assets/img/user.jpg")
                  }
                  style={sellerOrderStyles.itemImage}
                />
              )}
              <View style={sellerOrderStyles.itemDetails}>
                <View style={sellerOrderStyles.itemNameRow}>
                  <Text style={sellerOrderStyles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text style={sellerOrderStyles.itemPrice}>
                  ₱{item.price} × {item.quantity}
                </Text>
                {freshness.isPreOrder && (
                  <View style={sellerOrderStyles.preOrderBadge}>
                    <Text style={sellerOrderStyles.preOrderBadgeText}>
                      Pre-order
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {order.items.length > 2 && (
          <Text style={sellerOrderStyles.moreItemsText}>
            +{order.items.length - 2} more item(s)
          </Text>
        )}

        <View style={sellerOrderStyles.orderFooter}>
          <View style={sellerOrderStyles.totalRow}>
            <Text style={sellerOrderStyles.totalLabel}>Total Amount:</Text>
            <Text style={sellerOrderStyles.totalAmount}>
              ₱{order.totalAmount.toLocaleString()}
            </Text>
          </View>

          <View style={sellerOrderStyles.actionButtons}>
            {order.status === "pending" && (
              <>
                <TouchableOpacity
                  style={[
                    sellerOrderStyles.secondaryButton,
                    isUpdating && { opacity: 0.5 },
                  ]}
                  onPress={() => handleRejectOrder(order.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.light.primary}
                    />
                  ) : (
                    <Text style={sellerOrderStyles.secondaryButtonText}>
                      Reject Order
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    sellerOrderStyles.primaryButton,
                    isUpdating && { opacity: 0.5 },
                  ]}
                  onPress={() => handleAcceptOrder(order.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={sellerOrderStyles.primaryButtonText}>
                      Accept Order
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
            {order.status === "preparing" && (
              <>
                <TouchableOpacity
                  style={[
                    sellerOrderStyles.secondaryButton,
                    isUpdating && { opacity: 0.5 },
                  ]}
                  onPress={() => handleCancelOrder(order.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.light.coral}
                    />
                  ) : (
                    <Text
                      style={[
                        sellerOrderStyles.secondaryButtonText,
                        { color: COLORS.light.primary },
                      ]}
                    >
                      Cancel Order
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    sellerOrderStyles.primaryButton,
                    isUpdating && { opacity: 0.5 },
                  ]}
                  onPress={() => handleMarkReadyToShip(order.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={sellerOrderStyles.primaryButtonText}>
                      Mark Ready to Ship
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
            {order.status === "ready-to-ship" && (
              <>
                <TouchableOpacity
                  style={[
                    sellerOrderStyles.secondaryButton,
                    isUpdating && { opacity: 0.5 },
                  ]}
                  onPress={() => handleCancelOrder(order.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.light.coral}
                    />
                  ) : (
                    <Text
                      style={[
                        sellerOrderStyles.secondaryButtonText,
                        { color: COLORS.light.primary },
                      ]}
                    >
                      Cancel Order
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    sellerOrderStyles.primaryButton,
                    isUpdating && { opacity: 0.5 },
                  ]}
                  onPress={() => handleMarkAsShipped(order.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={sellerOrderStyles.primaryButtonText}>
                      Mark as Shipped
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
            {order.status === "finding_rider" && (
              <>
                <TouchableOpacity
                  style={[
                    sellerOrderStyles.secondaryButton,
                    isUpdating && { opacity: 0.5 },
                  ]}
                  onPress={() => handleCancelOrder(order.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.light.coral}
                    />
                  ) : (
                    <Text
                      style={[
                        sellerOrderStyles.secondaryButtonText,
                        { color: COLORS.light.primary },
                      ]}
                    >
                      Cancel Order
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    sellerOrderStyles.primaryButton,
                    isUpdating && { opacity: 0.5 },
                  ]}
                  onPress={() => handleFindRider(order.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={sellerOrderStyles.primaryButtonText}>
                      Find Rider
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
            {order.status === "shipped" && (
              <TouchableOpacity
                style={sellerOrderStyles.secondaryButton}
                onPress={() =>
                  router.push({
                    pathname: "/order-tracking",
                    params: {
                      orderId: order.id,
                      orderNumber: order.orderNumber,
                    },
                  })
                }
              >
                <Text style={sellerOrderStyles.secondaryButtonText}>
                  Track Shipment
                </Text>
              </TouchableOpacity>
            )}

            {order.status === "failed" && (
              <>
                <TouchableOpacity
                  style={[
                    sellerOrderStyles.secondaryButton,
                    isUpdating && { opacity: 0.5 },
                  ]}
                  onPress={() => handleCancelFailedOrder(order.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.light.coral}
                    />
                  ) : (
                    <Text
                      style={[
                        sellerOrderStyles.secondaryButtonText,
                        { color: COLORS.light.primary },
                      ]}
                    >
                      {order.paymentStatus === "paid"
                        ? "Cancel & Refund"
                        : "Cancel Order"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    sellerOrderStyles.primaryButton,
                    isUpdating && { opacity: 0.5 },
                  ]}
                  onPress={() => handleFindRider(order.id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={sellerOrderStyles.primaryButtonText}>
                      Find Rider Again
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
            {order.status === "delivered" && (
              <>
                {order.paymentMethod === "cod" &&
                  order.paymentStatus !== "paid" && (
                    <TouchableOpacity
                      style={sellerOrderStyles.primaryButton}
                      onPress={() => handleProcessPayment(order.id)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={sellerOrderStyles.primaryButtonText}>
                          Process Payment
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
              </>
            )}
            {(order.status === "cancelled" || order.status === "rejected") && (
              <TouchableOpacity
                style={sellerOrderStyles.secondaryButton}
                onPress={async () => {
                  if (!order.customerId) {
                    Alert.alert("Error", "Customer information not available");
                    return;
                  }

                  try {
                    // Get current user
                    const {
                      data: { user },
                    } = await supabase.auth.getUser();

                    if (!user) {
                      Alert.alert(
                        "Error",
                        "Please login to chat with customers",
                      );
                      return;
                    }

                    // Fetch buyer's avatar first
                    const { data: buyerProfile } = await supabase
                      .from("profiles")
                      .select("avatar_url")
                      .eq("user_id", order.customerId)
                      .single();

                    // Use chatService to get or create conversation
                    const { data: conversation, error } =
                      await chatService.getOrCreateConversation({
                        vendorId: user.id,
                        buyerId: order.customerId,
                      });

                    if (error) {
                      console.error("Error creating conversation:", error);
                      Alert.alert("Error", "Failed to start chat");
                      return;
                    }

                    // Navigate to chat screen with avatar
                    router.push({
                      pathname: "/buyer/chat",
                      params: {
                        conversationId: conversation.id,
                        otherPartyName: order.customerName || "Customer",
                        otherPartyId: order.customerId,
                        otherPartyType: "buyer",
                        otherPartyAvatar: buyerProfile?.avatar_url || "", // Add this line
                      },
                    });
                  } catch (error) {
                    console.error("Error starting chat:", error);
                    Alert.alert("Error", "Something went wrong");
                  }
                }}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.light.primary}
                  />
                ) : (
                  <Text style={sellerOrderStyles.secondaryButtonText}>
                    Contact Buyer
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
        {order.paymentMethod === "gcash" &&
          order.paymentStatus === "pending_verification" && (
            <View style={sellerOrderStyles.pendingVerificationBadge}>
              <Text style={sellerOrderStyles.pendingVerificationText}>
                Payment Pending Verification
              </Text>
            </View>
          )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={sellerOrderStyles.container}>
        <View style={sellerOrderStyles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={sellerOrderStyles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={sellerOrderStyles.headerTitle}>Orders</Text>
          <View style={{ width: 24 }} />
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.light.primary} />
          <Text style={{ marginTop: 12 }}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sellerOrderStyles.container}>
      {/* Header with Search Button */}
      <View style={sellerOrderStyles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={sellerOrderStyles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={sellerOrderStyles.headerTitle}>Orders</Text>
        <TouchableOpacity onPress={toggleSearch} style={{ padding: 8 }}>
          <Ionicons
            name={isSearchVisible ? "close" : "search"}
            size={24}
            color={COLORS.light.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {isSearchVisible && (
        <View
          style={{
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 16,
            paddingBottom: 8,
          }}
        >
          <View style={sellerOrderStyles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#666"
              style={sellerOrderStyles.searchIcon}
            />
            <TextInput
              style={sellerOrderStyles.searchInput}
              placeholder="Search by order #, customer, product..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={sellerOrderStyles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={sellerOrderStyles.tabsContainer}
        contentContainerStyle={sellerOrderStyles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              sellerOrderStyles.tab,
              activeTab === tab.key && sellerOrderStyles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                sellerOrderStyles.tabText,
                activeTab === tab.key && sellerOrderStyles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderListItem}
        contentContainerStyle={sellerOrderStyles.ordersContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        initialNumToRender={6}
        ListEmptyComponent={() => (
          <View style={sellerOrderStyles.emptyState}>
            <Text style={sellerOrderStyles.emptyIcon}>
              {searchQuery.length > 0 ? "🔍" : "📦"}
            </Text>
            <Text style={sellerOrderStyles.emptyTitle}>
              {searchQuery.length > 0
                ? "No matching orders"
                : "No orders found"}
            </Text>
          </View>
        )}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onVerifyPayment={handleVerifyPayment}
        onRejectPayment={handleRejectPayment}
        onFindRider={handleFindRider}
        onReportBuyer={(orderId, customerId, customerName) => {
          setReportTarget({
            id: customerId,
            name: customerName,
            type: "buyer",
          });
          setReportModalVisible(true);
        }}
        onReportRider={(orderId, riderId, riderName) => {
          setReportTarget({ id: riderId, name: riderName, type: "rider" });
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
        reporterId={user?.id || ""}
        orderId={reportTarget?.type !== "order" ? selectedOrder?.id : undefined}
        onReportSubmitted={() => {
          Alert.alert("Success", "Report submitted successfully");
        }}
      />
    </SafeAreaView>
  );
};

export default SellerOrders;
