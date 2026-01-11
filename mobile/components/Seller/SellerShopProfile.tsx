import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { COLORS } from "../../constants";
import { sellerShopProfileStyles } from "./styles/sellerShopProfileStyles";

const SellerShopProfile = () => {
  const navigation = useNavigation();

  const shopMenus = [
    {
      id: 1,
      title: "Edit Shop Details",
      subtitle: "Update store information",
      icon: "pencil-outline" as const,
      onPress: () => console.log("Navigate to Edit Shop Details"),
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
      onPress: () => console.log("Navigate to Reviews"),
    },
  ];

  const supportMenus = [
    {
      id: 5,
      title: "Support",
      subtitle: "Get help for your shop",
      icon: "help-circle-outline" as const,
      onPress: () => console.log("Navigate to Support"),
    },
    {
      id: 6,
      title: "About",
      subtitle: "Learn more about our platform",
      icon: "information-circle-outline" as const,
      onPress: () => console.log("Navigate to About"),
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.primary }}>
      <View style={sellerShopProfileStyles.container}>
        {/* Header with Back Button */}
        <View style={sellerShopProfileStyles.headerBar}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)")}
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
        >
          <View style={sellerShopProfileStyles.header}>
            <View style={sellerShopProfileStyles.profileSection}>
              <View style={sellerShopProfileStyles.imageContainer}>
                <Image
                  source={{ uri: "https://i.pravatar.cc/1800" }}
                  style={sellerShopProfileStyles.profileImage}
                />
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
                  FreshCatch Seafood
                </Text>
                <Text style={sellerShopProfileStyles.userEmail}>
                  Premium fresh seafood.
                </Text>
                <View style={sellerShopProfileStyles.actionButtons}>
                  <TouchableOpacity
                    style={sellerShopProfileStyles.primaryButton}
                    onPress={() => console.log("Edit Shop Profile")}
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
