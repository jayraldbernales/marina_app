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
import { RiderDeliveryStyles } from "./styles/riderDeliveryStyles";

type DeliveryStatus =
  | "to-pickup"
  | "in-transit"
  | "delivered"
  | "failed"
  | "canceled";

type DeliveryItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vendor: string;
  image: ImageSourcePropType;
};

type Delivery = {
  id: string;
  items: DeliveryItem[];
  status: DeliveryStatus;
  totalAmount: number;
  scheduledDate: string;
  deliveryAddress: string;
  vendorAddress: string;
};

// Mock data
const mockDeliveries: Delivery[] = [
  {
    id: "DEL-001",
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
    status: "to-pickup",
    totalAmount: 1010,
    scheduledDate: "2024-01-20",
    deliveryAddress: "123 Seaside Avenue, Coastal City",
    vendorAddress: "Maria's Catch, 100 Seafood St, Coastal City",
  },
  {
    id: "DEL-002",
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
    status: "failed",
    totalAmount: 700,
    scheduledDate: "2024-01-19",
    deliveryAddress: "456 Marine Drive, Beach Town",
    vendorAddress: "Ocean Harvest, 200 Marine Ave, Beach Town",
  },
  {
    id: "DEL-003",
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
    status: "to-pickup",
    totalAmount: 530,
    scheduledDate: "2024-01-18",
    deliveryAddress: "789 Ocean Boulevard, Port City",
    vendorAddress: "Maria's Catch, 100 Seafood St, Coastal City",
  },
  {
    id: "DEL-004",
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
    status: "to-pickup",
    totalAmount: 1350,
    scheduledDate: "2024-01-15",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
    vendorAddress: "Ocean Harvest, 200 Marine Ave, Beach Town",
  },
  {
    id: "DEL-005",
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
    status: "in-transit",
    totalAmount: 1350,
    scheduledDate: "2024-01-15",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
    vendorAddress: "Ocean Harvest, 200 Marine Ave, Beach Town",
  },
  {
    id: "DEL-006",
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
    status: "to-pickup",
    totalAmount: 1350,
    scheduledDate: "2024-01-15",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
    vendorAddress: "Ocean Harvest, 200 Marine Ave, Beach Town",
  },
  {
    id: "DEL-007",
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
    status: "delivered",
    totalAmount: 1350,
    scheduledDate: "2024-01-15",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
    vendorAddress: "Ocean Harvest, 200 Marine Ave, Beach Town",
  },
  {
    id: "DEL-008",
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
    scheduledDate: "2024-01-15",
    deliveryAddress: "321 Harbor Street, Fisherman's Wharf",
    vendorAddress: "Ocean Harvest, 200 Marine Ave, Beach Town",
  },
];

