// app/buyer/orders/index.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { COLORS } from "@/constants";
import { orderStyles } from "../components/styles/orderStyles";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { computeFreshness } from "@/utils/freshness";
import { chatService } from "@/lib/chat";
import RatingModal from "../components/Buyer/RatingModal";

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready-to-ship"
  | "shipped"
  | "delivered"
  | "failed"
  | "cancelled"
  | "rejected";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "pending_verification";

// NEW: Rider Assignment type
type RiderAssignment = {
  id: string;
  name: string;
  avatar: string | null;
  status: string;
  vehicle?: string | null;
};

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
  paymentProofUrl?: string;
  gcashReference?: string;
  note?: string;
  deliveryAddress: string;
  vendorShopName?: string;
  vendorId?: string;
  riderAssignment?: RiderAssignment | null;
  failureReason?: string;
}

const fetchRiderAssignment = async (
  orderId: string,
): Promise<RiderAssignment | null> => {
  try {
    // Get the delivery with rider_user_id
    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .select("rider_user_id, status")
      .eq("order_id", orderId)
      .maybeSingle();
    if (deliveryError || !delivery || !delivery.rider_user_id) {
      return null;
    }

    // Get rider profile with vehicle type
    const { data: riderProfile, error: riderError } = await supabase
      .from("rider_profiles")
      .select("vehicle_type")
      .eq("user_id", delivery.rider_user_id)
      .maybeSingle();

    if (riderError) {
      return null;
    }

    // Get user profile with name and avatar
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", delivery.rider_user_id)
      .maybeSingle();

    if (userError || !userProfile) {
      return null;
    }

    return {
      id: delivery.rider_user_id,
      name: userProfile.full_name || "Rider",
      avatar: userProfile.avatar_url || null,
      status:
        delivery.status === "assigned"
          ? "Assigned"
          : delivery.status === "picked_up"
            ? "Picked up"
            : delivery.status === "ready_to_pickup"
              ? "Ready to Pickup"
              : delivery.status === "failed"
                ? "Failed"
                : delivery.status === "delivered"
                  ? "Delivered"
                  : delivery.status,
      vehicle: riderProfile?.vehicle_type || null,
    };
  } catch (error) {
    return null;
  }
};

