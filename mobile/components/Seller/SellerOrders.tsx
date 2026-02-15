import React, { useState, useEffect } from "react";
import {
  View,
  Text,
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { COLORS } from "@/constants";
import { sellerOrderStyles } from "./styles/sellerOrderStyles";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { computeFreshness } from "@/utils/freshness";

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready-to-ship"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "rejected";

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
  specialInstructions?: string;
  riderAssignment?: any | null;
};

// Order Details Modal Component
const OrderDetailsModal = ({
  visible,
  onClose,
  order,
  onVerifyPayment,
  onRejectPayment,
}: {
  visible: boolean;
  onClose: () => void;
  order: DisplayOrder | null;
  onVerifyPayment?: (orderId: string) => void;
  onRejectPayment?: (orderId: string) => void;
}) => {
  if (!order) return null;

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const deliveryFee = order.totalAmount - subtotal;

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
      case "rejected":
        return "#ef4444";
      default:
        return COLORS.light.primary;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "preparing":
        return "Preparing";
      case "ready-to-ship":
        return "Ready to Ship";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status?: PaymentStatus) => {
    switch (status) {
      case "paid":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "pending_verification":
        return "#8b5cf6";
      case "failed":
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getPaymentStatusText = (status?: PaymentStatus) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "pending":
        return "Pending";
      case "pending_verification":
        return "Pending Verification";
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const openProofImage = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={sellerOrderStyles.modalOverlay}>
        <View style={sellerOrderStyles.modalContent}>
          {/* Modal Header */}
          <View style={sellerOrderStyles.modalHeader}>
            <Text style={sellerOrderStyles.modalTitle}>Order Details</Text>
            <TouchableOpacity
              onPress={onClose}
              style={sellerOrderStyles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Order Info */}
            <View style={sellerOrderStyles.modalSection}>
              <View style={sellerOrderStyles.modalOrderInfo}>
                <View>
                  <Text style={sellerOrderStyles.modalOrderLabel}>
                    Order Number
                  </Text>
                  <Text style={sellerOrderStyles.modalOrderNumber}>
                    #{order.orderNumber}
                  </Text>
                </View>
                <View
                  style={[
                    sellerOrderStyles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) },
                  ]}
                >
                  <Text style={sellerOrderStyles.statusText}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>
              <Text style={sellerOrderStyles.modalOrderDate}>
                {order.orderDate}
              </Text>
            </View>

            {/* Customer Info */}
            <View style={sellerOrderStyles.modalSection}>
              <Text style={sellerOrderStyles.modalSectionTitle}>
                Customer Information
              </Text>
              <Text style={sellerOrderStyles.modalCustomerName}>
                {order.customerName || "N/A"}
              </Text>
              <Text style={sellerOrderStyles.modalAddress}>
                {order.deliveryAddress || "Address not specified"}
              </Text>
            </View>

            {/* Special Instructions */}
            {order.specialInstructions && (
              <View style={sellerOrderStyles.modalSection}>
                <Text style={sellerOrderStyles.modalSectionTitle}>
                  Special Instructions
                </Text>
                <View style={sellerOrderStyles.specialInstructionsBox}>
                  <Text style={sellerOrderStyles.specialInstructionsText}>
                    {order.specialInstructions}
                  </Text>
                </View>
              </View>
            )}

            {/* Payment Info */}
            {order.paymentMethod && (
              <View style={sellerOrderStyles.modalSection}>
                <Text style={sellerOrderStyles.modalSectionTitle}>
                  Payment Information
                </Text>
                <View style={sellerOrderStyles.modalPaymentRow}>
                  <Text style={sellerOrderStyles.modalPaymentLabel}>
                    Method:
                  </Text>
                  <Text style={sellerOrderStyles.modalPaymentValue}>
                    {order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : "GCash"}
                  </Text>
                </View>
                <View style={sellerOrderStyles.modalPaymentRow}>
                  <Text style={sellerOrderStyles.modalPaymentLabel}>
                    Status:
                  </Text>
                  <Text
                    style={[
                      sellerOrderStyles.modalPaymentValue,
                      {
                        color: getPaymentStatusColor(order.paymentStatus),
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {getPaymentStatusText(order.paymentStatus)}
                  </Text>
                </View>

                {/* GCash Payment Details - Show only for GCash payments */}
                {order.paymentMethod === "gcash" && order.paymentProofUrl && (
                  <View style={sellerOrderStyles.gcashDetails}>
                    <View style={sellerOrderStyles.modalPaymentRow}>
                      <Text style={sellerOrderStyles.modalPaymentLabel}>
                        Ref Number:
                      </Text>
                      <Text style={sellerOrderStyles.gcashReference}>
                        {order.gcashReference || "N/A"}
                      </Text>
                    </View>

                    <Text style={sellerOrderStyles.proofLabel}>
                      Payment Proof:
                    </Text>
                    <TouchableOpacity
                      style={sellerOrderStyles.proofImageContainer}
                      onPress={() => openProofImage(order.paymentProofUrl!)}
                    >
                      <Image
                        source={{ uri: order.paymentProofUrl }}
                        style={sellerOrderStyles.proofImage}
                        resizeMode="contain"
                      />
                      <View style={sellerOrderStyles.proofOverlay}>
                        <Ionicons name="eye-outline" size={24} color="#fff" />
                        <Text style={sellerOrderStyles.proofOverlayText}>
                          Tap to view full image
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Payment Verification Actions - Only show for pending_verification */}
                    {order.paymentStatus === "pending_verification" && (
                      <View style={sellerOrderStyles.verificationActions}>
                        <TouchableOpacity
                          style={sellerOrderStyles.verifyButton}
                          onPress={() => onVerifyPayment?.(order.id)}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#fff"
                          />
                          <Text style={sellerOrderStyles.verifyButtonText}>
                            Verify Payment
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={sellerOrderStyles.rejectButton}
                          onPress={() => onRejectPayment?.(order.id)}
                        >
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color="#fff"
                          />
                          <Text style={sellerOrderStyles.rejectButtonText}>
                            Reject Payment
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Rider Info */}
            {order.riderAssignment && (
              <View style={sellerOrderStyles.modalSection}>
                <Text style={sellerOrderStyles.modalSectionTitle}>
                  Rider Information
                </Text>
                <View style={sellerOrderStyles.riderRow}>
                  {order.riderAssignment.avatar ? (
                    <Image
                      source={order.riderAssignment.avatar}
                      style={sellerOrderStyles.riderAvatar}
                    />
                  ) : (
                    <View style={sellerOrderStyles.riderAvatarPlaceholder}>
                      <Text style={sellerOrderStyles.riderAvatarText}>
                        {order.riderAssignment.name?.charAt(0) || "R"}
                      </Text>
                    </View>
                  )}
                  <View style={sellerOrderStyles.riderInfo}>
                    <Text style={sellerOrderStyles.riderName} numberOfLines={1}>
                      {order.riderAssignment.name}
                    </Text>
                    {order.riderAssignment.status && (
                      <Text
                        style={sellerOrderStyles.riderStatus}
                        numberOfLines={1}
                      >
                        {order.riderAssignment.status}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Order Items */}
            <View style={sellerOrderStyles.modalSection}>
              <Text style={sellerOrderStyles.modalSectionTitle}>Items</Text>
              {order.items.map((item) => {
                const freshness = computeFreshness(item.harvested_at);
                return (
                  <View key={item.id} style={sellerOrderStyles.modalItemRow}>
                    {typeof item.image === "string" && item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={sellerOrderStyles.modalItemImage}
                      />
                    ) : (
                      <View
                        style={[
                          sellerOrderStyles.modalItemImage,
                          { backgroundColor: "#e0e0e0" },
                        ]}
                      />
                    )}
                    <View style={sellerOrderStyles.modalItemDetails}>
                      <Text style={sellerOrderStyles.modalItemName}>
                        {item.name}
                      </Text>
                      {freshness.isPreOrder && (
                        <View style={sellerOrderStyles.preOrderBadge}>
                          <Text style={sellerOrderStyles.preOrderBadgeText}>
                            Pre-order
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={sellerOrderStyles.modalItemPrice}>
                      <Text style={sellerOrderStyles.modalItemPriceText}>
                        ₱{item.price.toLocaleString()}
                      </Text>
                      <Text style={sellerOrderStyles.modalItemQuantity}>
                        x{item.quantity}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Price Summary */}
            <View style={sellerOrderStyles.modalSection}>
              <Text style={sellerOrderStyles.modalSectionTitle}>
                Price Summary
              </Text>
              <View style={sellerOrderStyles.modalPriceRow}>
                <Text style={sellerOrderStyles.modalPriceLabel}>Subtotal</Text>
                <Text style={sellerOrderStyles.modalPriceValue}>
                  ₱{subtotal.toLocaleString()}
                </Text>
              </View>
              {deliveryFee > 0 && (
                <View style={sellerOrderStyles.modalPriceRow}>
                  <Text style={sellerOrderStyles.modalPriceLabel}>
                    Delivery Fee
                  </Text>
                  <Text style={sellerOrderStyles.modalPriceValue}>
                    ₱{deliveryFee.toLocaleString()}
                  </Text>
                </View>
              )}
              <View
                style={[
                  sellerOrderStyles.modalPriceRow,
                  sellerOrderStyles.modalTotalRow,
                ]}
              >
                <Text style={sellerOrderStyles.modalTotalLabel}>
                  Total Amount
                </Text>
                <Text style={sellerOrderStyles.modalTotalValue}>
                  ₱{order.totalAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const SellerOrders = () => {
  const [activeTab, setActiveTab] = useState<OrderStatus>("pending");
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<DisplayOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const user = useUserStore((s) => s.user);

  const tabs: { key: OrderStatus; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "preparing", label: "Preparing" },
    { key: "ready-to-ship", label: "Ready to Ship" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled / Rejected" },
  ];

  // Handle order card press
  const handleOrderPress = (order: DisplayOrder) => {
    setSelectedOrder(order);
    setModalVisible(true);
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
      case "rejected":
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
          `*, addresses:addresses(full_address), profiles:profiles(full_name)`,
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

      const displayOrders: DisplayOrder[] = [];

      for (const order of ordersData as any) {
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(
            `*, products:products(product_id, product_name, images, harvested_at)`,
          )
          .eq("order_id", order.order_id);

        if (itemsError) {
          console.error("Error fetching order items:", itemsError);
          continue;
        }

        const displayItems: OrderItem[] = (itemsData || []).map(
          (item: any) => ({
            id: item.order_item_id,
            productId: item.product_id,
            name: item.products?.product_name || "Unknown",
            price: parseFloat(item.unit_price) || 0,
            quantity: item.quantity,
            image: item.products?.images?.[0] || null,
            harvested_at: item.products?.harvested_at,
          }),
        );

        displayOrders.push({
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
          specialInstructions: order.note,
          riderAssignment: null,
        });
      }

      setOrders(displayOrders);
    } catch (error) {
      console.error("Unexpected error fetching vendor orders:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

  // Reject order with restock
  const rejectOrderWithRestock = async (orderId: string) => {
    try {
      setUpdatingOrderId(orderId);

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

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );

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

    Alert.alert("Accept Order", "Are you sure you want to accept this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        onPress: () => updateOrderStatus(orderId, "preparing"),
      },
    ]);
  };

  // Handle Reject Order
  const handleRejectOrder = (orderId: string) => {
    Alert.alert(
      "Reject Order",
      "Are you sure you want to reject this order? This will cancel the order and restore product stock.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => updateOrderStatus(orderId, "rejected"),
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
          onPress: () => updateOrderStatus(orderId, "ready-to-ship"),
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

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "cancelled") {
      return o.status === "cancelled" || o.status === "rejected";
    }
    return o.status === activeTab;
  });

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
                  : tabs.find((t) => t.key === order.status)?.label ||
                    order.status}
            </Text>
          </View>
        </View>

        {/* Payment Status Indicator for GCash */}

        {order.riderAssignment ? (
          <View style={sellerOrderStyles.riderRow}>
            {order.riderAssignment.avatar ? (
              <Image
                source={order.riderAssignment.avatar}
                style={sellerOrderStyles.riderAvatar}
              />
            ) : (
              <View style={sellerOrderStyles.riderAvatarPlaceholder}>
                <Text style={sellerOrderStyles.riderAvatarText}>
                  {order.riderAssignment.name.charAt(0)}
                </Text>
              </View>
            )}
            <View style={sellerOrderStyles.riderInfo}>
              <Text style={sellerOrderStyles.riderName} numberOfLines={1}>
                {order.riderAssignment.name}
              </Text>
              {order.riderAssignment.status && (
                <Text style={sellerOrderStyles.riderStatus} numberOfLines={1}>
                  {order.riderAssignment.status}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={sellerOrderStyles.riderAction}
              onPress={() =>
                router.push(`/rider/${order.riderAssignment?.id}` as any)
              }
            >
              <Text style={sellerOrderStyles.riderActionText}>View</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={sellerOrderStyles.unassignedRow}>
            <Text style={sellerOrderStyles.unassignedText}>
              No rider assigned
            </Text>
          </View>
        )}

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
            )}
            {order.status === "ready-to-ship" && (
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
            )}
            {order.status === "shipped" && (
              <TouchableOpacity
                style={sellerOrderStyles.secondaryButton}
                onPress={() => router.push("/order-tracking")}
              >
                <Text style={sellerOrderStyles.secondaryButtonText}>
                  Track Shipment
                </Text>
              </TouchableOpacity>
            )}
            {order.status === "delivered" && (
              <>
                <TouchableOpacity style={sellerOrderStyles.secondaryButton}>
                  <Text style={sellerOrderStyles.secondaryButtonText}>
                    View Invoice
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={sellerOrderStyles.primaryButton}>
                  <Text style={sellerOrderStyles.primaryButtonText}>
                    Process Payment
                  </Text>
                </TouchableOpacity>
              </>
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
      {/* Header */}
      <View style={sellerOrderStyles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={sellerOrderStyles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={sellerOrderStyles.headerTitle}>Orders</Text>
        <View style={{ width: 24 }} />
      </View>

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
      <ScrollView
        style={sellerOrderStyles.ordersContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.light.primary]}
          />
        }
      >
        {filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrderCard)
        ) : (
          <View style={sellerOrderStyles.emptyState}>
            <Text style={sellerOrderStyles.emptyIcon}>📦</Text>
            <Text style={sellerOrderStyles.emptyTitle}>No orders found</Text>
            <Text style={sellerOrderStyles.emptyDescription}>
              You don't have any orders in this category yet
            </Text>
          </View>
        )}
      </ScrollView>

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
      />
    </SafeAreaView>
  );
};

export default SellerOrders;
