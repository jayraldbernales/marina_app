import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../../constants";
import { sellerDashboardStyles } from "./styles/sellerDashboardStyles";
// Types
type OrderStatus = "pending" | "preparing" | "shipped";
interface RecentOrder {
  id: string;
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
// Mock data for dashboard
const dashboardData: DashboardData = {
  stats: {
    orders: 12,
    revenue: 5200,
    pending: 4,
    rating: 4.8,
  },
  recentOrders: [
    {
      id: "ORD-001",
      customerName: "John Santos",
      address: "123 Seaside Avenue",
      status: "pending",
      amount: 1010,
      items: 2,
    },
    {
      id: "ORD-005",
      customerName: "Maria Cruz",
      address: "321 Harbor Street",
      status: "preparing",
      amount: 1350,
      items: 2,
    },
    {
      id: "ORD-003",
      customerName: "Pedro Reyes",
      address: "789 Ocean Boulevard",
      status: "pending",
      amount: 530,
      items: 1,
    },
  ],
};
const SellerDashboard = () => {
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
          return COLORS.light.primary;
        case "shipped":
          return "#10b981";
        default:
          return COLORS.light.primary;
      }
    };
    return (
      <TouchableOpacity
        style={sellerDashboardStyles.orderItem}
        onPress={() => router.push("/(seller-tabs)")}
      >
        <View style={sellerDashboardStyles.orderItemHeader}>
          <View>
            <Text style={sellerDashboardStyles.orderId}>{order.id}</Text>
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
          onPress={() => router.push("/seller/chat")}
          style={sellerDashboardStyles.headerMessageBtn}
          accessibilityLabel="View messages"
        >
          <Ionicons
            name="chatbox-ellipses"
            size={24}
            color={COLORS.light.primary}
          />
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
              value={`₱${dashboardData.stats.revenue}`}
              color={COLORS.light.oceanMedium}
            />
            {/* Pending Orders */}
            <StatCard
              icon="progress-clock"
              label="Pending Orders"
              value={dashboardData.stats.pending}
              color={COLORS.light.coral}
            />
            {/* Store Rating */}
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
            <TouchableOpacity onPress={() => router.push("/(seller-tabs)")}>
              <Text style={sellerDashboardStyles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {dashboardData.recentOrders.map((order) => (
            <OrderItem key={order.id} order={order} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default SellerDashboard;
