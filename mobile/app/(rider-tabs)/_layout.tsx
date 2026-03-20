import { Tabs } from "expo-router";
import React from "react";
import { Platform, View, Text } from "react-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { COLORS } from "@/constants/colors";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { useRiderDeliveryContext } from "@/contexts/RiderDeliveryContext";
import CustomTabIcon from "@/components/CustomTabIcon";

export default function TabLayout() {
  const { riderUnreadCount, messageUnreadCount } = useNotificationContext();
  const { pendingDeliveryCount } = useRiderDeliveryContext();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.light.primary,
        tabBarInactiveTintColor: COLORS.light.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: { position: "absolute" },
          default: {},
        }),
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, size, color }) => (
            <MaterialCommunityIcons
              name={focused ? "home" : "home-outline"}
              size={size ?? 28}
              color={color}
            />
          ),
        }}
      />

      {/* CHAT - with unread badge */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ focused, size, color }) => (
            <CustomTabIcon
              focused={focused}
              size={size}
              color={color}
              iconName="chatbox-ellipses"
              iconLibrary="ionicons"
              badgeCount={messageUnreadCount} // ADD THIS
            />
          ),
        }}
      />

      <Tabs.Screen
        name="deliveries"
        options={{
          title: "Deliveries",
          tabBarIcon: ({ focused, size, color }) => (
            <View
              style={{
                width: 32,
                height: 32,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name={focused ? "truck-delivery" : "truck-delivery-outline"}
                size={size ?? 28}
                color={color}
              />
              {pendingDeliveryCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -6,
                    backgroundColor: "red",
                    borderRadius: 10,
                    minWidth: 16,
                    height: 16,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 10, fontWeight: "bold" }}
                  >
                    {pendingDeliveryCount > 99 ? "99+" : pendingDeliveryCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      {/* NOTIFICATIONS - keeping your original implementation */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ focused, size, color }) => (
            <View
              style={{
                width: 32,
                height: 32,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialIcons
                name={focused ? "notifications" : "notifications-none"}
                size={size ?? 28}
                color={color}
              />
              {riderUnreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -6,
                    backgroundColor: "red",
                    borderRadius: 10,
                    minWidth: 16,
                    height: 16,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 10, fontWeight: "bold" }}
                  >
                    {riderUnreadCount > 99 ? "99+" : riderUnreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="rider"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, size, color }) => (
            <MaterialIcons
              name={focused ? "person" : "person-outline"}
              size={size ?? 28}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
