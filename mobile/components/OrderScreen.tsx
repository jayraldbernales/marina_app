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
import { orderStyles } from "../components/styles/orderStyles";
type OrderStatus =
  | "to-pay"
  | "to-ship"
  | "to-receive"
  | "completed"
  | "return-refund"
  | "canceled";
type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vendor: string;
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
        vendor: "Maria's Catch",
        image: require("@/assets/img/mayamaya.jpg"),
      },
    ],
    status: "to-pay",
    totalAmount: 1010,
    orderDate: "2024-01-20",
    paymentMethod: "GCash",
    deliveryAddress: "123 Seaside Avenue, Coastal City",
  },
  {
    id: "ORD-002",
    items: [
      {
        id: "2",
        name: "Crab",
        price: 650,
        quantity: 1,
        vendor: "Ocean Harvest",
        image: require("@/assets/img/crab.jpg"),
      },
    ],
    status: "return-refund",
    totalAmount: 700,
    orderDate: "2024-01-19",
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "456 Marine Drive, Beach Town",
  },
  {
    id: "ORD-003",
    items: [
      {
        id: "3",
        name: "Mayamaya",
        price: 480,
        quantity: 1,
        vendor: "Maria's Catch",
        image: require("@/assets/img/mayamaya.jpg"),
      },
    ],
    status: "to-pay",
    totalAmount: 530,
    orderDate: "2024-01-18",
    paymentMethod: "GCash",
    deliveryAddress: "789 Ocean Boulevard, Port City",
  },
  {
    id: "ORD-004",
    items: [
      {
        id: "4",
        name: "Crab",
        price: 650,
        quantity: 2,
        vendor: "Ocean Harvest",
        image: require("@/assets/img/crab.jpg"),
      },
    ],
    status: "to-pay",
    totalAmount: 1350,
    orderDate: "2024-01-15",
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
  },
  {
    id: "ORD-005",
    items: [
      {
        id: "5",
        name: "Crab",
        price: 650,
        quantity: 2,
        vendor: "Ocean Harvest",
        image: require("@/assets/img/crab.jpg"),
      },
    ],
    status: "to-receive",
    totalAmount: 1350,
    orderDate: "2024-01-15",
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
  },
  {
    id: "ORD-006",
    items: [
      {
        id: "6",
        name: "Crab",
        price: 650,
        quantity: 2,
        vendor: "Ocean Harvest",
        image: require("@/assets/img/crab.jpg"),
      },
    ],
    status: "to-ship",
    totalAmount: 1350,
    orderDate: "2024-01-15",
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
  },
  {
    id: "ORD-007",
    items: [
      {
        id: "7",
        name: "Crab",
        price: 650,
        quantity: 2,
        vendor: "Ocean Harvest",
        image: require("@/assets/img/crab.jpg"),
      },
    ],
    status: "completed",
    totalAmount: 1350,
    orderDate: "2024-01-15",
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
  },
  {
    id: "ORD-008",
    items: [
      {
        id: "8",
        name: "Crab",
        price: 650,
        quantity: 2,
        vendor: "Ocean Harvest",
        image: require("@/assets/img/crab.jpg"),
      },
    ],
    status: "canceled",
    totalAmount: 1350,
    orderDate: "2024-01-15",
    paymentMethod: "Cash on Delivery",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
  },
];
const OrdersScreen = () => {
  const [activeTab, setActiveTab] = useState<OrderStatus>("to-pay");
  const navigation = useNavigation();
  const tabs: { key: OrderStatus; label: string }[] = [
    { key: "to-pay", label: "To Pay" },
    { key: "to-ship", label: "To Ship" },
    { key: "to-receive", label: "To Receive" },
    { key: "completed", label: "Completed" },
    { key: "return-refund", label: "Return/Refund" },
    { key: "canceled", label: "Canceled" },
  ];
  const filteredOrders = mockOrders.filter(
    (order) => order.status === activeTab
  );
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "to-pay":
        return "#f59e0b";
      case "to-ship":
        return "#3b82f6";
      case "to-receive":
        return "#8b5cf6";
      case "completed":
        return "#10b981";
      case "return-refund":
        return "#ef4444";
      case "canceled":
        return "#6b7280";
      default:
        return COLORS.light.primary;
    }
  };
  const renderOrderCard = (order: Order) => (
    <View key={order.id} style={orderStyles.orderCard}>
      {/* Order Header */}
      <View style={orderStyles.orderHeader}>
        <View>
          <Text style={orderStyles.orderId}>{order.id}</Text>
          <Text style={orderStyles.orderDate}>{order.orderDate}</Text>
        </View>
        <View
          style={[
            orderStyles.statusBadge,
            { backgroundColor: getStatusColor(order.status) },
          ]}
        >
          <Text style={orderStyles.statusText}>
            {tabs.find((t) => t.key === order.status)?.label}
          </Text>
        </View>
      </View>
      {/* Order Items */}
      {order.items.map((item) => (
        <View key={item.id} style={orderStyles.itemRow}>
          <Image source={item.image} style={orderStyles.itemImage} />
          <View style={orderStyles.itemDetails}>
            <Text style={orderStyles.itemName}>{item.name}</Text>
            <Text style={orderStyles.itemVendor}>{item.vendor}</Text>
            <Text style={orderStyles.itemPrice}>
              ₱{item.price} × {item.quantity}
            </Text>
          </View>
        </View>
      ))}
      {/* Order Footer */}
      <View style={orderStyles.orderFooter}>
        <View style={orderStyles.totalRow}>
          <Text style={orderStyles.totalLabel}>Total Amount:</Text>
          <Text style={orderStyles.totalAmount}>
            ₱{order.totalAmount.toLocaleString()}
          </Text>
        </View>
        {/* Action Buttons based on status */}
        <View style={orderStyles.actionButtons}>
          {order.status === "to-pay" && (
            <>
              <TouchableOpacity style={orderStyles.secondaryButton}>
                <Text style={orderStyles.secondaryButtonText}>
                  Cancel Order
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={orderStyles.primaryButton}>
                <Text style={orderStyles.primaryButtonText}>Pay Now</Text>
              </TouchableOpacity>
            </>
          )}
          {order.status === "to-ship" && (
            <TouchableOpacity style={orderStyles.secondaryButton}>
              <Text style={orderStyles.secondaryButtonText}>
                Contact Seller
              </Text>
            </TouchableOpacity>
          )}
          {order.status === "to-receive" && (
            <>
              <TouchableOpacity
                style={orderStyles.secondaryButton}
                onPress={() => router.push("/order-tracking")}
              >
                <Text style={orderStyles.secondaryButtonText}>Track Order</Text>
              </TouchableOpacity>

              <TouchableOpacity style={orderStyles.primaryButton}>
                <Text style={orderStyles.primaryButtonText}>
                  Confirm Receipt
                </Text>
              </TouchableOpacity>
            </>
          )}
          {order.status === "completed" && (
            <>
              <TouchableOpacity style={orderStyles.secondaryButton}>
                <Text style={orderStyles.secondaryButtonText}>Buy Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={orderStyles.primaryButton}>
                <Text style={orderStyles.primaryButtonText}>Rate & Review</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
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
      <ScrollView style={orderStyles.ordersContainer}>
        {filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrderCard)
        ) : (
          <View style={orderStyles.emptyState}>
            <Text style={orderStyles.emptyIcon}>📦</Text>
            <Text style={orderStyles.emptyTitle}>No orders found</Text>
            <Text style={orderStyles.emptyDescription}>
              You don't have any orders in this category yet
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
export default OrdersScreen;
