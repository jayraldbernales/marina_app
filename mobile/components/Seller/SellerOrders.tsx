import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { COLORS } from "@/constants";
import { sellerOrderStyles } from "./styles/sellerOrderStyles";

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready-to-ship"
  | "shipped"
  | "delivered"
  | "canceled";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: ImageSourcePropType;
};

type Order = {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  orderDate: string;
  paymentMethod: string;
  deliveryAddress: string;
  customerName: string;
  riderAssignment?: {
    id: string;
    name: string;
    avatar?: ImageSourcePropType;
    contact?: string;
    status?: "assigned" | "picking" | "delivering" | "picked-up";
  } | null;
};

// Mock data
const mockOrders: Order[] = [
  {
    id: "ORD-001",
    items: [
      {
        id: "1",
        name: "Mayamaya",
        price: 480,
        quantity: 2,
        image: require("@/assets/img/mayamaya.jpg"),
      },
    ],
    status: "pending",
    totalAmount: 1010,
    orderDate: "2024-01-20",
    paymentMethod: "GCash",
    deliveryAddress: "123 Seaside Avenue, Coastal City",
    customerName: "John Doe",
  },
  {
    id: "ORD-002",
    items: [
      {
        id: "2",
        name: "Crab",
        price: 650,
        quantity: 1,
        image: require("@/assets/img/crab.jpg"),
      },
    ],
    status: "canceled",
    totalAmount: 700,
    orderDate: "2024-01-19",
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "456 Marine Drive, Beach Town",
    customerName: "Jane Smith",
  },
  {
    id: "ORD-003",
    items: [
      {
        id: "3",
        name: "Mayamaya",
        price: 480,
        quantity: 1,
        image: require("@/assets/img/mayamaya.jpg"),
      },
    ],
    status: "pending",
    totalAmount: 530,
    orderDate: "2024-01-18",
    paymentMethod: "GCash",
    deliveryAddress: "789 Ocean Boulevard, Port City",
    customerName: "Alice Johnson",
  },
  {
    id: "ORD-004",
    items: [
      {
        id: "4",
        name: "Crab",
        price: 650,
        quantity: 2,
        image: require("@/assets/img/crab.jpg"),
      },
    ],
    status: "pending",
    totalAmount: 1350,
    orderDate: "2024-01-15",
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
    customerName: "Bob Wilson",
  },
  {
    id: "ORD-005",
    items: [
      {
        id: "5",
        name: "Crab",
        price: 650,
        quantity: 2,
        image: require("@/assets/img/crab.jpg"),
      },
    ],
    status: "shipped",
    totalAmount: 1350,
    orderDate: "2024-01-15",
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
    customerName: "Carol Davis",
    riderAssignment: {
      id: "R-101",
      name: "Alex Rivera",
      contact: "+639171234567",
    },
  },
  {
    id: "ORD-006",
    items: [
      {
        id: "6",
        name: "Crab",
        price: 650,
        quantity: 2,
        image: require("@/assets/img/crab.jpg"),
      },
    ],
    status: "ready-to-ship",
    totalAmount: 1350,
    orderDate: "2024-01-15",
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
    customerName: "David Lee",
    riderAssignment: null,
  },
  {
    id: "ORD-007",
    items: [
      {
        id: "7",
        name: "Crab",
        price: 650,
        quantity: 2,
        image: require("@/assets/img/crab.jpg"),
      },
    ],
    status: "delivered",
    totalAmount: 1350,
    orderDate: "2024-01-15",
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
    customerName: "Eve Chen",
    riderAssignment: {
      id: "R-112",
      name: "Jonah Bautista",
      contact: "+639175551234",
      status: "delivering",
    },
  },
  {
    id: "ORD-008",
    items: [
      {
        id: "8",
        name: "Crab",
        price: 650,
        quantity: 2,
        image: require("@/assets/img/crab.jpg"),
      },
    ],
    status: "preparing",
    totalAmount: 1350,
    orderDate: "2024-01-15",
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
    customerName: "Frank Garcia",
    riderAssignment: null,
  },
];

const SellerOrders = () => {
  const [activeTab, setActiveTab] = useState<OrderStatus>("pending");
  const navigation = useNavigation();

  const tabs: { key: OrderStatus; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "preparing", label: "Preparing" },
    { key: "ready-to-ship", label: "Ready to Ship" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "canceled", label: "Canceled" },
  ];

  const filteredOrders = mockOrders.filter(
    (order) => order.status === activeTab
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
      case "canceled":
        return "#6b7280";
      default:
        return COLORS.light.primary;
    }
  };

  const renderOrderCard = (order: Order) => (
    <View key={order.id} style={sellerOrderStyles.orderCard}>
      {/* Order Header */}
      <View style={sellerOrderStyles.orderHeader}>
        <View>
          <Text style={sellerOrderStyles.orderId}>{order.id}</Text>
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
            {tabs.find((t) => t.key === order.status)?.label}
          </Text>
        </View>
      </View>
      {/* Rider Assignment */}
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
      {order.items.map((item) => (
        <View key={item.id} style={sellerOrderStyles.itemRow}>
          <Image source={item.image} style={sellerOrderStyles.itemImage} />
          <View style={sellerOrderStyles.itemDetails}>
            <Text style={sellerOrderStyles.itemName}>{item.name}</Text>
            <Text style={sellerOrderStyles.itemPrice}>
              ₱{item.price} × {item.quantity}
            </Text>
          </View>
        </View>
      ))}
      {/* Order Footer */}
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
        {/* Action Buttons based on status */}
        <View style={sellerOrderStyles.actionButtons}>
          {order.status === "pending" && (
            <>
              <TouchableOpacity style={sellerOrderStyles.secondaryButton}>
                <Text style={sellerOrderStyles.secondaryButtonText}>
                  Reject Order
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={sellerOrderStyles.primaryButton}>
                <Text style={sellerOrderStyles.primaryButtonText}>
                  Accept Order
                </Text>
              </TouchableOpacity>
            </>
          )}
          {order.status === "preparing" && (
            <TouchableOpacity style={sellerOrderStyles.primaryButton}>
              <Text style={sellerOrderStyles.primaryButtonText}>
                Mark Ready to Ship
              </Text>
            </TouchableOpacity>
          )}
          {order.status === "ready-to-ship" && (
            <TouchableOpacity style={sellerOrderStyles.primaryButton}>
              <Text style={sellerOrderStyles.primaryButtonText}>
                Mark as Shipped
              </Text>
            </TouchableOpacity>
          )}
          {order.status === "shipped" && (
            <>
              <TouchableOpacity
                style={sellerOrderStyles.secondaryButton}
                onPress={() => router.push("/order-tracking")}
              >
                <Text style={sellerOrderStyles.secondaryButtonText}>
                  Track Shipment
                </Text>
              </TouchableOpacity>
            </>
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
          {order.status === "canceled" && (
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
      <ScrollView style={sellerOrderStyles.ordersContainer}>
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
