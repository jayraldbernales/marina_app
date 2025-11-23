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

const COLORS = {
  primary: "#0A4D68",
  secondary: "#088395",
  accent: "#05BFDB",
  background: "#F0F7FF",
  coral: "#FF6B6B",
  white: "#FFFFFF",
  lightBlue: "#E3F2FD",
  darkBlue: "#1E3A5F",
  green: "#4CAF50",
  gray: "#666666",
  lightGray: "#E0E0E0",
};

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Order Tracking</Text>
          <Text style={styles.headerSubtitle}>MRN-2025-01</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Estimated Delivery */}
        <View style={styles.deliveryCard}>
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryLabel}>Estimated Delivery</Text>
            <Text style={styles.deliveryTime}>22 minutes</Text>
          </View>
          <MaterialCommunityIcons name="moped" size={40} color={COLORS.coral} />
        </View>

        {/* Order Status */}
        <View style={styles.section}>
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
                      color={status.completed ? COLORS.white : COLORS.gray}
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
                    color={COLORS.green}
                    style={styles.checkmark}
                  />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Delivery Rider */}
        <View style={styles.section}>
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
              <Ionicons name="call" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.addressHeader}>
            <Ionicons name="location-sharp" size={20} color={COLORS.primary} />
            <Text style={styles.addressTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addressText}>
            Purok 2, Cawayanan, Mabini, Bohol
          </Text>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
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
          <TouchableOpacity style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.trackButton}>
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
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.accent,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  deliveryCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  deliveryTime: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.darkBlue,
    marginBottom: 12,
  },
  statusContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  statusItem: {
    flexDirection: "row",
    marginBottom: 24,
  },
  statusIconContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statusIconCompleted: {
    backgroundColor: COLORS.accent,
  },
  statusIconPending: {
    backgroundColor: COLORS.lightGray,
  },
  statusLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.lightGray,
    marginTop: 4,
  },
  statusLineCompleted: {
    backgroundColor: COLORS.accent,
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
    color: COLORS.darkBlue,
  },
  statusTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  statusSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
  },
  checkmark: {
    marginLeft: 8,
  },
  riderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
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
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  riderAvatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
  riderName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkBlue,
    marginBottom: 2,
  },
  riderPlate: {
    fontSize: 13,
    color: COLORS.gray,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.darkBlue,
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 28,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryProductName: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.darkBlue,
    marginBottom: 2,
  },
  summaryProductQty: {
    fontSize: 12,
    color: COLORS.gray,
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkBlue,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 8,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.darkBlue,
  },
  summaryTotalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  supportButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  trackButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
});

export default OrderTrackingScreen;
