import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { COLORS } from "../constants";
import { profileStyles } from "../components/styles/profileStyles";

const ProfileTab = () => {
  const navigation = useNavigation();

  const profileSections = [
    {
      id: 1,
      title: "My Account Information",
      subtitle: "Edit My Account Details",
      icon: "person-outline" as const,
      onPress: () => console.log("Navigate to Account Info"),
    },
    {
      id: 2,
      title: "My Shop",
      subtitle: "Manage your store",
      icon: "storefront-outline" as const,
      onPress: () => console.log("Navigate to My Shop"),
    },
    {
      id: 3,
      title: "Delivery Center",
      subtitle: "Manage deliveries",
      icon: "bicycle-outline" as const,
      onPress: () => console.log("Navigate to Delivery Center"),
    },
    {
      id: 4,
      title: "Settings",
      subtitle: "Account preferences",
      icon: "settings-outline" as const,
      onPress: () => console.log("Navigate to Settings"),
    },
    {
      id: 5,
      title: "Support and Help",
      subtitle: "Get assistance",
      icon: "help-circle-outline" as const,
      onPress: () => console.log("Navigate to Support"),
    },
    {
      id: 6,
      title: "Log out",
      subtitle: "Sign out of your account",
      icon: "power" as const,
      onPress: () => console.log("Navigate to Support"),
    },
  ];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.primary }}>
      <View style={profileStyles.container}>
        {/* Header */}
        <View style={profileStyles.header}>
          {/* User Profile Row */}
          <View style={profileStyles.userInfoRow}>
            <Image
              source={{ uri: "https://i.pravatar.cc/600" }}
              style={profileStyles.profileImage}
            />

            <View style={{ marginLeft: 14 }}>
              <Text style={profileStyles.userName}>Juan Dela Cruz</Text>
              <Text style={profileStyles.userEmail}>
                juan.delacruz@email.com
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={profileStyles.scrollArea}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Menu Sections */}
          <View style={profileStyles.menuContainer}>
            {profileSections.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={profileStyles.menuItem}
                onPress={section.onPress}
                accessibilityLabel={section.title}
              >
                <View style={profileStyles.menuIconContainer}>
                  <Ionicons
                    name={section.icon}
                    size={24}
                    color={COLORS.light.primary}
                  />
                </View>
                <View style={profileStyles.menuTextContainer}>
                  <Text style={profileStyles.menuTitle}>{section.title}</Text>
                  <Text style={profileStyles.menuSubtitle}>
                    {section.subtitle}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.light.oceanMedium}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* App Version */}
          <Text style={profileStyles.versionText}>Version 1.0.0</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ProfileTab;
