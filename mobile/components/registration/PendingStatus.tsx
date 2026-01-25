import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../../constants";

interface PendingStatusProps {
  type: "vendor" | "rider";
}

const PendingStatus: React.FC<PendingStatusProps> = ({ type }) => {
  const title = type === "vendor" ? "Seller" : "Rider";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Exact same as RiderWelcome */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title} Registration Status</Text>
      </View>

      {/* Content Container - Same structure as RiderWelcome */}
      <View style={styles.contentContainer}>
        <View style={styles.content}>
          {/* Hero Icon - Same style as RiderWelcome */}
          <View style={styles.iconWrapper}>
            <Ionicons
              name={
                type === "vendor" ? "storefront-outline" : "bicycle-outline"
              }
              size={48}
              color={COLORS.light.primary}
            />
          </View>

          <Text style={styles.title}>Application Under Review</Text>

          <Text style={styles.description}>
            Your {title.toLowerCase()} registration is currently being reviewed
            by our team. This process typically takes 1-3 business days.
          </Text>

          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Current Status</Text>
            <View style={styles.statusBadge}>
              <Ionicons name="time-outline" size={16} color="#f59e0b" />
              <Text style={styles.statusText}>Pending Review</Text>
            </View>
          </View>

          <Text style={styles.footerText}>
            You will be notified once your application is approved
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.common.white,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f2ed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginLeft: 12,
  },
  contentContainer: {
    flex: 1,
    padding: 24, // Same outer padding as RiderWelcome
  },
  content: {
    borderRadius: 20,
    padding: 24, // Same inner padding as RiderWelcome
    alignItems: "center",
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0fdfa",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: COLORS.light.oceanMedium,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  statusCard: {
    width: "100%",
    backgroundColor: "#fffbeb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fef3c7",
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
    marginLeft: 6,
  },

  footerText: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    textAlign: "center",
  },
});

export default PendingStatus;
