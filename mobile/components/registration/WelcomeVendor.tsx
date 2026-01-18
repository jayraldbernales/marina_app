import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../../constants";

const VendorWelcome = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Fixed at top */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Registration</Text>
      </View>

      {/* Scrollable content area */}
      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name="storefront"
              size={48}
              color={COLORS.light.primary}
            />
          </View>

          <Text style={styles.title}>Become a Seller on MARINA</Text>

          <Text style={styles.description}>
            Join our marketplace and reach thousands of customers
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infotitle}>What you'll need:</Text>

            <Text style={styles.infoText}>✔ Valid Id</Text>
            <Text style={styles.infoText}>✔ Selfie with ID</Text>
            <Text style={styles.infoText}>✔ Contact & payment details</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/registration/vendor-registration")}
          >
            <Text style={styles.buttonText}>Start Registration</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Registration takes about 3 minutes to complete
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default VendorWelcome;

/* ================= STYLES ================= */

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
    padding: 24,
  },
  content: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  infotitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: COLORS.light.oceanMedium,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  infoBox: {
    width: "100%",
    backgroundColor: "#f0fdfa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.light.primary,
    marginBottom: 6,
  },
  button: {
    backgroundColor: COLORS.light.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.common.white,
    fontWeight: "600",
    fontSize: 15,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    marginTop: 12,
    textAlign: "center",
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
});
