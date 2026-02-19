import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  AppState,
  AppStateStatus,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router, useFocusEffect } from "expo-router";
import { COLORS } from "@/constants";
import { RiderDeliveryStyles } from "./styles/riderDeliveryStyles";
import { supabase } from "@/lib/supabase";
import {
  deliveryService,
  Delivery,
  DatabaseDeliveryStatus,
  UITabStatus,
} from "@/services/deliveryService";
import { locationService } from "@/services/locationService";

// Map database status to UI tabs
const statusToTab = (status: DatabaseDeliveryStatus): UITabStatus => {
  const map: Record<DatabaseDeliveryStatus, UITabStatus> = {
    assigned: "to-pickup",
    ready_to_pickup: "to-pickup",
    picked_up: "in-transit",
    delivered: "delivered",
    failed: "failed",
    cancelled: "canceled",
    rejected: "canceled",
    pending: "to-pickup", // fallback
  };
  return map[status] || "to-pickup";
};

// Map UI tabs to database statuses (for filtering)
const tabToStatuses: Record<UITabStatus, DatabaseDeliveryStatus[]> = {
  "to-pickup": ["assigned", "pending", "ready_to_pickup"],
  "in-transit": ["picked_up"],
  delivered: ["delivered"],
  failed: ["failed"],
  canceled: ["cancelled", "rejected"],
};

