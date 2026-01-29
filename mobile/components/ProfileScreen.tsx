// ProfileTab.tsx - Updated with complete pull-to-refresh including status refetch
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../constants";
import { profileStyles } from "../components/styles/profileStyles";
import { supabase } from "../lib/supabase";
import { useRegistrationStatus } from "../hooks/useRegistrationStatus";
import {
  navigateToVendorFlow,
  navigateToRiderFlow,
} from "../lib/navigationHelpers";

type UserProfile = {
  full_name: string;
  avatar_url: string;
  email: string;
};

const ProfileTab = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Use the custom hook to get registration status
  const {
    isVendorApproved,
    isRiderApproved,
    vendorStatus,
    riderStatus,
    vendorNotes,
    riderNotes,
    isLoading: statusLoading,
    refetch: refetchStatus, // NEW: Destructure refetch
  } = useRegistrationStatus();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        console.error("No user session found");
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const userEmail = session.user.email || "";

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", userId)
        .single();

      if (error) {
        setProfile({
          full_name: "User",
          avatar_url: "",
          email: userEmail,
        });
      } else {
        setProfile({
          full_name: data?.full_name || "User",
          avatar_url: data?.avatar_url || "",
          email: userEmail,
        });
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Updated handler: Refetch both profile and status in parallel
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), refetchStatus()]);
    setRefreshing(false);
  };

  // Helper function to get subtitle based on status
  const getBusinessSubtitle = (type: "vendor" | "rider", status: string) => {
    switch (status) {
      case "approved":
        return "Go to dashboard";
      case "pending":
        return "View application status";
      case "rejected":
        return "Reapply or contact support";
      default:
        return type === "vendor" ? "Start selling" : "Start delivering";
    }
  };

  const accountMenus = [
    {
      id: 1,
      title: "My Account Information",
      subtitle: "Edit My Account Details",
      icon: "person-outline" as const,
      onPress: () => router.push("/account-information"),
    },
    {
      id: 2,
      title: "Settings",
      subtitle: "Account preferences",
      icon: "settings-outline" as const,
      onPress: () => console.log("Navigate to Settings"),
    },
  ];

  // Dynamic business menus based on registration status
  const businessMenus = [
    {
      id: 3,
      title: "My Shop",
      subtitle: getBusinessSubtitle("vendor", vendorStatus),
      icon: "storefront-outline" as const,
      onPress: () => navigateToVendorFlow(vendorStatus, vendorNotes),
    },
    {
      id: 4,
      title: "Delivery Center",
      subtitle: getBusinessSubtitle("rider", riderStatus),
      icon: "bicycle-outline" as const,
      onPress: () => navigateToRiderFlow(riderStatus, riderNotes),
    },
  ];

  const supportMenus = [
    {
      id: 5,
      title: "Support and Help",
      subtitle: "Get assistance",
      icon: "help-circle-outline" as const,
      onPress: () => router.push("/terms"),
    },
    {
      id: 6,
      title: "About",
      subtitle: "App information and terms",
      icon: "information-circle-outline" as const,
      onPress: () => router.push("/terms"),
    },
  ];

  const logOutMenus = [
    {
      id: 7,
      title: "Log Out",
      subtitle: "Sign out of your account",
      icon: "power" as const,
      onPress: () => {
        Alert.alert("Log Out", "Are you sure you want to sign out?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Log Out",
            style: "destructive",
            onPress: async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            },
          },
        ]);
      },
    },
  ];

  type MenuItem = {
    id: number;
    title: string;
    subtitle: string;
    icon: any;
    onPress: () => void;
  };

  const renderMenuItem = (section: MenuItem) => (
    <TouchableOpacity
      key={section.id}
      style={profileStyles.menuItem}
      onPress={section.onPress}
      accessibilityLabel={section.title}
      activeOpacity={0.7}
    >
      <View style={profileStyles.menuIconContainer}>
        <Ionicons name={section.icon} size={24} color={COLORS.light.primary} />
      </View>
      <View style={profileStyles.menuTextContainer}>
        <Text style={profileStyles.menuTitle}>{section.title}</Text>
        <Text style={profileStyles.menuSubtitle}>{section.subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={COLORS.light.oceanMedium}
      />
    </TouchableOpacity>
  );

  const isLoading = loading || statusLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.primary }}>
      <View style={profileStyles.container}>
        {isLoading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color={COLORS.light.primary} />
          </View>
        ) : (
          <ScrollView
            style={profileStyles.scrollView}
            contentContainerStyle={profileStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.light.primary]} // Optional: Customize spinner color
              />
            }
          >
            <View style={profileStyles.header}>
              <View style={profileStyles.profileSection}>
                <View style={profileStyles.imageContainer}>
                  <Image
                    source={
                      profile?.avatar_url
                        ? { uri: profile.avatar_url }
                        : require("../assets/img/user.jpg")
                    }
                    style={profileStyles.profileImage}
                    resizeMode="cover"
                  />

                  <TouchableOpacity
                    style={profileStyles.editImageButton}
                    onPress={() => console.log("Edit profile picture")}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="camera"
                      size={16}
                      color={COLORS.light.primary}
                    />
                  </TouchableOpacity>
                </View>
                <View style={profileStyles.userDetails}>
                  <Text style={profileStyles.userName}>
                    {profile?.full_name}
                  </Text>
                  <Text style={profileStyles.userEmail}>{profile?.email}</Text>
                  <View style={profileStyles.actionButtons}>
                    <TouchableOpacity
                      style={profileStyles.primaryButton}
                      onPress={() => router.push("/account-information")}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="pencil"
                        size={12}
                        color={COLORS.light.primary}
                      />
                      <Text style={profileStyles.primaryButtonText}>
                        Edit Profile
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            {/* Account Section */}
            <View style={profileStyles.sectionsContainer}>
              <View style={profileStyles.sectionContainer}>
                <View style={profileStyles.menuContainer}>
                  {accountMenus.map(renderMenuItem)}
                </View>
              </View>
              {/* Business Section */}
              <View style={profileStyles.sectionContainer}>
                <View style={profileStyles.menuContainer}>
                  {businessMenus.map(renderMenuItem)}
                </View>
              </View>
              {/* Support Section */}
              <View style={profileStyles.sectionContainer}>
                <View style={profileStyles.menuContainer}>
                  {supportMenus.map(renderMenuItem)}
                </View>
              </View>
              {/* Logout Section */}
              <View style={profileStyles.sectionContainer}>
                <View style={profileStyles.menuContainer}>
                  {logOutMenus.map(renderMenuItem)}
                </View>
              </View>
              {/* App Version */}
              <Text style={profileStyles.versionText}>Version 1.0.0</Text>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ProfileTab;
