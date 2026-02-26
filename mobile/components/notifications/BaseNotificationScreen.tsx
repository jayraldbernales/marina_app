// components/notifications/BaseNotificationScreen.tsx
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router"; // ADD THIS
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import { notificationStyles } from "../styles/notificationStyles";
import { useNotificationContext } from "@/contexts/NotificationContext";

export type TabConfig = {
  key: string;
  label: string;
};

export type IconConfig = {
  icon: string;
  iconType: "ionicons" | "material";
  iconColor: string;
};

interface BaseNotificationScreenProps {
  userType: "buyer" | "vendor" | "rider";
  getIconInfo: (type: string) => IconConfig;
  filterTabs: TabConfig[];
  emptyStateMessage: string;
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
};

// Navigation helper function based on user type
const getNavigationRoute = (userType: string, notification: any) => {
  const metadata = notification.metadata || {};

  switch (userType) {
    case "buyer":
      switch (notification.type) {
        case "order":
          return `/(tabs)/orders`;
        case "delivery":
          return `/(tabs)/orders`;
        case "message":
          return `/buyer/conversation`;
        case "review":
          return `/(tabs)/orders`;
        case "promo":
          return `/(tabs)/orders`;
        case "vendor":
          return `/(tabs)/orders`;
        default:
          return null;
      }

    case "vendor":
      switch (notification.type) {
        case "order":
          return `/(seller-tabs)/orders`;
        case "payment":
          return `/(seller-tabs)/orders`;
        case "message":
          return `/seller/conversation`;
        case "review":
          return `/(seller-tabs)/orders`;
        default:
          return null;
      }

    case "rider":
      switch (notification.type) {
        case "delivery":
          return `/(rider-tabs)/deliveries`;
        case "payment":
          return `/(rider-tabs)/deliveries`;
        case "message":
          return `/rider/conversation`;
        case "schedule":
          return `/(rider-tabs)/deliveries`;
        default:
          return null;
      }

    default:
      return null;
  }
};

const BaseNotificationScreen: React.FC<BaseNotificationScreenProps> = ({
  userType,
  getIconInfo,
  filterTabs,
  emptyStateMessage,
}) => {
  const router = useRouter(); // ADD THIS
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null); // ADD THIS

  // Use a ref to track if we've already refreshed during this focus session
  const hasRefreshedRef = useRef(false);

  const { notifications, markAsRead, loading, refreshNotifications } =
    useNotificationContext();

  // Refresh notifications when screen comes into focus - but only once
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we haven't refreshed yet for this focus session
      if (!hasRefreshedRef.current) {
        console.log(`📱 ${userType} notification screen focused - refreshing`);
        refreshNotifications();
        hasRefreshedRef.current = true;
      }

      // Reset the ref when screen loses focus
      return () => {
        hasRefreshedRef.current = false;
      };
    }, [userType, refreshNotifications]), // Dependencies are stable now
  );

  // Pull to refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  // Filter notifications by user type
  const userTypeNotifications = notifications.filter(
    (n) => n.user_type === userType,
  );

  const filteredNotifications =
    filter === "all"
      ? userTypeNotifications
      : userTypeNotifications.filter((n) => n.type === filter);

  // Calculate unread count for this user type
  const unreadCountForType = userTypeNotifications.filter(
    (n) => !n.is_read,
  ).length;

  const handleMarkAllAsRead = async () => {
    const unreadIds = userTypeNotifications
      .filter((n) => !n.is_read)
      .map((n) => n.notification_id);

    for (const id of unreadIds) {
      await markAsRead(id);
    }
  };

  const handleNotificationPress = async (notification: any) => {
    const notificationId = notification.notification_id;

    // Prevent double-pressing
    if (processingId === notificationId) return;

    setProcessingId(notificationId);

    try {
      // First mark as read
      await markAsRead(notificationId);

      // Get navigation route
      const route = getNavigationRoute(userType, notification);

      // Navigate if route exists
      if (route) {
        router.push(route as any); // Simple fix with type assertion
      }
    } catch (error) {
      console.error("Error handling notification:", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.primary }}>
      <View style={notificationStyles.container}>
        {/* Header */}
        <View style={notificationStyles.header}>
          <View style={notificationStyles.headerTop}>
            <View>
              <Text style={notificationStyles.headerTitle}>Notifications</Text>
              <Text style={notificationStyles.headerSubtitle}>
                {unreadCountForType} unread notification
                {unreadCountForType !== 1 ? "s" : ""}
              </Text>
            </View>
            {unreadCountForType > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllAsRead}
                style={notificationStyles.markAllReadButton}
              >
                <Text style={notificationStyles.markAllReadText}>
                  Mark all read
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={notificationStyles.filterTabsContent}
          >
            {filterTabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={[
                  notificationStyles.filterTab,
                  filter === tab.key
                    ? notificationStyles.filterTabSelected
                    : notificationStyles.filterTabUnselected,
                ]}
              >
                <Text
                  style={[
                    notificationStyles.filterTabText,
                    filter === tab.key
                      ? notificationStyles.filterTabTextSelected
                      : notificationStyles.filterTabTextUnselected,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Notifications List */}
        <ScrollView
          style={notificationStyles.scrollView}
          contentContainerStyle={notificationStyles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.light.primary]}
              tintColor={COLORS.light.primary}
            />
          }
        >
          {loading && !refreshing ? (
            <View style={notificationStyles.emptyState}>
              <Text style={notificationStyles.emptyText}>
                Loading notifications...
              </Text>
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View style={notificationStyles.emptyState}>
              <Ionicons
                name="notifications-off-outline"
                size={64}
                color="#ccc"
              />
              <Text style={notificationStyles.emptyText}>
                {emptyStateMessage}
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notif) => {
              const { icon, iconType, iconColor } = getIconInfo(notif.type);
              const isProcessing = processingId === notif.notification_id;

              return (
                <TouchableOpacity
                  key={notif.notification_id}
                  onPress={() => handleNotificationPress(notif)}
                  disabled={isProcessing}
                  style={[
                    notificationStyles.notificationCard,
                    notif.is_read
                      ? notificationStyles.notificationRead
                      : notificationStyles.notificationUnread,
                    isProcessing && { opacity: 0.7 },
                  ]}
                >
                  {/* Icon */}
                  <View
                    style={[
                      notificationStyles.iconContainer,
                      { backgroundColor: iconColor },
                    ]}
                  >
                    {iconType === "material" ? (
                      <MaterialCommunityIcons
                        name={icon as any}
                        size={24}
                        color="white"
                      />
                    ) : (
                      <Ionicons name={icon as any} size={24} color="white" />
                    )}
                  </View>

                  {/* Content */}
                  <View style={notificationStyles.content}>
                    <Text style={notificationStyles.titleText}>
                      {notif.title}
                    </Text>
                    <Text style={notificationStyles.messageText}>
                      {notif.message}
                    </Text>
                    <Text style={notificationStyles.timeText}>
                      {formatTime(notif.created_at)}
                    </Text>
                  </View>

                  {/* Unread Indicator */}
                  {!notif.is_read && (
                    <View style={notificationStyles.unreadIndicator} />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default BaseNotificationScreen;
