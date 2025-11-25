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
import { riderDashboardStyles } from "./styles/riderDashboardStyles";

// Types
type DeliveryStatus = "to-pickup" | "in-transit";

interface RecentDelivery {
  id: string;
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
}

interface DashboardData {
  stats: Stats;
  recentDeliveries: RecentDelivery[];
}

// Mock data for dashboard
const dashboardData: DashboardData = {
  stats: {
    deliveries: 8,
    earnings: 1240,
    pending: 3,
    rating: 4.9,
  },

  recentDeliveries: [
    {
      id: "DEL-001",
      customerName: "John Santos",
      address: "123 Seaside Avenue",
      status: "to-pickup",
      amount: 1010,
      items: 2,
    },
    {
      id: "DEL-005",
      customerName: "Maria Cruz",
      address: "321 Harbor Street",
      status: "in-transit",
      amount: 1350,
      items: 2,
    },
    {
      id: "DEL-003",
      customerName: "Pedro Reyes",
      address: "789 Ocean Boulevard",
      status: "to-pickup",
      amount: 530,
      items: 1,
    },
  ],
};

const RiderDashboard = () => {
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
        default:
          return COLORS.light.primary;
      }
    };

    return (
      <TouchableOpacity
        style={riderDashboardStyles.deliveryItem}
        onPress={() => router.push("/rider")}
      >
        <View style={riderDashboardStyles.deliveryItemHeader}>
          <View>
            <Text style={riderDashboardStyles.deliveryId}>{delivery.id}</Text>
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
              {delivery.status === "to-pickup" ? "To Pickup" : "In Transit"}
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
            ₱{delivery.amount}
          </Text>
          <Text style={riderDashboardStyles.deliveryItems}>
            {delivery.items} items
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
              value={`₱${dashboardData.stats.earnings}`}
              color={COLORS.light.oceanMedium}
            />

            {/* Pending Deliveries */}
            <StatCard
              icon="progress-clock"
              label="Pending Deliveries"
              value={dashboardData.stats.pending}
              color={COLORS.light.coral}
            />

            {/* Rider Rating */}
            <StatCard
              icon="star"
              label="Rating"
              value={`${dashboardData.stats.rating}`}
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
            <TouchableOpacity onPress={() => router.push("/deliveries")}>
              <Text style={riderDashboardStyles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {dashboardData.recentDeliveries.map((delivery) => (
            <DeliveryItem key={delivery.id} delivery={delivery} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RiderDashboard;
