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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { COLORS } from "@/constants";
import { sellerOrderStyles } from "./styles/sellerOrderStyles";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";

// UPDATED: Added 'rejected' to OrderStatus type
type OrderStatus =
  | "pending"
  | "preparing"
  | "ready-to-ship"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "rejected";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | ImageSourcePropType | null;
  productId?: string;
};

type DisplayOrder = {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  orderDate: string;
  paymentMethod?: string;
  deliveryAddress?: string;
  customerName?: string;
  riderAssignment?: any | null;
};

const SellerOrders = () => {
  const [activeTab, setActiveTab] = useState<OrderStatus>("pending");
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const navigation = useNavigation();
  const user = useUserStore((s) => s.user);

  const tabs: { key: OrderStatus; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "preparing", label: "Preparing" },
    { key: "ready-to-ship", label: "Ready to Ship" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled / Rejected" }, // Keep same tab for both
  ];

  // UPDATED: Added red color for rejected status
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
        return "#ef4444"; // Red for rejected
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
          .select(`*, products:products(product_id, product_name, images)`)
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
          deliveryAddress: order.addresses?.full_address,
          customerName: order.profiles?.full_name,
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

  // UPDATED: Now sets status to "rejected" instead of "cancelled"
  const rejectOrderWithRestock = async (orderId: string) => {
    try {
      setUpdatingOrderId(orderId);

      // Call the database function for vendor rejection
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

      // UPDATED: Set status to "rejected" instead of "cancelled"
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

      // UPDATED: Handle both cancelled and rejected with restock
      if (newStatus === "cancelled" || newStatus === "rejected") {
        await rejectOrderWithRestock(orderId);
        return;
      }

      // For other status updates, proceed as normal
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
    // Check stock availability first
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

  // Handle Reject Order - UPDATED: Now passes "rejected" status
  const handleRejectOrder = (orderId: string) => {
    Alert.alert(
      "Reject Order",
      "Are you sure you want to reject this order? This will cancel the order and restore product stock.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => updateOrderStatus(orderId, "rejected"), // UPDATED: Changed from "cancelled" to "rejected"
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

  // UPDATED: Filter to show both cancelled AND rejected in the same tab
  const filteredOrders = orders.filter((o) => {
    if (activeTab === "cancelled") {
      return o.status === "cancelled" || o.status === "rejected";
    }
    return o.status === activeTab;
  });

  const renderOrderCard = (order: DisplayOrder) => {
    const isUpdating = updatingOrderId === order.id;

    return (
      <View key={order.id} style={sellerOrderStyles.orderCard}>
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
              {/* UPDATED: Show "Rejected" for rejected orders, "Cancelled" for cancelled orders */}
              {order.status === "rejected"
                ? "Rejected"
                : order.status === "cancelled"
                  ? "Cancelled"
                  : tabs.find((t) => t.key === order.status)?.label ||
                    order.status}
            </Text>
          </View>
        </View>

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

        {order.items.map((item) => (
          <View key={item.id} style={sellerOrderStyles.itemRow}>
            {typeof item.image === "string" && item.image ? (
              <Image
                source={{ uri: item.image }}
                style={sellerOrderStyles.itemImage}
              />
            ) : (
              <Image
                source={(item.image as any) || require("@/assets/img/user.jpg")}
                style={sellerOrderStyles.itemImage}
              />
            )}
            <View style={sellerOrderStyles.itemDetails}>
              <Text style={sellerOrderStyles.itemName}>{item.name}</Text>
              <Text style={sellerOrderStyles.itemPrice}>
                ₱{item.price} × {item.quantity}
              </Text>
            </View>
          </View>
        ))}

        <View style={sellerOrderStyles.orderFooter}>
          <View style={sellerOrderStyles.totalRow}>
            <Text style={sellerOrderStyles.totalLabel}>Total Amount:</Text>
            <Text style={sellerOrderStyles.totalAmount}>
              ₱{order.totalAmount.toLocaleString()}
            </Text>
          </View>
          <Text style={sellerOrderStyles.deliveryAddress}>
            {order.deliveryAddress}
          </Text>

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
            {/* UPDATED: Show View Details button for both cancelled AND rejected */}
            {(order.status === "cancelled" || order.status === "rejected") && (
              <TouchableOpacity style={sellerOrderStyles.secondaryButton}>
                <Text style={sellerOrderStyles.secondaryButtonText}>
                  View Details
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
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
    </SafeAreaView>
  );
};

export default SellerOrders;
