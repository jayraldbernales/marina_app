// app/seller/index.tsx - With unread badge on chat button
import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../../constants";
import { sellerDashboardStyles } from "./styles/sellerDashboardStyles";
import { supabase } from "../../lib/supabase";

// Types
type OrderStatus =
  | "pending"
  | "preparing"
  | "ready-to-ship"
  | "shipped"
  | "rejected"
  | "delivered"
  | "cancelled";
interface RecentOrder {
  id: string;
  order_number: string;
  customerName: string;
  address: string;
  status: OrderStatus;
  amount: number;
  items: number;
}
interface Stats {
  orders: number;
  revenue: number;
  pending: number;
  rating: number;
}
interface DashboardData {
  stats: Stats;
  recentOrders: RecentOrder[];
}

const SellerDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: { orders: 0, revenue: 0, pending: 0, rating: 0 },
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  }, []);

  // Fetch unread messages count for vendor
  const fetchUnreadMessagesCount = useCallback(async () => {
    if (!currentUserId) return;

    try {
      console.log("Fetching unread count for vendor:", currentUserId);

      const { data, error } = await supabase
        .from("conversations")
        .select("vendor_unread_count")
        .eq("vendor_id", currentUserId);

      if (error) {
        console.error("Error fetching unread count:", error);
        return;
      }

      const totalUnread = (data || []).reduce(
        (sum, conv) => sum + (conv.vendor_unread_count || 0),
        0,
      );

      console.log("Total unread for vendor:", totalUnread);
      setUnreadMessagesCount(totalUnread);
    } catch (error) {
      console.error("Error in fetchUnreadMessagesCount:", error);
    }
  }, [currentUserId]);

  // Set up real-time subscription for unread messages
  const setupUnreadSubscription = useCallback(() => {
    if (!currentUserId) return;

    const subscription = supabase
      .channel("vendor-unread-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `vendor_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log("Vendor conversation updated:", payload);
          fetchUnreadMessagesCount();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          // Check if this message belongs to a conversation where current user is the vendor
          const { data } = await supabase
            .from("conversations")
            .select("vendor_id")
            .eq("id", payload.new.conversation_id)
            .single();

          if (data && data.vendor_id === currentUserId) {
            console.log("New message for vendor, refreshing count");
            fetchUnreadMessagesCount();
          }
        },
      )
      .subscribe();

    return subscription;
  }, [currentUserId, fetchUnreadMessagesCount]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const vendorUserId = session.user.id;
      setCurrentUserId(vendorUserId);

      // Fetch all orders for this vendor
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          order_id,
          order_number,
          order_status,
          total_amount,
          delivery_fee,
          payment_status,
          created_at,
          user_id,
          profiles!orders_user_fkey(full_name),
          addresses!orders_address_fkey(full_address)
        `,
        )
        .eq("vendor_user_id", vendorUserId)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
      }

      // Fetch order items to count items per order
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from("order_items")
        .select("order_id, quantity");

      if (orderItemsError) {
        console.error("Error fetching order items:", orderItemsError);
      }

      // Count items per order
      const itemCountMap = (orderItemsData || []).reduce(
        (acc: any, item: any) => {
          acc[item.order_id] = (acc[item.order_id] || 0) + item.quantity;
          return acc;
        },
        {},
      );

      // Process orders data
      const allOrders = (ordersData || []).map((order: any) => ({
        id: order.order_id,
        order_number: order.order_number,
        customerName: order.profiles?.full_name || "Unknown Customer",
        address: order.addresses?.full_address || "No address",
        status: order.order_status || "pending",
        amount: Number(order.total_amount) || 0,
        delivery_fee: Number(order.delivery_fee) || 0,
        payment_status: order.payment_status,
        items: itemCountMap[order.order_id] || 0,
      }));

      // Calculate stats
      const totalOrders = allOrders.length;

      // Only count orders that are delivered AND paid for revenue
      const completedOrders = allOrders.filter(
        (order) =>
          order.status === "delivered" && order.payment_status === "paid",
      );

      // Calculate revenue: sum of (total_amount - delivery_fee) for completed orders
      const totalRevenue = completedOrders.reduce((sum: number, order: any) => {
        const amount = Number(order.amount) || 0;
        const deliveryFee = Number(order.delivery_fee) || 0;
        return sum + (amount - deliveryFee);
      }, 0);

      const pendingOrders = allOrders.filter(
        (o) => o.status === "pending",
      ).length;

      // Temporary rating - leave as is for now
      const avgRating = 4.8;

      setDashboardData({
        stats: {
          orders: totalOrders,
          revenue: Math.round(totalRevenue * 100) / 100,
          pending: pendingOrders,
          rating: avgRating,
        },
        recentOrders: allOrders.slice(0, 3),
      });
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchCurrentUser();
    loadDashboardData();
  }, []);

  // Fetch unread count after user ID is set
  useEffect(() => {
    if (currentUserId) {
      fetchUnreadMessagesCount();
    }
  }, [currentUserId, fetchUnreadMessagesCount]);

  // Set up real-time subscription
  useEffect(() => {
    if (currentUserId) {
      const subscription = setupUnreadSubscription();
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [currentUserId, setupUnreadSubscription]);

  // Load data and unread count every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      if (currentUserId) {
        fetchUnreadMessagesCount();
      }
    }, [currentUserId]),
  );

  const handleChatPress = () => {
    router.push("/seller/conversation");
  };

  interface StatCardProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    value: string | number;
    color: string;
    subtext?: string;
  }
  const StatCard: React.FC<StatCardProps> = ({
    icon,
    label,
    value,
    color,
    subtext,
  }) => (
    <View style={sellerDashboardStyles.statCard}>
      <View
        style={[
          sellerDashboardStyles.statIconContainer,
          { backgroundColor: color },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={28} color="#fff" />
      </View>
      <View style={sellerDashboardStyles.statContent}>
        <Text style={sellerDashboardStyles.statValue}>{value}</Text>
        <Text style={sellerDashboardStyles.statLabel}>{label}</Text>
        {subtext && (
          <Text style={sellerDashboardStyles.statSubtext}>{subtext}</Text>
        )}
      </View>
    </View>
  );

  interface OrderItemProps {
    order: RecentOrder;
  }
  const OrderItem: React.FC<OrderItemProps> = ({ order }) => {
    const getStatusColor = (status: OrderStatus): string => {
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
    return (
      <TouchableOpacity
        style={sellerDashboardStyles.orderItem}
        onPress={() => router.push("/(seller-tabs)/orders")}
      >
        <View style={sellerDashboardStyles.orderItemHeader}>
          <View>
            <Text style={sellerDashboardStyles.orderId}>
              #{order.order_number}
            </Text>
            <Text style={sellerDashboardStyles.orderCustomer}>
              {order.customerName}
            </Text>
          </View>
          <View
            style={[
              sellerDashboardStyles.orderStatusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Text style={sellerDashboardStyles.orderStatusText}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
          </View>
        </View>
        <View style={sellerDashboardStyles.orderItemContent}>
          <Ionicons
            name="location-outline"
            size={16}
            color={COLORS.light.oceanMedium}
          />
          <Text style={sellerDashboardStyles.orderAddress} numberOfLines={1}>
            {order.address}
          </Text>
        </View>
        <View style={sellerDashboardStyles.orderItemFooter}>
          <Text style={sellerDashboardStyles.orderAmount}>₱{order.amount}</Text>
          <Text style={sellerDashboardStyles.orderItems}>
            {order.items} items
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={sellerDashboardStyles.container}>
        <View style={sellerDashboardStyles.headerBar}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            style={sellerDashboardStyles.headerBackBtn}
            accessibilityLabel="Back to profile"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={sellerDashboardStyles.headerTitle}>
            Seller Dashboard
          </Text>
          <TouchableOpacity
            onPress={handleChatPress}
            style={sellerDashboardStyles.headerMessageBtn}
            accessibilityLabel="View messages"
          >
            <Ionicons
              name="chatbox-ellipses"
              size={24}
              color={COLORS.light.primary}
            />
            {unreadMessagesCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={COLORS.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sellerDashboardStyles.container}>
      {/* Header */}
      <View style={sellerDashboardStyles.headerBar}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          style={sellerDashboardStyles.headerBackBtn}
          accessibilityLabel="Back to profile"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={sellerDashboardStyles.headerTitle}>Seller Dashboard</Text>
        <TouchableOpacity
          onPress={handleChatPress}
          style={sellerDashboardStyles.headerMessageBtn}
          accessibilityLabel="View messages"
        >
          <Ionicons
            name="chatbox-ellipses"
            size={24}
            color={COLORS.light.primary}
          />
          {unreadMessagesCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView
        style={sellerDashboardStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={sellerDashboardStyles.section}>
          <View style={sellerDashboardStyles.statsGrid}>
            <StatCard
              icon="cart"
              label="Orders"
              value={dashboardData.stats.orders}
              color={COLORS.light.primary}
            />
            <StatCard
              icon="cash-multiple"
              label="Revenue"
              value={`₱${dashboardData.stats.revenue.toLocaleString()}`}
              color={COLORS.light.oceanMedium}
            />
            <StatCard
              icon="progress-clock"
              label="Pending Orders"
              value={dashboardData.stats.pending}
              color={COLORS.light.coral}
            />
            <StatCard
              icon="star"
              label="Rating"
              value={`${dashboardData.stats.rating}`}
              color={COLORS.common.yellow}
            />
          </View>
        </View>

        {/* Recent Orders */}
        <View style={sellerDashboardStyles.section}>
          <View style={sellerDashboardStyles.sectionHeader}>
            <Text style={sellerDashboardStyles.sectionTitle}>
              Recent Orders
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(seller-tabs)/orders")}
            >
              <Text style={sellerDashboardStyles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {dashboardData.recentOrders.map((order) => (
            <OrderItem key={order.id} order={order} />
          ))}
          {dashboardData.recentOrders.length === 0 && (
            <View style={sellerDashboardStyles.emptyOrders}>
              <Text style={sellerDashboardStyles.emptyOrdersText}>
                No recent orders
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Add these styles
const styles = {
  unreadBadge: {
    position: "absolute" as "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center" as "center",
    alignItems: "center" as "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold" as "bold",
  },
};

export default SellerDashboard;
