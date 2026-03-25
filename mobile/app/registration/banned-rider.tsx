// app/registration/banned-rider.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../constants";

export default function BannedRider() {
  const params = useLocalSearchParams();
  const approval_notes = (params.approval_notes as string) || "";
  const title = "Rider";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title} Account Status</Text>
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Hero Icon - Changed to ban icon for banned status */}
            <View style={[styles.iconWrapper, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="ban" size={48} color="#dc2626" />
            </View>

            <Text style={[styles.title, { color: "#dc2626" }]}>
              Account Banned
            </Text>

            <Text style={styles.description}>
              Your {title.toLowerCase()} account has been banned from the
              platform.
            </Text>

            {/* Action Buttons - SAME AS REJECTED */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {
                  // You can add support contact action here
                  // e.g., open email, phone, or support chat
                }}
              >
                <Text style={styles.secondaryButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// SAME STYLES AS REJECTED RIDER
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
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#dc2626",
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

  actionContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  secondaryButton: {
    backgroundColor: COLORS.common.white,
    borderWidth: 1,
    borderColor: COLORS.light.primary,
  },
  secondaryButtonText: {
    color: COLORS.light.primary,
    fontWeight: "600",
    fontSize: 15,
  },
});
