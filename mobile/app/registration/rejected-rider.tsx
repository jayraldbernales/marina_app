// app/registration/rejected-rider.tsx - MATCHING VENDOR STYLE
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

export default function RejectedRider() {
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
        <Text style={styles.headerTitle}>{title} Registration Status</Text>
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Hero Icon */}
            <View style={styles.iconWrapper}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            </View>

            <Text style={styles.title}>Application Requires Attention</Text>

            <Text style={styles.description}>
              Your {title.toLowerCase()} registration needs additional review.
              Please check the details below.
            </Text>

            {/* Notes Section - SAME AS VENDOR */}
            {approval_notes ? (
              <View style={styles.notesCard}>
                <View style={styles.notesHeader}>
                  <Text style={styles.notestitle}>Admin Feedback</Text>
                </View>
                <Text style={styles.notesText}>{approval_notes}</Text>
              </View>
            ) : (
              <View style={styles.noNotesCard}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#6b7280"
                />
                <Text style={styles.noNotesText}>
                  No specific notes provided. Please contact support for
                  details.
                </Text>
              </View>
            )}

            {/* Action Buttons - SAME AS VENDOR */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => router.push("/registration/welcome-rider")}
              >
                <Text style={styles.primaryButtonText}>Reapply Now</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>
              You can reapply after addressing the issues mentioned above
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// SAME STYLES AS VENDOR
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
    backgroundColor: "#fef2f2",
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
  notesCard: {
    width: "100%",
    backgroundColor: "#f0fdfa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  notesText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    fontStyle: "italic",
  },
  noNotesCard: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  noNotesText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  notestitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.primary,
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
  primaryButton: {
    backgroundColor: COLORS.light.primary,
  },
  primaryButtonText: {
    color: COLORS.common.white,
    fontWeight: "600",
    fontSize: 15,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    textAlign: "center",
  },
});