const RiderDelivery = () => {
  const [activeTab, setActiveTab] = useState<DeliveryStatus>("to-pickup");
  const navigation = useNavigation();
  const tabs: { key: DeliveryStatus; label: string }[] = [
    { key: "to-pickup", label: "To Pickup" },
    { key: "in-transit", label: "In Transit" },
    { key: "delivered", label: "Delivered" },
    { key: "failed", label: "Failed" },
    { key: "canceled", label: "Canceled" },
  ];
  const filteredDeliveries = mockDeliveries.filter(
    (delivery) => delivery.status === activeTab
  );
  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case "to-pickup":
        return "#f59e0b";
      case "in-transit":
        return "#3b82f6";
      case "delivered":
        return "#10b981";
      case "failed":
        return "#ef4444";
      case "canceled":
        return "#6b7280";
      default:
        return COLORS.light.primary;
    }
  };
  const renderDeliveryCard = (delivery: Delivery) => (
    <View key={delivery.id} style={RiderDeliveryStyles.orderCard}>
      {/* Delivery Header */}
      <View style={RiderDeliveryStyles.orderHeader}>
        <View>
          <Text style={RiderDeliveryStyles.orderId}>{delivery.id}</Text>
          <Text style={RiderDeliveryStyles.orderDate}>
            {delivery.scheduledDate}
          </Text>
        </View>
        <View
          style={[
            RiderDeliveryStyles.statusBadge,
            { backgroundColor: getStatusColor(delivery.status) },
          ]}
        >
          <Text style={RiderDeliveryStyles.statusText}>
            {tabs.find((t) => t.key === delivery.status)?.label}
          </Text>
        </View>
      </View>
      {/* Delivery Items */}
      {delivery.items.map((item) => (
        <View key={item.id} style={RiderDeliveryStyles.itemRow}>
          <Image source={item.image} style={RiderDeliveryStyles.itemImage} />
          <View style={RiderDeliveryStyles.itemDetails}>
            <Text style={RiderDeliveryStyles.itemName}>{item.name}</Text>
            <Text style={RiderDeliveryStyles.itemVendor}>{item.vendor}</Text>
            <Text style={RiderDeliveryStyles.itemPrice}>
              ₱{item.price} × {item.quantity}
            </Text>
          </View>
        </View>
      ))}
      {/* Delivery Footer */}
      <View style={RiderDeliveryStyles.orderFooter}>
        <View style={RiderDeliveryStyles.addressContainer}>
          <Text style={RiderDeliveryStyles.addressText}>
            Pickup from: {delivery.vendorAddress}
          </Text>
          <Text style={RiderDeliveryStyles.addressText}>
            Deliver to: {delivery.deliveryAddress}
          </Text>
        </View>
        <View style={RiderDeliveryStyles.totalRow}>
          <Text style={RiderDeliveryStyles.totalLabel}>Total Amount:</Text>
          <Text style={RiderDeliveryStyles.totalAmount}>
            ₱{delivery.totalAmount.toLocaleString()}
          </Text>
        </View>
        {/* Action Buttons based on status */}
        <View style={RiderDeliveryStyles.actionButtons}>
          {delivery.status === "to-pickup" && (
            <>
              <TouchableOpacity style={RiderDeliveryStyles.secondaryButton}>
                <Text style={RiderDeliveryStyles.secondaryButtonText}>
                  Contact Vendor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={RiderDeliveryStyles.primaryButton}>
                <Text style={RiderDeliveryStyles.primaryButtonText}>
                  Pickup Now
                </Text>
              </TouchableOpacity>
            </>
          )}
          {delivery.status === "in-transit" && (
            <>
              <TouchableOpacity style={RiderDeliveryStyles.secondaryButton}>
                <Text style={RiderDeliveryStyles.secondaryButtonText}>
                  Contact Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={RiderDeliveryStyles.primaryButton}>
                <Text style={RiderDeliveryStyles.primaryButtonText}>
                  Mark Delivered
                </Text>
              </TouchableOpacity>
            </>
          )}
          {delivery.status === "delivered" && (
            <TouchableOpacity style={RiderDeliveryStyles.secondaryButton}>
              <Text style={RiderDeliveryStyles.secondaryButtonText}>
                View Receipt
              </Text>
            </TouchableOpacity>
          )}
          {delivery.status === "failed" && (
            <TouchableOpacity style={RiderDeliveryStyles.primaryButton}>
              <Text style={RiderDeliveryStyles.primaryButtonText}>
                Report Issue
              </Text>
            </TouchableOpacity>
          )}
          {delivery.status === "canceled" && (
            <TouchableOpacity style={RiderDeliveryStyles.secondaryButton}>
              <Text style={RiderDeliveryStyles.secondaryButtonText}>
                View Details
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
  return (
    <SafeAreaView style={RiderDeliveryStyles.container}>
      {/* Header */}
      <View style={RiderDeliveryStyles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={RiderDeliveryStyles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={RiderDeliveryStyles.headerTitle}>My Deliveries</Text>
        <View style={{ width: 24 }} />
      </View>
      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={RiderDeliveryStyles.tabsContainer}
        contentContainerStyle={RiderDeliveryStyles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              RiderDeliveryStyles.tab,
              activeTab === tab.key && RiderDeliveryStyles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                RiderDeliveryStyles.tabText,
                activeTab === tab.key && RiderDeliveryStyles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Deliveries List */}
      <ScrollView style={RiderDeliveryStyles.ordersContainer}>
        {filteredDeliveries.length > 0 ? (
          filteredDeliveries.map(renderDeliveryCard)
        ) : (
          <View style={RiderDeliveryStyles.emptyState}>
            <Text style={RiderDeliveryStyles.emptyIcon}>📦</Text>
            <Text style={RiderDeliveryStyles.emptyTitle}>
              No deliveries found
            </Text>
            <Text style={RiderDeliveryStyles.emptyDescription}>
              You don't have any deliveries in this category yet
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
export default RiderDelivery;