const RiderDelivery = () => {
  const [activeTab, setActiveTab] = useState<UITabStatus>("to-pickup");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const navigation = useNavigation();

  const tabs: { key: UITabStatus; label: string }[] = [
    { key: "to-pickup", label: "To Pickup" },
    { key: "in-transit", label: "In Transit" },
    { key: "delivered", label: "Delivered" },
    { key: "failed", label: "Failed" },
    { key: "canceled", label: "Canceled" },
  ];

  // Get current rider ID
  useEffect(() => {
    const getCurrentRider = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setRiderId(user.id);
      }
    };
    getCurrentRider();
  }, []);

  // Start/stop location tracking based on app state
  useEffect(() => {
    if (!riderId) return;

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          locationService
            .startTracking(riderId)
            .then(() => {
              setIsTracking(true);
            })
            .catch(console.error);
        } else if (nextAppState === "background") {
          locationService.stopTracking();
          setIsTracking(false);
        }
      },
    );

    locationService
      .startTracking(riderId)
      .then(() => {
        setIsTracking(true);
      })
      .catch(console.error);

    return () => {
      subscription.remove();
      locationService.stopTracking();
    };
  }, [riderId]);

  // Load deliveries when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (riderId) {
        loadDeliveries();
      }
    }, [riderId]),
  );

  // Filter deliveries when tab changes or deliveries update
  useEffect(() => {
    const statuses = tabToStatuses[activeTab] || [];
    const filtered = deliveries.filter((d) => statuses.includes(d.status));
    setFilteredDeliveries(filtered);
  }, [activeTab, deliveries]);

  const loadDeliveries = async () => {
    if (!riderId) return;

    setLoading(true);
    try {
      const data = await deliveryService.getRiderDeliveries(riderId);
      setDeliveries(data);
    } catch (error) {
      console.error("Error loading deliveries:", error);
      Alert.alert("Error", "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  // Handle accepting a delivery offer
  const handleAcceptDelivery = async (deliveryId: string) => {
    if (!riderId) return;

    try {
      const result = await deliveryService.respondToOffer(
        deliveryId,
        riderId,
        true,
      );
      Alert.alert("Success", "You have accepted this delivery!");
      loadDeliveries();
    } catch (error: any) {
      console.error("Error accepting delivery:", error);
      Alert.alert("Error", error.message || "Failed to accept delivery");
    }
  };

  // Handle rejecting a delivery
  const handleRejectDelivery = async (deliveryId: string) => {
    if (!riderId) return;

    Alert.alert(
      "Reject Delivery",
      "Are you sure you want to reject this delivery?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await deliveryService.respondToOffer(deliveryId, riderId, false);
              Alert.alert("Success", "Delivery rejected");
              loadDeliveries();
            } catch (error) {
              console.error("Error rejecting delivery:", error);
              Alert.alert("Error", "Failed to reject delivery");
            }
          },
        },
      ],
    );
  };

  // Handle pickup (after seller marks as ready)
  const handlePickup = async (deliveryId: string) => {
    try {
      await deliveryService.updateDeliveryStatus(deliveryId, "picked_up");

      // Also update order status to "shipped"
      const { data: delivery } = await supabase
        .from("deliveries")
        .select("order_id")
        .eq("delivery_id", deliveryId)
        .single();

      if (delivery) {
        await supabase
          .from("orders")
          .update({ order_status: "shipped" })
          .eq("order_id", delivery.order_id);
      }

      Alert.alert("Success", "Marked as picked up");
      loadDeliveries();
    } catch (error) {
      console.error("Error updating delivery:", error);
      Alert.alert("Error", "Failed to update delivery");
    }
  };

  // Handle delivery complete
  const handleDelivered = async (deliveryId: string) => {
    Alert.alert("Confirm Delivery", "Mark this delivery as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            await deliveryService.updateDeliveryStatus(deliveryId, "delivered");
            Alert.alert("Success", "Delivery completed!");
            loadDeliveries();
          } catch (error) {
            console.error("Error updating delivery:", error);
            Alert.alert("Error", "Failed to update delivery");
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: DatabaseDeliveryStatus) => {
    switch (status) {
      case "assigned":
      case "pending":
      case "ready_to_pickup":
        return "#f59e0b";
      case "picked_up":
        return "#3b82f6";
      case "delivered":
        return "#10b981";
      case "failed":
        return "#ef4444";
      case "cancelled":
      case "rejected":
        return "#6b7280";
      default:
        return COLORS.light.primary;
    }
  };

  const getStatusLabel = (status: DatabaseDeliveryStatus): string => {
    const map: Record<DatabaseDeliveryStatus, string> = {
      assigned: "To Pickup",
      ready_to_pickup: "Ready to Pickup",
      pending: "To Pickup",
      picked_up: "In Transit",
      delivered: "Delivered",
      failed: "Failed",
      cancelled: "Canceled",
      rejected: "Canceled",
    };
    return map[status] || status;
  };

  const renderDeliveryCard = (delivery: Delivery) => (
    <View key={delivery.id} style={RiderDeliveryStyles.orderCard}>
      {/* Delivery Header */}
      <View style={RiderDeliveryStyles.orderHeader}>
        <View>
          <Text style={RiderDeliveryStyles.orderId}>
            {delivery.order_number}
          </Text>
          <Text style={RiderDeliveryStyles.orderDate}>
            {delivery.scheduled_date}
          </Text>
        </View>
        <View
          style={[
            RiderDeliveryStyles.statusBadge,
            { backgroundColor: getStatusColor(delivery.status) },
          ]}
        >
          <Text style={RiderDeliveryStyles.statusText}>
            {getStatusLabel(delivery.status)}
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
            Pickup from: {delivery.vendor_address}
          </Text>
          <Text style={RiderDeliveryStyles.addressText}>
            Deliver to: {delivery.delivery_address}
          </Text>
        </View>

        <View style={RiderDeliveryStyles.totalRow}>
          <Text style={RiderDeliveryStyles.totalLabel}>Total Amount:</Text>
          <Text style={RiderDeliveryStyles.totalAmount}>
            ₱{delivery.total_amount.toLocaleString()}
          </Text>
        </View>

        {/* Action Buttons based on status */}
        <View style={RiderDeliveryStyles.actionButtons}>
          {/* STAGE 1: New offer - Rider can accept or reject */}
          {delivery.status === "pending" && (
            <>
              <TouchableOpacity
                style={RiderDeliveryStyles.secondaryButton}
                onPress={() => handleRejectDelivery(delivery.id)}
              >
                <Text style={RiderDeliveryStyles.secondaryButtonText}>
                  Reject
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={RiderDeliveryStyles.primaryButton}
                onPress={() => handleAcceptDelivery(delivery.id)}
              >
                <Text style={RiderDeliveryStyles.primaryButtonText}>
                  Accept Delivery
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* STAGE 2: Accepted but waiting for seller to prepare */}
          {delivery.status === "assigned" && (
            <>
              <TouchableOpacity
                style={[RiderDeliveryStyles.secondaryButton]}
                onPress={() => handleRejectDelivery(delivery.id)}
              >
                <Text style={RiderDeliveryStyles.secondaryButtonText}>
                  Cancel Delivery
                </Text>
              </TouchableOpacity>
              <View
                style={{
                  padding: 12,
                  backgroundColor: "#f0f9ff",
                  borderRadius: 8,
                  marginBottom: 12,
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <Ionicons name="time-outline" size={24} color="#0369a1" />
                <Text
                  style={{
                    color: "#0369a1",
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  Waiting for seller to prepare your order
                </Text>
                <Text style={{ color: "#0284c7", fontSize: 12, marginTop: 4 }}>
                  You'll be notified when ready for pickup
                </Text>
              </View>
            </>
          )}

          {/* STAGE 3: Seller marked as ready - Rider can pickup */}
          {delivery.status === "ready_to_pickup" && (
            <>
              <TouchableOpacity
                style={RiderDeliveryStyles.secondaryButton}
                onPress={() => handleRejectDelivery(delivery.id)}
              >
                <Text style={RiderDeliveryStyles.secondaryButtonText}>
                  Reject
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={RiderDeliveryStyles.primaryButton}
                onPress={() => handlePickup(delivery.id)}
              >
                <Text style={RiderDeliveryStyles.primaryButtonText}>
                  Pickup Now
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* STAGE 4: Picked up - En route to customer */}
          {delivery.status === "picked_up" && (
            <>
              <TouchableOpacity
                style={RiderDeliveryStyles.secondaryButton}
                onPress={() => {
                  Alert.alert("Contact", "Call customer?");
                }}
              >
                <Text style={RiderDeliveryStyles.secondaryButtonText}>
                  Contact Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={RiderDeliveryStyles.primaryButton}
                onPress={() => handleDelivered(delivery.id)}
              >
                <Text style={RiderDeliveryStyles.primaryButtonText}>
                  Mark Delivered
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* STAGE 5: Delivered - Show receipt option */}
          {delivery.status === "delivered" && (
            <TouchableOpacity style={RiderDeliveryStyles.secondaryButton}>
              <Text style={RiderDeliveryStyles.secondaryButtonText}>
                View Receipt
              </Text>
            </TouchableOpacity>
          )}

          {/* Failed deliveries */}
          {delivery.status === "failed" && (
            <TouchableOpacity style={RiderDeliveryStyles.primaryButton}>
              <Text style={RiderDeliveryStyles.primaryButtonText}>
                Report Issue
              </Text>
            </TouchableOpacity>
          )}

          {/* Cancelled/Rejected deliveries */}
          {(delivery.status === "cancelled" ||
            delivery.status === "rejected") && (
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

  // Show tracking status indicator
  const renderTrackingIndicator = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: isTracking ? "#e8f5e9" : "#ffebee",
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: isTracking ? "#4caf50" : "#f44336",
          marginRight: 8,
        }}
      />
      <Text
        style={{
          fontSize: 12,
          color: isTracking ? "#2e7d32" : "#c62828",
        }}
      >
        {isTracking ? "Location tracking active" : "Location tracking off"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={RiderDeliveryStyles.container}>
      {/* Tracking Status Indicator */}
      {renderTrackingIndicator()}

      {/* Header */}
      <View style={RiderDeliveryStyles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={RiderDeliveryStyles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={RiderDeliveryStyles.headerTitle}>My Deliveries</Text>
        <TouchableOpacity onPress={loadDeliveries}>
          <Ionicons name="refresh" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
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
        {loading ? (
          <View style={RiderDeliveryStyles.emptyState}>
            <Text>Loading deliveries...</Text>
          </View>
        ) : filteredDeliveries.length > 0 ? (
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
