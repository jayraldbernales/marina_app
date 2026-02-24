import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../../constants";
import { sellerShopProfileStyles } from "./styles/sellerShopProfileStyles";
import { supabase } from "../../lib/supabase";

type VendorProfile = {
  shop_name: string;
  avatar_url: string;
  email: string;
};

const SellerShopProfile = () => {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
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

      // Fetch vendor profile
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("shop_name, avatar_url")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching vendor profile:", error);
        setProfile({
          shop_name: "My Shop",
          avatar_url: "",
          email: userEmail,
        });
      } else {
        setProfile({
          shop_name: data?.shop_name || "My Shop",
          avatar_url: data?.avatar_url || "",
          email: userEmail,
        });
      }
    } catch (error) {
      console.error("Error in fetchVendorProfile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVendorProfile();
    setRefreshing(false);
  };

  const shopMenus = [
    {
      id: 1,
      title: "Edit Shop Details",
      subtitle: "Update store information",
      icon: "pencil-outline" as const,
      onPress: () => router.push("/seller/edit-shop"),
    },
    {
      id: 2,
      title: "Manage Products",
      subtitle: "Add or edit products",
      icon: "storefront-outline" as const,
      onPress: () => router.push("/(seller-tabs)/products"),
    },
    {
      id: 3,
      title: "View Orders",
      subtitle: "Track customer orders",
      icon: "clipboard-outline" as const,
      onPress: () => router.push("/(seller-tabs)/orders"),
    },
    {
      id: 4,
      title: "Customer Reviews",
      subtitle: "View and respond to feedback",
      icon: "star-outline" as const,
      onPress: () => router.push("/seller/customer-reviews"),
    },
  ];

  const supportMenus = [
    {
      id: 5,
      title: "Support",
      subtitle: "Get help for your shop",
      icon: "help-circle-outline" as const,
      onPress: () => router.push("/support&help"),
    },
    {
      id: 6,
      title: "About",
      subtitle: "Learn more about our platform",
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

  const renderMenuItem = (section: MenuItem) => (
    <TouchableOpacity
      key={section.id}
      style={sellerShopProfileStyles.menuItem}
      onPress={section.onPress}
      accessibilityLabel={section.title}
      activeOpacity={0.7}
    >
      <View style={sellerShopProfileStyles.menuIconContainer}>
        <Ionicons name={section.icon} size={24} color={COLORS.light.primary} />
      </View>
      <View style={sellerShopProfileStyles.menuTextContainer}>
        <Text style={sellerShopProfileStyles.menuTitle}>{section.title}</Text>
        <Text style={sellerShopProfileStyles.menuSubtitle}>
          {section.subtitle}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={COLORS.light.oceanMedium}
      />
    </TouchableOpacity>
  );

  // Avatar component with conditional rendering
  const renderAvatar = () => {
    if (profile?.avatar_url) {
      return (
        <Image
          source={{ uri: profile.avatar_url }}
          style={sellerShopProfileStyles.profileImage}
          resizeMode="cover"
        />
      );
    } else {
      return (
        <View style={sellerShopProfileStyles.profileImagePlaceholder}>
          <MaterialCommunityIcons name="store" size={40} color="#fff" />
        </View>
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: COLORS.light.background }}
      >
        <View style={sellerShopProfileStyles.headerBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={sellerShopProfileStyles.headerBackBtn}
            accessibilityLabel="Back to dashboard"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={sellerShopProfileStyles.headerTitle}>Shop Profile</Text>
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.primary }}>
      <View style={sellerShopProfileStyles.container}>
        {/* Header with Back Button */}
        <View style={sellerShopProfileStyles.headerBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={sellerShopProfileStyles.headerBackBtn}
            accessibilityLabel="Back to dashboard"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={sellerShopProfileStyles.headerTitle}>Shop Profile</Text>
        </View>

        <ScrollView
          style={sellerShopProfileStyles.scrollView}
          contentContainerStyle={sellerShopProfileStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.light.primary]}
            />
          }
        >
          <View style={sellerShopProfileStyles.header}>
            <View style={sellerShopProfileStyles.profileSection}>
              <View style={sellerShopProfileStyles.imageContainer}>
                {renderAvatar()}
                <TouchableOpacity
                  style={sellerShopProfileStyles.editImageButton}
                  onPress={() => console.log("Edit shop logo")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="camera"
                    size={16}
                    color={COLORS.common.white}
                  />
                </TouchableOpacity>
              </View>
              <View style={sellerShopProfileStyles.userDetails}>
                <Text style={sellerShopProfileStyles.userName}>
                  {profile?.shop_name || "My Shop"}
                </Text>
                <Text style={sellerShopProfileStyles.userEmail}>
                  {profile?.email || "seller@example.com"}
                </Text>
                <View style={sellerShopProfileStyles.actionButtons}>
                  <TouchableOpacity
                    style={sellerShopProfileStyles.primaryButton}
                    onPress={() => router.push("/seller/edit-shop")}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="pencil"
                      size={12}
                      color={COLORS.common.white}
                    />
                    <Text style={sellerShopProfileStyles.primaryButtonText}>
                      Edit Shop
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Shop Sections */}
          <View style={sellerShopProfileStyles.sectionsContainer}>
            {/* Shop Management Section */}
            <View style={sellerShopProfileStyles.sectionContainer}>
              <View style={sellerShopProfileStyles.menuContainer}>
                {shopMenus.map(renderMenuItem)}
              </View>
            </View>

            {/* Support Section */}
            <View style={sellerShopProfileStyles.sectionContainer}>
              <View style={sellerShopProfileStyles.menuContainer}>
                {supportMenus.map(renderMenuItem)}
              </View>
            </View>

            {/* App Version */}
            <Text style={sellerShopProfileStyles.versionText}>
              Version 1.0.0
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SellerShopProfile;
