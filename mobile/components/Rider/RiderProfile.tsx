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
import { riderProfileStyles } from "./styles/riderProfileStyles";

const RiderProfile = () => {
  const navigation = useNavigation();

  /** Rider–related menu items */
  const riderMenus = [
    {
      id: 1,
      title: "Edit Profile",
      subtitle: "Update your rider information",
      icon: "person-circle-outline" as const,
      onPress: () => console.log("Navigate to Edit Profile"),
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
      onPress: () => console.log("Navigate to Reviews"),
    },
    {
      id: 4,
      title: "Availability",
      subtitle: "Set your active delivery status",
      icon: "checkmark-circle-outline" as const,
      onPress: () => console.log("Navigate to Availability Settings"),
    },
  ];

  /** Support section */
  const supportMenus = [
    {
      id: 5,
      title: "Support",
      subtitle: "Get rider assistance",
      icon: "help-circle-outline" as const,
      onPress: () => console.log("Navigate to Support"),
    },
    {
      id: 6,
      title: "About",
      subtitle: "Learn more about this platform",
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.primary }}>
      <View style={riderProfileStyles.container}>
        {/* Header */}
        <View style={riderProfileStyles.headerBar}>
          <TouchableOpacity
            onPress={() => router.push("/(rider-tabs)")}
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
                <Image
                  source={{ uri: "https://i.pravatar.cc/150?img=12" }}
                  style={riderProfileStyles.profileImage}
                />

                <TouchableOpacity
                  style={riderProfileStyles.editImageButton}
                  onPress={() => console.log("Edit Rider Photo")}
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
                  Rider Juan Dela Cruz
                </Text>
                <Text style={riderProfileStyles.userEmail}>
                  Active Delivery Partner
                </Text>

                <View style={riderProfileStyles.actionButtons}>
                  <TouchableOpacity
                    style={riderProfileStyles.primaryButton}
                    onPress={() => console.log("Edit Profile")}
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
