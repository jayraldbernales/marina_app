import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../constants";

const Settings = () => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion",
              "Please contact support to delete your account.",
              [{ text: "OK" }],
            );
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Account Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/account-information")}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Profile Information</Text>
              <Text style={styles.settingDescription}>
                Edit your name, email, and phone
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/buyer/address-management")}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="location-outline"
                size={20}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Address Management</Text>
              <Text style={styles.settingDescription}>
                Manage your delivery addresses
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Change Password</Text>
              <Text style={styles.settingDescription}>
                Update your password
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive push notifications
              </Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: "#e5e5e5", true: "#b3e5d8" }}
              thumbColor={pushNotifications ? COLORS.light.primary : "#f4f4f4"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive email updates
              </Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: "#e5e5e5", true: "#b3e5d8" }}
              thumbColor={emailNotifications ? COLORS.light.primary : "#f4f4f4"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="receipt-outline"
                size={20}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Order Updates</Text>
              <Text style={styles.settingDescription}>
                Get notified about your orders
              </Text>
            </View>
            <Switch
              value={orderUpdates}
              onValueChange={setOrderUpdates}
              trackColor={{ false: "#e5e5e5", true: "#b3e5d8" }}
              thumbColor={orderUpdates ? COLORS.light.primary : "#f4f4f4"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="pricetag-outline"
                size={20}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Promotions & Offers</Text>
              <Text style={styles.settingDescription}>
                Receive promotional emails
              </Text>
            </View>
            <Switch
              value={promotions}
              onValueChange={setPromotions}
              trackColor={{ false: "#e5e5e5", true: "#b3e5d8" }}
              thumbColor={promotions ? COLORS.light.primary : "#f4f4f4"}
            />
          </View>
        </View>

        {/* More */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>More</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/support&help")}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Help & Support</Text>
              <Text style={styles.settingDescription}>
                Get help with your orders
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/about")}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>About</Text>
              <Text style={styles.settingDescription}>
                Learn more about AgriConnect
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Terms of Service</Text>
              <Text style={styles.settingDescription}>
                Read our terms and conditions
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingIconContainer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Text style={styles.settingDescription}>
                How we handle your data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Actions</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIconContainer, styles.dangerIcon]}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, styles.dangerText]}>
                Delete Account
              </Text>
              <Text style={styles.settingDescription}>
                Permanently delete your account
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>AgriConnect Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.common.white,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f2ed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.common.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0f2ed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: "#999",
  },
  dangerIcon: {
    backgroundColor: "#fee2e2",
  },
  dangerText: {
    color: "#ef4444",
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: "#999",
  },
});
