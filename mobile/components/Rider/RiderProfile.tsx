import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { COLORS } from "../../constants";
import { riderProfileStyles } from "./styles/riderProfileStyles";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";

type RiderProfileData = {
  user_id: string;
  avatar_url: string | null;
  vehicle_type: string | null;
  approval_status: string;
  is_available: boolean;
  full_name: string;
  email: string;
};

const RiderProfile = () => {
  const [profile, setProfile] = useState<RiderProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    fetchRiderProfile();
  }, [user?.id]);

  const fetchRiderProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch rider profile and user profile data
      const { data: riderData, error: riderError } = await supabase
        .from("rider_profiles")
        .select(
          `
          user_id,
          avatar_url,
          vehicle_type,
          approval_status,
          is_available
        `,
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (riderError) throw riderError;

      // Fetch user profile data (full name)
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", user.id)
        .maybeSingle();

      if (userError) throw userError;

      // ✅ FIXED: Ensure all required fields are present
      setProfile({
        user_id: riderData?.user_id || user.id,
        avatar_url: riderData?.avatar_url || null,
        vehicle_type: riderData?.vehicle_type || null,
        approval_status: riderData?.approval_status || "pending",
        is_available: riderData?.is_available || false,
        full_name: userData?.full_name || "Rider",
        email: userData?.email || "",
      });
    } catch (error) {
      console.error("Error fetching rider profile:", error);
    } finally {
      setLoading(false);
    }
  };

  /** Rider–related menu items */
  const riderMenus = [
    {
      id: 1,
      title: "Edit Profile",
      subtitle: "Update your rider information",
      icon: "person-circle-outline" as const,
      onPress: () => router.push("/rider/edit-profile"),
    },
    {
      id: 2,
      title: "Delivery History",
      subtitle: "View completed deliveries",
      icon: "bicycle-outline" as const,
      onPress: () => router.push("/(rider-tabs)"),
    },
    {
      id: 3,
      title: "Customer Reviews",
      subtitle: "View and respond to feedback",
      icon: "star-outline" as const,
      onPress: () => router.push("/rider/customer-reviews"),
    },
  ];

  /** Support section */
  const supportMenus = [
    {
      id: 5,
      title: "Support",
      subtitle: "Get rider assistance",
      icon: "help-circle-outline" as const,
      onPress: () => router.push("/support&help"),
    },
    {
      id: 6,
      title: "About",
      subtitle: "Learn more about this platform",
      icon: "information-circle-outline" as const,
      onPress: () => router.push("/about"),
    },
  ];

  type MenuItem = {
    id: number;
    title: string;
    subtitle: string;
    icon: any;
    onPress: () => void;
  };

  /** Render Menu Item */
  const renderMenuItem = (section: MenuItem) => (
    <TouchableOpacity
      key={section.id}
      style={riderProfileStyles.menuItem}
      onPress={section.onPress}
      activeOpacity={0.7}
    >
      <View style={riderProfileStyles.menuIconContainer}>
        <Ionicons name={section.icon} size={24} color={COLORS.light.primary} />
      </View>

      <View style={riderProfileStyles.menuTextContainer}>
        <Text style={riderProfileStyles.menuTitle}>{section.title}</Text>
        <Text style={riderProfileStyles.menuSubtitle}>{section.subtitle}</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={COLORS.light.oceanMedium}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.primary }}>
        <View style={riderProfileStyles.container}>
          <View style={riderProfileStyles.headerBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={riderProfileStyles.headerBackBtn}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>
            <Text style={riderProfileStyles.headerTitle}>Rider Profile</Text>
          </View>
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color={COLORS.light.primary} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.primary }}>
      <View style={riderProfileStyles.container}>
        {/* Header */}
        <View style={riderProfileStyles.headerBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={riderProfileStyles.headerBackBtn}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={riderProfileStyles.headerTitle}>Rider Profile</Text>
        </View>

        <ScrollView
          style={riderProfileStyles.scrollView}
          contentContainerStyle={riderProfileStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={riderProfileStyles.header}>
            <View style={riderProfileStyles.profileSection}>
              <View style={riderProfileStyles.imageContainer}>
                {profile?.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={riderProfileStyles.profileImage}
                  />
                ) : (
                  <View
                    style={[
                      riderProfileStyles.profileImage,
                      {
                        backgroundColor: "#e0f2ed",
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 32,
                        fontWeight: "bold",
                        color: COLORS.light.primary,
                      }}
                    >
                      {profile?.full_name?.charAt(0) || "R"}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={riderProfileStyles.editImageButton}
                  onPress={() => router.push("/rider/edit-profile")}
                >
                  <Ionicons
                    name="camera"
                    size={16}
                    color={COLORS.common.white}
                  />
                </TouchableOpacity>
              </View>

              <View style={riderProfileStyles.userDetails}>
                <Text style={riderProfileStyles.userName}>
                  {profile?.full_name || "Rider"}
                </Text>
                <Text style={riderProfileStyles.userEmail}>
                  {profile?.vehicle_type
                    ? `${profile.vehicle_type} • ${profile.is_available ? "Available" : "Offline"}`
                    : profile?.is_available
                      ? "Available"
                      : "Offline"}
                </Text>

                <View style={riderProfileStyles.actionButtons}>
                  <TouchableOpacity
                    style={riderProfileStyles.primaryButton}
                    onPress={() => router.push("/rider/edit-profile")}
                  >
                    <Ionicons
                      name="pencil"
                      size={12}
                      color={COLORS.common.white}
                    />
                    <Text style={riderProfileStyles.primaryButtonText}>
                      Edit Profile
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Menu Sections */}
          <View style={riderProfileStyles.sectionsContainer}>
            {/* Rider Management */}
            <View style={riderProfileStyles.sectionContainer}>
              <View style={riderProfileStyles.menuContainer}>
                {riderMenus.map(renderMenuItem)}
              </View>
            </View>

            {/* Support */}
            <View style={riderProfileStyles.sectionContainer}>
              <View style={riderProfileStyles.menuContainer}>
                {supportMenus.map(renderMenuItem)}
              </View>
            </View>

            {/* App Version */}
            <Text style={riderProfileStyles.versionText}>Version 1.0.0</Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default RiderProfile;
