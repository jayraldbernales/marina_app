import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { COLORS } from "../../constants";
import { sellerDashboardStyles } from "./styles/sellerDashboardStyles";

const statsData = [
  {
    id: 1,
    title: "Today's Sales",
    value: "₱12,450",
    change: "+12%",
    trend: "up",
    icon: "trending-up" as const,
    color: COLORS.light.accent,
  },
  {
    id: 2,
    title: "New Orders",
    value: "24",
    change: "+5",
    trend: "up",
    icon: "cart" as const,
    color: COLORS.light.accent,
  },
  {
    id: 3,
    title: "Pending Orders",
    value: "8",
    change: "-2",
    trend: "down",
    icon: "clock" as const,
    color: COLORS.light.coral,
  },
  {
    id: 4,
    title: "Low Stock",
    value: "3",
    change: "+1",
    trend: "up",
    icon: "alert" as const,
    color: COLORS.light.coral,
  },
];

const quickActions = [
  {
    id: 1,
    title: "Add Product",
    icon: "plus-circle" as const,
    screen: "/(seller-tabs)/products",
  },
  {
    id: 2,
    title: "View Orders",
    icon: "clipboard-list" as const,
    screen: "/(seller-tabs)/orders",
  },
  {
    id: 3,
    title: "Manage Stock",
    icon: "package-variant" as const,
    screen: "/(seller-tabs)/products",
  },
  {
    id: 4,
    title: "Analytics",
    icon: "chart-bar" as const,
    screen: "/(seller-tabs)/analytics",
  },
];

const recentOrders = [
  {
    id: "ORD-001",
    customer: "Maria Santos",
    items: "Bangus, Shrimp",
    total: "₱1,240",
    status: "preparing",
    time: "10 min ago",
  },
  {
    id: "ORD-002",
    customer: "Juan Dela Cruz",
    items: "Tuna, Squid",
    total: "₱980",
    status: "pending",
    time: "25 min ago",
  },
  {
    id: "ORD-003",
    customer: "Ana Reyes",
    items: "Crab, Mussels",
    total: "₱1,560",
    status: "ready",
    time: "45 min ago",
  },
];

const lowStockItems = [
  {
    id: 1,
    name: "Bangus",
    currentStock: 5,
    minStock: 10,
    unit: "kg",
  },
  {
    id: 2,
    name: "Tuna",
    currentStock: 3,
    minStock: 8,
    unit: "kg",
  },
  {
    id: 3,
    name: "Shrimp",
    currentStock: 2,
    minStock: 5,
    unit: "kg",
  },
];

const SellerDashboard = () => {
  const navigation = useNavigation();

  // Handlers
  const handleQuickAction = (screen: string) => {
    // @ts-ignore - Expo Router navigation
    navigation.navigate(screen);
  };

  const handleViewAllOrders = () => {
    // @ts-ignore - Expo Router navigation
    navigation.navigate("/(seller-tabs)/orders");
  };

  const handleRestock = (item: (typeof lowStockItems)[0]) => {
    console.log(`Restock ${item.name}`);
    // TODO: Navigate to inventory management
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return COLORS.light.coral;
      case "preparing":
        return COLORS.light.coral;
      case "ready":
        return COLORS.light.accent;
      default:
        return COLORS.common.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "preparing":
        return "Preparing";
      case "ready":
        return "Ready";
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.background }}>
      {/* Header with Back Button */}
      <View style={sellerDashboardStyles.headerBar}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          style={sellerDashboardStyles.headerBackBtn}
          accessibilityLabel="Back to dashboard"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={sellerDashboardStyles.headerTitle}>Seller Dashboard</Text>
      </View>

      <ScrollView
        style={sellerDashboardStyles.scrollArea}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={sellerDashboardStyles.welcomeSection}>
          <Text style={sellerDashboardStyles.welcomeTitle}>Good Morning!</Text>
          <Text style={sellerDashboardStyles.welcomeSubtitle}>
            Manage your seafood business
          </Text>
        </View>

        {/* Quick Stats */}
        <Text style={sellerDashboardStyles.sectionTitle}>Today's Overview</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 12 }}
          style={{ marginBottom: 20 }}
        >
          {statsData.map((stat) => (
            <View key={stat.id} style={sellerDashboardStyles.statCard}>
              <View style={sellerDashboardStyles.statHeader}>
                <MaterialCommunityIcons
                  name={stat.icon}
                  size={20}
                  color={stat.color}
                />
                <Text
                  style={[
                    sellerDashboardStyles.statChange,
                    {
                      color:
                        stat.trend === "up"
                          ? COLORS.light.accent
                          : COLORS.light.coral,
                    },
                  ]}
                >
                  {stat.change}
                </Text>
              </View>
              <Text style={sellerDashboardStyles.statValue}>{stat.value}</Text>
              <Text style={sellerDashboardStyles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Quick Actions */}
        <Text style={sellerDashboardStyles.sectionTitle}>Quick Actions</Text>
        <View style={sellerDashboardStyles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={sellerDashboardStyles.actionCard}
              onPress={() => handleQuickAction(action.screen)}
              accessibilityLabel={action.title}
            >
              <MaterialCommunityIcons
                name={action.icon}
                size={32}
                color={COLORS.light.primary}
              />
              <Text style={sellerDashboardStyles.actionTitle}>
                {action.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders */}
        <View style={sellerDashboardStyles.sectionHeader}>
          <Text style={sellerDashboardStyles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={handleViewAllOrders}>
            <Text style={sellerDashboardStyles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={sellerDashboardStyles.ordersCard}>
          {recentOrders.map((order) => (
            <View key={order.id} style={sellerDashboardStyles.orderItem}>
              <View style={sellerDashboardStyles.orderInfo}>
                <Text style={sellerDashboardStyles.orderId}>{order.id}</Text>
                <Text style={sellerDashboardStyles.orderCustomer}>
                  {order.customer}
                </Text>
                <Text style={sellerDashboardStyles.orderItems}>
                  {order.items}
                </Text>
                <Text style={sellerDashboardStyles.orderTime}>
                  {order.time}
                </Text>
              </View>
              <View style={sellerDashboardStyles.orderRight}>
                <Text style={sellerDashboardStyles.orderTotal}>
                  {order.total}
                </Text>
                <View
                  style={[
                    sellerDashboardStyles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) },
                  ]}
                >
                  <Text style={sellerDashboardStyles.statusText}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Low Stock Alerts */}
        <Text style={sellerDashboardStyles.sectionTitle}>Low Stock Alerts</Text>
        <View style={sellerDashboardStyles.stockCard}>
          {lowStockItems.map((item) => (
            <View key={item.id} style={sellerDashboardStyles.stockItem}>
              <View style={sellerDashboardStyles.stockInfo}>
                <Text style={sellerDashboardStyles.stockName}>{item.name}</Text>
                <Text style={sellerDashboardStyles.stockLevel}>
                  {item.currentStock} {item.unit} left
                </Text>
              </View>
              <TouchableOpacity
                style={sellerDashboardStyles.restockButton}
                onPress={() => handleRestock(item)}
              >
                <Text style={sellerDashboardStyles.restockButtonText}>
                  Restock
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SellerDashboard;
