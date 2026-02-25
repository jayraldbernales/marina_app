import { Tabs } from "expo-router";
import React from "react";
import { Platform, View, Text } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { COLORS } from "@/constants/colors";
import { useNotificationContext } from "@/contexts/NotificationContext";

export default function TabLayout() {
  const { vendorUnreadCount } = useNotificationContext();

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

      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ focused, size, color }) => (
            <MaterialIcons
              name={focused ? "access-time-filled" : "access-time"}
              size={size ?? 28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ focused, size, color }) => (
            <MaterialCommunityIcons
              name={focused ? "plus-circle" : "plus-circle-outline"}
              size={size ?? 28}
              color={color}
            />
          ),
        }}
      />

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
              {vendorUnreadCount > 0 && (
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
                    {vendorUnreadCount > 99 ? "99+" : vendorUnreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ focused, size, color }) => (
            <MaterialCommunityIcons
              name={focused ? "storefront" : "storefront-outline"}
              size={size ?? 28}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
