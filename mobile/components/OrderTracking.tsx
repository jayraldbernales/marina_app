import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../constants";

const OrderTrackingScreen = () => {
  const orderStatuses: Array<{
    title: string;
    subtitle: string;
    time: string;
    icon: keyof typeof Ionicons.glyphMap;
    completed: boolean;
  }> = [
    {
      title: "Order Confirmed",
      subtitle: "Your order has been confirmed",
      time: "2:30 pm",
      icon: "checkmark-circle",
      completed: true,
    },
    {
      title: "Preparing Order",
      subtitle: "Fresh seafood being prepared",
      time: "2:45 pm",
      icon: "restaurant",
      completed: true,
    },
    {
      title: "Out for Delivery",
      subtitle: "On the way to your location",
      time: "In transit",
      icon: "car",
      completed: true,
    },
    {
      title: "Delivered",
      subtitle: "Order delivered successfully",
      time: "Pending",
      icon: "home",
      completed: false,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - matching dashboard header exactly */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/(tabs)/orders")}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Order Tracking</Text>
              <Text style={styles.headerSubtitle}>MRN-2025-01</Text>
            </View>
          </View>
          {/* Empty view for spacing to match dashboard layout */}
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Status Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.statusContainer}>
            {orderStatuses.map((status, index) => (
              <View key={index} style={styles.statusItem}>
                <View style={styles.statusIconContainer}>
                  <View
                    style={[
                      styles.statusIcon,
                      status.completed
                        ? styles.statusIconCompleted
                        : styles.statusIconPending,
                    ]}
                  >
                    <Ionicons
                      name={status.icon}
                      size={20}
                      color={status.completed ? "#fff" : COLORS.light.primary}
                    />
                  </View>
                  {index < orderStatuses.length - 1 && (
                    <View
                      style={[
                        styles.statusLine,
                        status.completed && styles.statusLineCompleted,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.statusContent}>
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusTitle}>{status.title}</Text>
                    <Text style={styles.statusTime}>{status.time}</Text>
                  </View>
                  <Text style={styles.statusSubtitle}>{status.subtitle}</Text>
                </View>
                {status.completed && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={COLORS.light.primary}
                    style={styles.checkmark}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Delivery Rider Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Delivery Rider</Text>
          <View style={styles.riderCard}>
            <View style={styles.riderInfo}>
              <View style={styles.riderAvatar}>
                <Text style={styles.riderAvatarText}>JD</Text>
              </View>
              <View>
                <Text style={styles.riderName}>Juan Dela Cruz</Text>
                <Text style={styles.riderPlate}>ABC 1234</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Ionicons name="call" size={24} color={COLORS.light.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address Section */}
        <View style={styles.sectionCard}>
          <View style={styles.addressHeader}>
            <Ionicons
              name="location-sharp"
              size={20}
              color={COLORS.light.primary}
            />
            <Text style={styles.addressTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addressText}>
            Purok 2, Cawayanan, Mabini, Bohol
          </Text>
        </View>

        {/* Order Summary Section */}
        <View style={[styles.sectionCard, { marginBottom: 20 }]}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <View>
                <Text style={styles.summaryProductName}>Fresh Red Snapper</Text>
                <Text style={styles.summaryProductQty}>Qty: 2</Text>
              </View>
              <Text style={styles.summaryPrice}>₱ 760.00</Text>
            </View>
            <View style={styles.summaryItem}>
              <View>
                <Text style={styles.summaryProductName}>Tiger Prawns</Text>
                <Text style={styles.summaryProductQty}>Qty: 1</Text>
              </View>
              <Text style={styles.summaryPrice}>₱ 50.00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryTotal}>Total:</Text>
              <Text style={styles.summaryTotalPrice}>₱ 810.00</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => router.push("./support&help")}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() => router.push("/(tabs)/orders")}
          >
            <Text style={styles.trackButtonText}>Track another order</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  // Header - exact match from dashboard
  header: {
    backgroundColor: COLORS.light.primary,
    paddingTop: 60,
    padding: 12,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#7fffd4",
    fontSize: 14,
  },
  // Scroll area - matching dashboard
  scrollArea: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
  },

  // Section Card - matching product card background
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginBottom: 12,
  },
  // Status styles
  statusContainer: {
    marginTop: 4,
  },
  statusItem: {
    flexDirection: "row",
    marginBottom: 20,
    position: "relative",
  },
  statusIconContainer: {
    alignItems: "center",
    marginRight: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statusIconCompleted: {
    backgroundColor: COLORS.light.primary,
  },
  statusIconPending: {
    backgroundColor: COLORS.light.seafoam,
  },
  statusLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.light.seafoam,
    marginTop: 4,
  },
  statusLineCompleted: {
    backgroundColor: COLORS.light.primary,
  },
  statusContent: {
    flex: 1,
  },
  statusTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  statusTime: {
    fontSize: 12,
    color: "#666",
  },
  statusSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  checkmark: {
    marginLeft: 8,
  },
  // Rider styles
  riderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  riderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  riderAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  riderName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  riderPlate: {
    fontSize: 13,
    color: "#666",
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.light.seafoam,
    justifyContent: "center",
    alignItems: "center",
  },
  // Address styles
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 28,
  },
  // Summary styles
  summaryCard: {
    marginTop: 4,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryProductName: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  summaryProductQty: {
    fontSize: 12,
    color: "#666",
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.light.seafoam,
    marginVertical: 8,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  summaryTotalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.light.coral,
  },
  // Action buttons
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 36,
  },
  supportButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.light.primary,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  trackButton: {
    flex: 1,
    backgroundColor: COLORS.light.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

export default OrderTrackingScreen;