// Replace your OrderDetailsModal component in app/buyer/orders/index.tsx with this:
const OrderDetailsModal = ({
  visible,
  onClose,
  order,
}: {
  visible: boolean;
  onClose: () => void;
  order: DisplayOrder | null;
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

  const S = orderStyles;

  if (!order) return null;

  const subtotal =
    order.subtotal ||
    order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getStatusColor = (status: OrderStatus) => {
    const map: Record<string, string> = {
      pending: "#f59e0b",
      preparing: "#3b82f6",
      "ready-to-ship": "#8b5cf6",
      shipped: "#10b981",
      delivered: "#10b981",
      failed: "#ef4444",
      cancelled: "#6b7280",
      rejected: "#ef4444",
    };
    return map[status] ?? COLORS.light.primary;
  };

  const getStatusText = (status: OrderStatus) => {
    const map: Record<string, string> = {
      pending: "Pending",
      preparing: "Preparing",
      "ready-to-ship": "Ready to Ship",
      shipped: "Shipped",
      delivered: "Completed",
      failed: "Failed",
      cancelled: "Cancelled",
      rejected: "Rejected",
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
                <View style={{ alignItems: "flex-end" }}>
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
                  <Text style={[S.modalOrderDate, { marginTop: 6 }]}>
                    {order.orderDate}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Delivery Address ── */}
            <View style={S.modalSection}>
              <Text style={S.modalSectionTitle}>Delivery Address</Text>
              <View style={S.modalAddressCard}>
                <Ionicons
                  name="location-outline"
                  size={15}
                  color="#aaa"
                  style={S.modalAddressIcon}
                />
                <Text style={S.modalAddress}>{order.deliveryAddress}</Text>
              </View>
            </View>

            {/* ── Special Instructions ── */}
            {order.note && (
              <View style={S.modalSection}>
                <Text style={S.modalSectionTitle}>Special Instructions</Text>
                <View style={S.specialInstructionsBox}>
                  <Text style={S.specialInstructionsText}>{order.note}</Text>
                </View>
              </View>
            )}

            {/* ── Payment ── */}
            <View style={S.modalSection}>
              <Text style={S.modalSectionTitle}>Payment</Text>
              <View style={S.modalPaymentCard}>
                <View style={S.modalPaymentRow}>
                  <Text style={S.modalPaymentLabel}>Method</Text>
                  <Text style={S.modalPaymentValue}>
                    {order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : "GCash"}
                  </Text>
                </View>
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
                    {order.gcashReference && (
                      <View style={[S.modalPaymentRow, { marginBottom: 10 }]}>
                        <Text style={S.referenceLabel}>Reference Number</Text>
                        <Text style={S.referenceValue}>
                          {order.gcashReference}
                        </Text>
                      </View>
                    )}
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
                  </>
                )}
              </View>
            </View>

            {/* ── Delivery Proof — View buttons only ── */}
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
                      <Text
                        style={{
                          color: "#b91c1c",
                          fontSize: 13,
                          opacity: 0.9,
                        }}
                      >
                        This delivery was not completed
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
                  style={S.riderRow}
                  onPress={() =>
                    router.push({
                      pathname: "../buyer/view-rider",
                      params: { rider_user_id: order.riderAssignment?.id },
                    })
                  }
                  activeOpacity={0.7}
                >
                  {order.riderAssignment.avatar ? (
                    <Image
                      source={{ uri: order.riderAssignment.avatar }}
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
                    {order.riderAssignment.vehicle && (
                      <Text style={S.riderVehicle}>
                        {order.riderAssignment.vehicle}
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
                    {item.image ? (
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
                      <Text style={S.modalItemVendor}>{item.vendor}</Text>
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
                {order.deliveryFee > 0 && (
                  <View style={S.modalPriceRow}>
                    <Text style={S.modalPriceLabel}>Delivery Fee</Text>
                    <Text style={S.modalPriceValue}>
                      ₱{order.deliveryFee.toLocaleString()}
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
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const navigation = useNavigation();
  const user = useUserStore((state) => state.user);

  const tabs = [
    { key: "to-pay", label: "To Pay" },
    { key: "to-ship", label: "To Ship" },
    { key: "to-receive", label: "To Receive" },
    { key: "completed", label: "Completed" },
    { key: "failed", label: "Failed" },
    { key: "cancelled", label: "Cancelled / Rejected" },
  ];

  // Map database status to UI tab
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
      case "failed":
        return "failed";
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

  // Handle order card press to show modal
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
        .select(`*, addresses!inner(full_address)`)
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

      // Batch fetch order items for all orders to reduce round-trips
      const orderIds = (ordersData as any[]).map((o) => o.order_id);
      const { data: itemsAll, error: itemsAllError } = await supabase
        .from("order_items")
        .select(
          `*, products!inner(product_id, product_name, images, harvested_at, vendor_profiles!inner(shop_name, user_id)), order_id`,
        )
        .in("order_id", orderIds);

      if (itemsAllError) {
        console.error("Error fetching items for orders:", itemsAllError);
      }

      // Group items by order_id
      const itemsByOrder: Record<string, any[]> = {};
      (itemsAll || []).forEach((it: any) => {
        const oid = it.order_id;
        if (!itemsByOrder[oid]) itemsByOrder[oid] = [];
        itemsByOrder[oid].push(it);
      });

      const displayOrders: DisplayOrder[] = (ordersData as any[]).map(
        (order) => {
          const itemsData = itemsByOrder[order.order_id] || [];
          const displayItems = itemsData.map((item: any) => ({
            id: item.order_item_id,
            productId: item.product_id,
            name: item.products.product_name,
            price: item.unit_price,
            quantity: item.quantity,
            vendor:
              item.products.vendor_profiles?.shop_name || "Unknown Vendor",
            vendorId: item.products.vendor_profiles?.user_id,
            image: item.products.images?.[0] || null,
            harvested_at: item.products.harvested_at,
          }));

          return {
            id: order.order_id,
            orderNumber: order.order_number,
            items: displayItems,
            status: order.order_status,
            totalAmount: parseFloat(order.total_amount) || 0,
            subtotal: order.subtotal ? parseFloat(order.subtotal) : undefined,
            deliveryFee: order.delivery_fee
              ? parseFloat(order.delivery_fee)
              : 0,
            orderDate: new Date(order.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
            paymentProofUrl: order.payment_proof_url,
            gcashReference: order.gcash_reference,
            note: order.note,
            deliveryAddress:
              order.addresses?.full_address || "Address not specified",
            vendorShopName: displayItems[0]?.vendor,
            vendorId: displayItems[0]?.vendorId,
            riderAssignment: null,
          } as DisplayOrder;
        },
      );

      // Parallelize rider assignment fetches for orders that need it
      const riderPromises = displayOrders.map((o) => {
        const needs = [
          "preparing",
          "ready-to-ship",
          "shipped",
          "delivered",
          "failed",
        ].includes(o.status as string);
        return needs ? fetchRiderAssignment(o.id) : Promise.resolve(null);
      });

      const riderResults = await Promise.all(riderPromises);
      riderResults.forEach((r, idx) => {
        if (r) displayOrders[idx].riderAssignment = r;
      });

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

  const handleRateOrder = (order: DisplayOrder) => {
    setSelectedOrder(order);
    setRatingModalVisible(true);
  };

  const handleRatingSubmitted = () => {
    fetchOrders(); // Refresh orders to update any UI
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery("");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const normalizedStatus = order.status.toLowerCase();
      const uiTab = getUITabFromDBStatus(normalizedStatus as OrderStatus);

      if (activeTab === "cancelled") {
        return (
          normalizedStatus === "cancelled" || normalizedStatus === "rejected"
        );
      } else if (uiTab !== activeTab) {
        return false;
      }

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();

      return (
        order.orderNumber.toLowerCase().includes(query) ||
        order.items.some((item) => item.name.toLowerCase().includes(query)) ||
        order.items.some((item) => item.vendor.toLowerCase().includes(query)) ||
        order.orderDate.toLowerCase().includes(query) ||
        order.paymentMethod.toLowerCase().includes(query) ||
        order.deliveryAddress.toLowerCase().includes(query) ||
        (order.note && order.note.toLowerCase().includes(query))
      );
    });
  }, [orders, activeTab, searchQuery]);

  const renderListItem = useCallback(
    ({ item }: { item: DisplayOrder }) => {
      return renderOrderCard(item);
    },
    [
      /* stable: relies on renderOrderCard closure */
    ],
  );

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
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const handlePayNow = (order: DisplayOrder) => {
    // Calculate total quantity across all items
    const totalQuantity = order.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    router.push({
      pathname: "../buyer/payment",
      params: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        productId: order.items[0]?.productId, // For single vendor orders
        vendorUserId: order.vendorId,
        quantity: totalQuantity.toString(),
        subtotal: (order.totalAmount - order.deliveryFee).toString(),
        deliveryFee: order.deliveryFee.toString(),
        total: order.totalAmount.toString(),
        specialInstructions: order.note || "",
        addressId: "", // You'll need to add addressId to your DisplayOrder type
      },
    });
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

        {/* Order Footer */}
        <View style={orderStyles.orderFooter}>
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
                    onPress={() => handlePayNow(order)}
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
                <TouchableOpacity
                  style={orderStyles.primaryButton}
                  onPress={() => handleRateOrder(order)}
                >
                  <Text style={orderStyles.primaryButtonText}>
                    Rate & Review
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {order.status === "failed" && (
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
                  <Text style={orderStyles.secondaryButtonText}>
                    Contact Vendor
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={orderStyles.primaryButton}
                  onPress={() => handleRateOrder(order)}
                >
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
        <View style={{ backgroundColor: "#FFFFFF" }}>
          <View style={orderStyles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#666"
              style={orderStyles.searchIcon}
            />
            <TextInput
              style={orderStyles.searchInput}
              placeholder="Search by order #, product, vendor..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={orderStyles.clearButton}
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
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderListItem}
        contentContainerStyle={orderStyles.ordersContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        initialNumToRender={8}
        ListHeaderComponent={
          searchQuery.length > 0 ? (
            <View style={orderStyles.searchResultInfo}>
              <Text style={orderStyles.searchResultText}>
                Found {filteredOrders.length} order
                {filteredOrders.length !== 1 ? "s" : ""} for "{searchQuery}"
              </Text>
            </View>
          ) : undefined
        }
        ListEmptyComponent={() => (
          <View style={orderStyles.emptyState}>
            <Text style={orderStyles.emptyIcon}>
              {searchQuery.length > 0 ? "🔍" : "📦"}
            </Text>
            <Text style={orderStyles.emptyTitle}>
              {searchQuery.length > 0
                ? "No matching orders"
                : "No orders found"}
            </Text>
            <Text style={orderStyles.emptyDescription}>
              {searchQuery.length > 0
                ? `No orders match "${searchQuery}" in this category`
                : "You don't have any orders in this category yet"}
            </Text>
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                style={orderStyles.secondaryButton}
                onPress={() => {
                  setSearchQuery("");
                  setIsSearchVisible(false);
                }}
              >
                <Text style={orderStyles.secondaryButtonText}>
                  Clear Search
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={orderStyles.primaryButton}
                onPress={() => router.back()}
              >
                <Text style={orderStyles.primaryButtonText}>
                  Start Shopping
                </Text>
              </TouchableOpacity>
            )}
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
      />

      <RatingModal
        visible={ratingModalVisible}
        onClose={() => {
          setRatingModalVisible(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </SafeAreaView>
  );
};

export default OrdersScreen;
