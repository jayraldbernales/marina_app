// app/buyer/orders/index.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { COLORS } from "@/constants";
import { orderStyles } from "../components/styles/orderStyles";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { computeFreshness } from "@/utils/freshness";
import { chatService } from "@/lib/chat";

// UPDATED: Added 'rejected' to OrderStatus type
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

// UPDATED: Added vendorId to items
interface DisplayOrder {
  id: string;
  orderNumber: string;
  items: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    vendor: string;
    vendorId?: string;
    image: string | null;
    harvested_at?: string;
  }[];
  status: OrderStatus;
  totalAmount: number;
  subtotal?: number;
  deliveryFee: number;
  orderDate: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentProofUrl?: string; // ADD THIS
  gcashReference?: string; // ADD THIS
  note?: string; // ADD THIS (for special instructions)
  deliveryAddress: string;
  vendorShopName?: string;
  vendorId?: string;
}

// NEW: Order Details Modal Component with Special Instructions and GCash Proof
const OrderDetailsModal = ({
  visible,
  onClose,
  order,
}: {
  visible: boolean;
  onClose: () => void;
  order: DisplayOrder | null;
}) => {
  if (!order) return null;

  const subtotal =
    order.subtotal ||
    order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
        return "Completed";
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
      <View style={orderStyles.modalOverlay}>
        <View style={orderStyles.modalContent}>
          {/* Modal Header */}
          <View style={orderStyles.modalHeader}>
            <Text style={orderStyles.modalTitle}>Order Details</Text>
            <TouchableOpacity
              onPress={onClose}
              style={orderStyles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Order Info */}
            <View style={orderStyles.modalSection}>
              <View style={orderStyles.modalOrderInfo}>
                <View>
                  <Text style={orderStyles.modalOrderLabel}>Order Number</Text>
                  <Text style={orderStyles.modalOrderNumber}>
                    #{order.orderNumber}
                  </Text>
                </View>
                <View
                  style={[
                    orderStyles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) },
                  ]}
                >
                  <Text style={orderStyles.statusText}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>
              <Text style={orderStyles.modalOrderDate}>{order.orderDate}</Text>
            </View>

            {/* Delivery Address */}
            <View style={orderStyles.modalSection}>
              <Text style={orderStyles.modalSectionTitle}>
                Delivery Address
              </Text>
              <Text style={orderStyles.modalAddress}>
                {order.deliveryAddress}
              </Text>
            </View>

            {/* Special Instructions - ADD THIS SECTION */}
            {order.note && (
              <View style={orderStyles.modalSection}>
                <Text style={orderStyles.modalSectionTitle}>
                  Special Instructions
                </Text>
                <View style={orderStyles.specialInstructionsBox}>
                  <Text style={orderStyles.specialInstructionsText}>
                    {order.note}
                  </Text>
                </View>
              </View>
            )}

            {/* Payment Info - UPDATED with GCash proof */}
            <View style={orderStyles.modalSection}>
              <Text style={orderStyles.modalSectionTitle}>
                Payment Information
              </Text>
              <View style={orderStyles.modalPaymentRow}>
                <Text style={orderStyles.modalPaymentLabel}>
                  Payment Method:
                </Text>
                <Text style={orderStyles.modalPaymentValue}>
                  {order.paymentMethod === "cod" ? "Cash on Delivery" : "GCash"}
                </Text>
              </View>
              <View style={orderStyles.modalPaymentRow}>
                <Text style={orderStyles.modalPaymentLabel}>
                  Payment Status:
                </Text>
                <Text
                  style={[
                    orderStyles.modalPaymentValue,
                    { color: getPaymentStatusColor(order.paymentStatus) },
                  ]}
                >
                  {getPaymentStatusText(order.paymentStatus)}
                </Text>
              </View>

              {/* GCash Payment Proof - ADD THIS SECTION */}
              {order.paymentMethod === "gcash" && order.paymentProofUrl && (
                <View style={orderStyles.gcashProofSection}>
                  <Text style={orderStyles.proofLabel}>Payment Proof:</Text>
                  <TouchableOpacity
                    style={orderStyles.proofImageContainer}
                    onPress={() => openProofImage(order.paymentProofUrl!)}
                  >
                    <Image
                      source={{ uri: order.paymentProofUrl }}
                      style={orderStyles.proofImage}
                      resizeMode="contain"
                    />
                    <View style={orderStyles.proofOverlay}>
                      <Ionicons name="eye-outline" size={24} color="#fff" />
                      <Text style={orderStyles.proofOverlayText}>
                        Tap to view full image
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {order.gcashReference && (
                    <View style={orderStyles.referenceRow}>
                      <Text style={orderStyles.referenceLabel}>
                        Reference Number:
                      </Text>
                      <Text style={orderStyles.referenceValue}>
                        {order.gcashReference}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Order Items */}
            <View style={orderStyles.modalSection}>
              <Text style={orderStyles.modalSectionTitle}>Items</Text>
              {order.items.map((item) => {
                const freshness = computeFreshness(item.harvested_at);
                return (
                  <View key={item.id} style={orderStyles.modalItemRow}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={orderStyles.modalItemImage}
                      />
                    ) : (
                      <View
                        style={[
                          orderStyles.modalItemImage,
                          { backgroundColor: "#e0e0e0" },
                        ]}
                      />
                    )}
                    <View style={orderStyles.modalItemDetails}>
                      <Text style={orderStyles.modalItemName}>{item.name}</Text>
                      <Text style={orderStyles.modalItemVendor}>
                        {item.vendor}
                      </Text>
                      {freshness.isPreOrder && (
                        <View style={orderStyles.preOrderBadge}>
                          <Text style={orderStyles.preOrderBadgeText}>
                            Pre-order
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={orderStyles.modalItemPrice}>
                      <Text style={orderStyles.modalItemPriceText}>
                        ₱{item.price.toLocaleString()}
                      </Text>
                      <Text style={orderStyles.modalItemQuantity}>
                        x{item.quantity}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Price Summary */}
            <View style={orderStyles.modalSection}>
              <Text style={orderStyles.modalSectionTitle}>Price Summary</Text>
              <View style={orderStyles.modalPriceRow}>
                <Text style={orderStyles.modalPriceLabel}>Subtotal</Text>
                <Text style={orderStyles.modalPriceValue}>
                  ₱{subtotal.toLocaleString()}
                </Text>
              </View>
              {order.deliveryFee > 0 && (
                <View style={orderStyles.modalPriceRow}>
                  <Text style={orderStyles.modalPriceLabel}>Delivery Fee</Text>
                  <Text style={orderStyles.modalPriceValue}>
                    ₱{order.deliveryFee.toLocaleString()}
                  </Text>
                </View>
              )}
              <View
                style={[orderStyles.modalPriceRow, orderStyles.modalTotalRow]}
              >
                <Text style={orderStyles.modalTotalLabel}>Total Amount</Text>
                <Text style={orderStyles.modalTotalValue}>
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

const OrdersScreen = () => {
  const [activeTab, setActiveTab] = useState<string>("to-pay");
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DisplayOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const user = useUserStore((state) => state.user);

  const tabs = [
    { key: "to-pay", label: "To Pay" },
    { key: "to-ship", label: "To Ship" },
    { key: "to-receive", label: "To Receive" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled / Rejected" },
  ];

  // UPDATED: Map database status to UI tab - include rejected in cancelled tab
  const getUITabFromDBStatus = (dbStatus: OrderStatus): string => {
    switch (dbStatus) {
      case "pending":
        return "to-pay";
      case "preparing":
      case "ready-to-ship":
        return "to-ship";
      case "shipped":
        return "to-receive";
      case "delivered":
        return "completed";
      case "cancelled":
      case "rejected":
        return "cancelled";
      default:
        return "to-pay";
    }
  };

  // Helper function to update order status locally
  const updateOrderStatusLocally = (
    orderId: string,
    newStatus: OrderStatus,
    newPaymentStatus: PaymentStatus,
  ) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: newStatus,
              paymentStatus: newPaymentStatus,
            }
          : order,
      ),
    );
  };

  // UPDATED: Handle order card press to show modal instead of product details
  const handleOrderPress = (order: DisplayOrder) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  // Handle contact seller
  const handleContactSeller = async (vendorName: string, vendorId?: string) => {
    if (!vendorId) {
      Alert.alert("Error", "Vendor information not available");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "Please login to chat with vendors");
        return;
      }

      const { data: conversation, error } =
        await chatService.getOrCreateConversation({
          buyerId: user.id,
          vendorId: vendorId,
        });

      if (error) {
        console.error("Error creating conversation:", error);
        Alert.alert("Error", "Failed to start chat");
        return;
      }

      router.push({
        pathname: "../buyer/chat",
        params: {
          conversationId: conversation.id,
          otherPartyName: vendorName,
          otherPartyId: vendorId,
          otherPartyType: "vendor",
          otherPartyAvatar: "",
        },
      });
    } catch (err) {
      console.error("Error in chat:", err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  // Fetch orders from Supabase
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
          `
          *,
          addresses!inner(full_address)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        Alert.alert("Error", "Failed to load orders");
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
            `
            *,
            products!inner(
              product_id,
              product_name,
              images,
              harvested_at,
              vendor_profiles!inner(
                shop_name,
                user_id
              )
            )
          `,
          )
          .eq("order_id", order.order_id);

        if (itemsError) {
          console.error("Error fetching order items:", itemsError);
          continue;
        }

        const displayItems = (itemsData || []).map((item: any) => ({
          id: item.order_item_id,
          productId: item.product_id,
          name: item.products.product_name,
          price: item.unit_price,
          quantity: item.quantity,
          vendor: item.products.vendor_profiles?.shop_name || "Unknown Vendor",
          vendorId: item.products.vendor_profiles?.user_id,
          image: item.products.images?.[0] || null,
          harvested_at: item.products.harvested_at,
        }));

        // In fetchOrders, when creating displayOrder:
        const displayOrder: DisplayOrder = {
          id: order.order_id,
          orderNumber: order.order_number,
          items: displayItems,
          status: order.order_status,
          totalAmount: parseFloat(order.total_amount) || 0,
          subtotal: order.subtotal ? parseFloat(order.subtotal) : undefined,
          deliveryFee: order.delivery_fee ? parseFloat(order.delivery_fee) : 0,
          orderDate: new Date(order.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          paymentMethod: order.payment_method,
          paymentStatus: order.payment_status,
          paymentProofUrl: order.payment_proof_url, // ADD THIS
          gcashReference: order.gcash_reference, // ADD THIS
          note: order.note, // ADD THIS (special instructions)
          deliveryAddress:
            order.addresses?.full_address || "Address not specified",
          vendorShopName: displayItems[0]?.vendor,
          vendorId: displayItems[0]?.vendorId,
        };
        displayOrders.push(displayOrder);
      }

      setOrders(displayOrders);
    } catch (error) {
      console.error("Unexpected error:", error);
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

  const filteredOrders = orders.filter((order) => {
    const uiTab = getUITabFromDBStatus(order.status);
    if (activeTab === "cancelled") {
      return order.status === "cancelled" || order.status === "rejected";
    }
    return uiTab === activeTab;
  });

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
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  // UPDATED: Pay Now handler with conditions
  const handlePayNow = async (
    orderId: string,
    paymentMethod: string,
    paymentStatus: string,
  ) => {
    // Don't show Pay Now if payment status is pending_verification
    if (paymentStatus === "pending_verification") {
      Alert.alert(
        "Payment Pending Verification",
        "Your payment is currently being verified. Please wait for confirmation.",
      );
      return;
    }

    // Only proceed with payment for COD orders or if payment is still pending
    if (paymentMethod === "cod") {
      Alert.alert("Payment", "This would redirect to payment gateway");
      // Implement payment gateway integration here
    } else {
      Alert.alert("Payment Method", "Online payments will be processed here.");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            const { error } = await supabase.rpc("cancel_order_with_restock", {
              p_order_id: orderId,
              p_user_id: user?.id,
            });

            if (error) {
              if (error.message.includes("Order not found")) {
                Alert.alert("Error", "Order not found or unauthorized");
                return;
              }
              if (error.message.includes("cannot be cancelled")) {
                Alert.alert(
                  "Cannot Cancel",
                  "This order cannot be cancelled in its current status",
                );
                return;
              }
              throw error;
            }

            updateOrderStatusLocally(orderId, "cancelled", "cancelled");
            Alert.alert(
              "Success",
              "Order has been cancelled and stock has been restored",
            );

            setTimeout(() => {
              fetchOrders();
            }, 1000);
          } catch (error: any) {
            console.error("Cancel order error:", error);
            Alert.alert(
              "Error",
              error.message || "Failed to cancel order. Please try again.",
            );
          }
        },
      },
    ]);
  };

  const handleConfirmReceipt = async (
    orderId: string,
    paymentMethod: string,
    currentPaymentStatus: string,
  ) => {
    Alert.alert("Confirm Receipt", "Have you received your order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            let newPaymentStatus = currentPaymentStatus;
            if (paymentMethod === "cod" && currentPaymentStatus === "pending") {
              newPaymentStatus = "paid";
            } else if (currentPaymentStatus === "paid") {
              newPaymentStatus = "paid";
            } else {
              newPaymentStatus = currentPaymentStatus;
            }

            const { error } = await supabase
              .from("orders")
              .update({
                order_status: "delivered",
                payment_status: newPaymentStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("order_id", orderId)
              .eq("user_id", user?.id);

            if (error) throw error;

            updateOrderStatusLocally(
              orderId,
              "delivered",
              newPaymentStatus as PaymentStatus,
            );

            Alert.alert("Success", "Thank you for confirming receipt!");

            setTimeout(() => {
              fetchOrders();
            }, 1000);
          } catch (error: any) {
            console.error("Confirm receipt error:", error);
            Alert.alert("Error", error.message || "Failed to confirm receipt");
          }
        },
      },
    ]);
  };

  const renderOrderCard = (order: DisplayOrder) => {
    const subtotal =
      order.subtotal ||
      order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Determine if Pay Now button should be shown
    const showPayNow =
      order.status === "pending" &&
      order.paymentStatus !== "pending_verification" &&
      order.paymentMethod === "cod";

    return (
      <TouchableOpacity
        key={order.id}
        style={orderStyles.orderCard}
        onPress={() => handleOrderPress(order)}
        activeOpacity={0.7}
      >
        {/* Order Header */}
        <View style={orderStyles.orderHeader}>
          <View style={orderStyles.leftColumn}>
            <Text style={orderStyles.orderId}>#{order.orderNumber}</Text>
            <Text style={orderStyles.orderDate}>{order.orderDate}</Text>
          </View>
          <View
            style={[
              orderStyles.statusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Text style={orderStyles.statusText}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>

        {order.items.map((item) => {
          const freshness = computeFreshness(item.harvested_at);

          return (
            <View key={item.id} style={orderStyles.itemRow}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={orderStyles.itemImage}
                />
              ) : (
                <View
                  style={[
                    orderStyles.itemImage,
                    {
                      backgroundColor: "#e0e0e0",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <Text>No Image</Text>
                </View>
              )}
              <View style={orderStyles.itemContainer}>
                <View style={orderStyles.itemLeftColumn}>
                  <Text style={orderStyles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={orderStyles.itemVendor}>{item.vendor}</Text>
                  {freshness.isPreOrder && (
                    <View style={orderStyles.preOrderBadge}>
                      <Text style={orderStyles.preOrderBadgeText}>
                        Pre-order
                      </Text>
                    </View>
                  )}
                </View>
                <View style={orderStyles.itemRightColumn}>
                  <Text style={orderStyles.itemPrice}>
                    ₱{item.price.toLocaleString()}
                  </Text>
                  <View style={{ height: 4 }} />
                  <Text style={orderStyles.totalItems}>
                    Qty: {item.quantity}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Order Footer - Payment and Pricing Info */}
        <View style={orderStyles.orderFooter}>
          {/* Price Summary */}
          <View style={orderStyles.priceSummary}>
            {order.deliveryFee > 0 && (
              <View style={orderStyles.priceRow}>
                <Text style={orderStyles.priceLabel}>Delivery Fee:</Text>
                <Text style={orderStyles.priceValue}>
                  ₱{order.deliveryFee.toLocaleString()}
                </Text>
              </View>
            )}
            <View style={[orderStyles.priceRow, { marginTop: 4 }]}>
              <Text style={[orderStyles.priceLabel, { fontWeight: "bold" }]}>
                Total Amount:
              </Text>
              <Text
                style={[
                  orderStyles.priceValue,
                  { fontWeight: "bold", fontSize: 16, color: "#000" },
                ]}
              >
                ₱{order.totalAmount.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Action Buttons based on status - UPDATED with conditional Pay Now */}
          <View style={orderStyles.actionButtons}>
            {order.status === "pending" && (
              <>
                <TouchableOpacity
                  style={orderStyles.secondaryButton}
                  onPress={() => handleCancelOrder(order.id)}
                >
                  <Text style={orderStyles.secondaryButtonText}>
                    Cancel Order
                  </Text>
                </TouchableOpacity>
                {showPayNow && (
                  <TouchableOpacity
                    style={orderStyles.primaryButton}
                    onPress={() =>
                      handlePayNow(
                        order.id,
                        order.paymentMethod,
                        order.paymentStatus,
                      )
                    }
                  >
                    <Text style={orderStyles.primaryButtonText}>Pay Now</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            {(order.status === "preparing" ||
              order.status === "ready-to-ship") && (
              <TouchableOpacity
                style={[
                  orderStyles.secondaryButton,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
                onPress={() =>
                  handleContactSeller(
                    order.vendorShopName || "Vendor",
                    order.vendorId,
                  )
                }
              >
                <Text style={orderStyles.secondaryButtonText}>
                  Contact Seller
                </Text>
              </TouchableOpacity>
            )}
            {order.status === "shipped" && (
              <>
                <TouchableOpacity
                  style={orderStyles.secondaryButton}
                  onPress={() => router.push("/order-tracking")}
                >
                  <Text style={orderStyles.secondaryButtonText}>
                    Track Order
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={orderStyles.primaryButton}
                  onPress={() =>
                    handleConfirmReceipt(
                      order.id,
                      order.paymentMethod,
                      order.paymentStatus,
                    )
                  }
                >
                  <Text style={orderStyles.primaryButtonText}>
                    Confirm Receipt
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {order.status === "delivered" && (
              <>
                <TouchableOpacity
                  style={orderStyles.secondaryButton}
                  onPress={() => {
                    router.push({
                      pathname: "../buyer/view-vendor",
                      params: { vendor_user_id: order.vendorId },
                    });
                  }}
                >
                  <Text style={orderStyles.secondaryButtonText}>Buy Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={orderStyles.primaryButton}>
                  <Text style={orderStyles.primaryButtonText}>
                    Rate & Review
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={orderStyles.container}>
        <View style={orderStyles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={orderStyles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={orderStyles.headerTitle}>My Orders</Text>
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
    <SafeAreaView style={orderStyles.container}>
      {/* Header */}
      <View style={orderStyles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={orderStyles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={orderStyles.headerTitle}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={orderStyles.tabsContainer}
        contentContainerStyle={orderStyles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              orderStyles.tab,
              activeTab === tab.key && orderStyles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                orderStyles.tabText,
                activeTab === tab.key && orderStyles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView
        style={orderStyles.ordersContainer}
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
          <View style={orderStyles.emptyState}>
            <Text style={orderStyles.emptyIcon}>📦</Text>
            <Text style={orderStyles.emptyTitle}>No orders found</Text>
            <Text style={orderStyles.emptyDescription}>
              You don't have any orders in this category yet
            </Text>
            <TouchableOpacity
              style={orderStyles.primaryButton}
              onPress={() => router.back()}
            >
              <Text style={orderStyles.primaryButtonText}>Start Shopping</Text>
            </TouchableOpacity>
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
      />
    </SafeAreaView>
  );
};

export default OrdersScreen;
