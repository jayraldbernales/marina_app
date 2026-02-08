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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { COLORS } from "@/constants";
import { orderStyles } from "../components/styles/orderStyles";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";

// Types based on your database schema
type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
type PaymentStatus = "pending" | "paid" | "failed";

interface DisplayOrder {
  id: string;
  orderNumber: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    vendor: string;
    image: string | null;
  }[];
  status: OrderStatus;
  totalAmount: number;
  subtotal?: number;
  deliveryFee: number;
  orderDate: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  vendorShopName?: string;
}

const OrdersScreen = () => {
  const [activeTab, setActiveTab] = useState<string>("to-pay");
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();
  const user = useUserStore((state) => state.user);

  const tabs = [
    { key: "to-pay", label: "To Pay" },
    { key: "to-ship", label: "To Ship" },
    { key: "to-receive", label: "To Receive" },
    { key: "completed", label: "Completed" },
    { key: "canceled", label: "Canceled" },
  ];

  // Map database status to UI tab
  const getUITabFromDBStatus = (dbStatus: OrderStatus): string => {
    switch (dbStatus) {
      case "pending":
        return "to-pay";
      case "processing":
        return "to-ship";
      case "shipped":
        return "to-receive";
      case "delivered":
        return "completed";
      case "cancelled":
        return "canceled";
      default:
        return "to-pay";
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

      // Fetch orders with address information
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

      // Transform data for display
      const displayOrders: DisplayOrder[] = [];

      for (const order of ordersData as any) {
        // Fetch order items with product details
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select(
            `
            *,
            products!inner(
              product_name,
              images,
              vendor_profiles!inner(shop_name)
            )
          `,
          )
          .eq("order_id", order.order_id);

        if (itemsError) {
          console.error("Error fetching order items:", itemsError);
          continue;
        }

        // Transform items for display
        const displayItems = (itemsData || []).map((item: any) => ({
          id: item.order_item_id,
          name: item.products.product_name,
          price: item.unit_price,
          quantity: item.quantity,
          vendor: item.products.vendor_profiles?.shop_name || "Unknown Vendor",
          image: item.products.images?.[0] || null,
        }));

        // Create display order
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
          deliveryAddress:
            order.addresses?.full_address || "Address not specified",
          vendorShopName: displayItems[0]?.vendor,
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

  const filteredOrders = orders.filter(
    (order) => getUITabFromDBStatus(order.status) === activeTab,
  );

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "#f59e0b"; // yellow
      case "processing":
        return "#3b82f6"; // blue
      case "shipped":
        return "#8b5cf6"; // purple
      case "delivered":
        return "#10b981"; // green
      case "cancelled":
        return "#6b7280"; // gray
      default:
        return COLORS.light.primary;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "To Pay";
      case "processing":
        return "To Ship";
      case "shipped":
        return "To Receive";
      case "delivered":
        return "Completed";
      case "cancelled":
        return "Canceled";
      default:
        return status;
    }
  };

  const handlePayNow = async (orderId: string) => {
    Alert.alert("Payment", "This would redirect to payment gateway");
    // Implement payment gateway integration here
  };

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("orders")
              .update({
                order_status: "cancelled",
                payment_status: "cancelled",
              })
              .eq("order_id", orderId)
              .eq("user_id", user?.id);

            if (error) throw error;

            Alert.alert("Success", "Order has been cancelled");
            fetchOrders(); // Refresh the list
          } catch (error: any) {
            Alert.alert("Error", error.message);
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

            Alert.alert("Success", "Thank you for confirming receipt!");
            fetchOrders(); // Refresh the list
          } catch (error: any) {
            console.error("Confirm receipt error:", error);
            Alert.alert("Error", error.message || "Failed to confirm receipt");
          }
        },
      },
    ]);
  };

  const renderOrderCard = (order: DisplayOrder) => {
    // Calculate subtotal if not available
    const subtotal =
      order.subtotal ||
      order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
      <View key={order.id} style={orderStyles.orderCard}>
        {/* Order Header */}
        <View style={orderStyles.orderHeader}>
          <View>
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

        {/* Order Items - Updated Layout */}
        {order.items.map((item) => (
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
              {/* Left side: Product name and shop name */}
              <View style={orderStyles.itemLeftColumn}>
                <Text style={orderStyles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={orderStyles.itemVendor}>{item.vendor}</Text>
              </View>

              {/* Right side: Price and total items */}
              <View style={orderStyles.itemRightColumn}>
                <Text style={orderStyles.itemPrice}>
                  ₱{item.price.toLocaleString()}
                </Text>
                <View style={{ height: 4 }} />
                <Text style={orderStyles.totalItems}>
                  Total Items:{item.quantity}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Order Footer - Payment and Pricing Info */}
        <View style={orderStyles.orderFooter}>
          {/* Payment Method */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: "#666" }}>
              Payment: {order.paymentMethod} ({order.paymentStatus})
            </Text>
          </View>

          {/* Price Summary - Added subtotal above delivery fee */}
          <View style={orderStyles.priceSummary}>
            <View style={orderStyles.priceRow}>
              <Text style={orderStyles.priceLabel}>Subtotal:</Text>
              <Text style={orderStyles.priceValue}>
                ₱{subtotal.toLocaleString()}
              </Text>
            </View>

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

          {/* Action Buttons based on status */}
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
                <TouchableOpacity
                  style={orderStyles.primaryButton}
                  onPress={() => handlePayNow(order.id)}
                >
                  <Text style={orderStyles.primaryButtonText}>Pay Now</Text>
                </TouchableOpacity>
              </>
            )}
            {order.status === "processing" && (
              <TouchableOpacity style={orderStyles.secondaryButton}>
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
                <TouchableOpacity style={orderStyles.secondaryButton}>
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
      </View>
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
    </SafeAreaView>
  );
};

export default OrdersScreen;
