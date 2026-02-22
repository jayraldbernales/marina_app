// app/rider/index.tsx
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
import { riderDashboardStyles } from "./styles/riderDashboardStyles";
import { supabase } from "../../lib/supabase";

// Types
type DeliveryStatus = "to-pickup" | "in-transit" | "delivered" | "cancelled";

interface RecentDelivery {
  id: string;
  delivery_id: string;
  order_number: string;
  customerName: string;
  address: string;
  status: DeliveryStatus;
  amount: number;
  items: number;
}

interface Stats {
  deliveries: number;
  earnings: number;
  pending: number;
  rating: number;
  totalReviews: number;
}

interface DashboardData {
  stats: Stats;
  recentDeliveries: RecentDelivery[];
}

// Types for database responses
interface DeliveryWithOrder {
  delivery_id: string;
  status: string;
  assigned_at: string;
  delivered_time: string | null;
  created_at: string;
  orders: {
    order_number: string;
    total_amount: number;
    delivery_fee: number;
    profiles: {
      full_name: string;
    };
    addresses: {
      full_address: string;
    };
  } | null;
}

interface ReviewData {
  rider_rating: number;
  review_id: string;
  created_at: string;
}

const RiderDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      deliveries: 0,
      earnings: 0,
      pending: 0,
      rating: 0,
      totalReviews: 0,
    },
    recentDeliveries: [],
  });
  const [loading, setLoading] = useState(true);
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

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const riderUserId = session.user.id;
      setCurrentUserId(riderUserId);

      // Fetch deliveries for this rider
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from("deliveries")
        .select(
          `
          delivery_id,
          status,
          assigned_at,
          delivered_time,
          created_at,
          orders:order_id(
            order_number,
            total_amount,
            delivery_fee,
            profiles!orders_user_fkey(
              full_name
            ),
            addresses!orders_address_fkey(
              full_address
            )
          )
        `,
        )
        .eq("rider_user_id", riderUserId)
        .order("assigned_at", { ascending: false });

      if (deliveriesError) {
        console.error("Error fetching deliveries:", deliveriesError);
        return;
      }

      // Fetch rider's ratings from reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("rider_rating, review_id, created_at")
        .eq("rider_user_id", riderUserId);

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
      }

      const deliveries = deliveriesData || [];
      const reviews = (reviewsData as ReviewData[]) || [];

      // Calculate average rating - default to 0 if no reviews
      let avgRating = 0;
      let totalReviews = 0;

      if (reviews.length > 0) {
        totalReviews = reviews.length;
        const sumRatings = reviews.reduce(
          (sum, review) => sum + review.rider_rating,
          0,
        );
        avgRating = sumRatings / totalReviews;
        // Round to 1 decimal place
        avgRating = Math.round(avgRating * 10) / 10;
      }

      // Fetch order items to count items per order
      const orderIds = deliveries
        .map((d: any) => d.orders?.order_number)
        .filter(Boolean);

      const itemCountMap: Record<string, number> = {};

      if (orderIds.length > 0) {
        const { data: orderItemsData } = await supabase
          .from("order_items")
          .select("order_id, quantity")
          .in("order_id", orderIds);

        (orderItemsData || []).forEach((item: any) => {
          itemCountMap[item.order_id] =
            (itemCountMap[item.order_id] || 0) + item.quantity;
        });
      }

      // Calculate completed deliveries (delivered)
      const completedDeliveries = deliveries.filter(
        (d: any) => d.status === "delivered",
      );

      // Calculate total earnings from delivery fees (only from completed deliveries)
      const totalEarnings = completedDeliveries.reduce(
        (sum: number, delivery: any) => {
          const deliveryFee = Number(delivery.orders?.delivery_fee) || 0;
          return sum + deliveryFee;
        },
        0,
      );

      // Count pending deliveries (assigned, ready_to_pickup, picked_up)
      const pendingDeliveries = deliveries.filter((d: any) =>
        ["assigned", "ready_to_pickup", "picked_up"].includes(d.status),
      ).length;

      // Process recent deliveries
      const recentDeliveries = deliveries.slice(0, 5).map((delivery: any) => {
        // Map delivery status to UI status
        let uiStatus: DeliveryStatus = "to-pickup";
        if (
          delivery.status === "picked_up" ||
          delivery.status === "in-transit"
        ) {
          uiStatus = "in-transit";
        } else if (delivery.status === "delivered") {
          uiStatus = "delivered";
        } else if (
          delivery.status === "cancelled" ||
          delivery.status === "failed"
        ) {
          uiStatus = "cancelled";
        }

        return {
          id: delivery.delivery_id,
          delivery_id: delivery.delivery_id,
          order_number: delivery.orders?.order_number || "Unknown",
          customerName:
            delivery.orders?.profiles?.full_name?.trim() || "Unknown Customer",
          address: delivery.orders?.addresses?.full_address || "No address",
          status: uiStatus,
          amount: Number(delivery.orders?.total_amount) || 0,
          items: itemCountMap[delivery.order_id] || 0,
        };
      });

      setDashboardData({
        stats: {
          deliveries: completedDeliveries.length,
          earnings: Math.round(totalEarnings * 100) / 100,
          pending: pendingDeliveries,
          rating: avgRating,
          totalReviews: totalReviews,
        },
        recentDeliveries,
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

  // Load data every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, []),
  );

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
    <View style={riderDashboardStyles.statCard}>
      <View
        style={[
          riderDashboardStyles.statIconContainer,
          { backgroundColor: color },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={28} color="#fff" />
      </View>
      <View style={riderDashboardStyles.statContent}>
        <Text style={riderDashboardStyles.statValue}>{value}</Text>
        <Text style={riderDashboardStyles.statLabel}>{label}</Text>
        {subtext && (
          <Text style={riderDashboardStyles.statSubtext}>{subtext}</Text>
        )}
      </View>
    </View>
  );

  interface DeliveryItemProps {
    delivery: RecentDelivery;
  }

  const DeliveryItem: React.FC<DeliveryItemProps> = ({ delivery }) => {
    const getStatusColor = (status: DeliveryStatus): string => {
      switch (status) {
        case "to-pickup":
          return "#f59e0b";
        case "in-transit":
          return COLORS.light.primary;
        case "delivered":
          return "#10b981";
        case "cancelled":
          return "#ef4444";
        default:
          return COLORS.light.primary;
      }
    };

    const getStatusText = (status: DeliveryStatus): string => {
      switch (status) {
        case "to-pickup":
          return "To Pickup";
        case "in-transit":
          return "In Transit";
        case "delivered":
          return "Delivered";
        case "cancelled":
          return "Cancelled";
        default:
          return status;
      }
    };

    return (
      <TouchableOpacity
        style={riderDashboardStyles.deliveryItem}
        onPress={() => router.push("/(rider-tabs)/deliveries")}
      >
        <View style={riderDashboardStyles.deliveryItemHeader}>
          <View>
            <Text style={riderDashboardStyles.deliveryId}>
              #{delivery.order_number}
            </Text>
            <Text style={riderDashboardStyles.deliveryCustomer}>
              {delivery.customerName}
            </Text>
          </View>
          <View
            style={[
              riderDashboardStyles.deliveryStatusBadge,
              { backgroundColor: getStatusColor(delivery.status) },
            ]}
          >
            <Text style={riderDashboardStyles.deliveryStatusText}>
              {getStatusText(delivery.status)}
            </Text>
          </View>
        </View>
        <View style={riderDashboardStyles.deliveryItemContent}>
          <Ionicons
            name="location-outline"
            size={16}
            color={COLORS.light.oceanMedium}
          />
          <Text style={riderDashboardStyles.deliveryAddress} numberOfLines={1}>
            {delivery.address}
          </Text>
        </View>
        <View style={riderDashboardStyles.deliveryItemFooter}>
          <Text style={riderDashboardStyles.deliveryAmount}>
            ₱{delivery.amount.toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={riderDashboardStyles.container}>
        <View style={riderDashboardStyles.headerBar}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            style={riderDashboardStyles.headerBackBtn}
            accessibilityLabel="Back to profile"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={riderDashboardStyles.headerTitle}>Rider Dashboard</Text>
          <View style={{ width: 40 }} />
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
    <SafeAreaView style={riderDashboardStyles.container}>
      {/* Header */}
      <View style={riderDashboardStyles.headerBar}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          style={riderDashboardStyles.headerBackBtn}
          accessibilityLabel="Back to profile"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={riderDashboardStyles.headerTitle}>Rider Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={riderDashboardStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={riderDashboardStyles.section}>
          <View style={riderDashboardStyles.statsGrid}>
            <StatCard
              icon="moped"
              label="Deliveries"
              value={dashboardData.stats.deliveries}
              color={COLORS.light.primary}
            />

            <StatCard
              icon="cash-multiple"
              label="Earnings"
              value={`₱${dashboardData.stats.earnings.toLocaleString()}`}
              color={COLORS.light.oceanMedium}
            />

            <StatCard
              icon="progress-clock"
              label="Pending"
              value={dashboardData.stats.pending}
              color={COLORS.light.coral}
            />

            <StatCard
              icon="star"
              label="Rating"
              value={dashboardData.stats.rating.toFixed(1)}
              color={COLORS.common.yellow}
            />
          </View>
        </View>

        {/* Recent Deliveries */}
        <View style={riderDashboardStyles.section}>
          <View style={riderDashboardStyles.sectionHeader}>
            <Text style={riderDashboardStyles.sectionTitle}>
              Active Deliveries
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(rider-tabs)/deliveries")}
            >
              <Text style={riderDashboardStyles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {dashboardData.recentDeliveries.length > 0 ? (
            dashboardData.recentDeliveries.map((delivery) => (
              <DeliveryItem key={delivery.id} delivery={delivery} />
            ))
          ) : (
            <View style={riderDashboardStyles.emptyDeliveries}>
              <Text style={riderDashboardStyles.emptyDeliveriesText}>
                No active deliveries
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RiderDashboard;
