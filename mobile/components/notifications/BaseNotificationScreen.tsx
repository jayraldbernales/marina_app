// components/notifications/BaseNotificationScreen.tsx
import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import { notificationStyles } from "../styles/notificationStyles";
import { useNotificationContext } from "@/contexts/NotificationContext";
import type { Notification } from "@/services/notificationService";

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

const getNavigationRoute = (userType: string, notification: Notification) => {
  switch (userType) {
    case "buyer":
      switch (notification.type) {
        case "order":
        case "delivery":
        case "review":
        case "promo":
        case "vendor":
          return `/(tabs)/orders`;
        case "message":
          return `/buyer/conversation`;
        default:
          return null;
      }
    case "vendor":
      switch (notification.type) {
        case "order":
        case "payment":
        case "review":
          return `/(seller-tabs)/orders`;
        case "message":
          return `/seller/conversation`;
        default:
          return null;
      }
    case "rider":
      switch (notification.type) {
        case "delivery":
        case "payment":
        case "schedule":
          return `/(rider-tabs)/deliveries`;
        case "message":
          return `/rider/conversation`;
        default:
          return null;
      }
    default:
      return null;
  }
};

// ─── Memoized notification row ────────────────────────────────────────────────
interface NotificationItemProps {
  notif: Notification;
  userType: string;
  getIconInfo: (type: string) => IconConfig;
  processingId: string | null;
  onPress: (notif: Notification) => void;
}

const NotificationItem = React.memo(
  ({ notif, getIconInfo, processingId, onPress }: NotificationItemProps) => {
    const { icon, iconType, iconColor } = getIconInfo(notif.type);
    const isProcessing = processingId === notif.notification_id;

    return (
      <TouchableOpacity
        onPress={() => onPress(notif)}
        disabled={isProcessing}
        style={[
          notificationStyles.notificationCard,
          notif.is_read
            ? notificationStyles.notificationRead
            : notificationStyles.notificationUnread,
          isProcessing && { opacity: 0.7 },
        ]}
      >
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

        <View style={notificationStyles.content}>
          <Text style={notificationStyles.titleText}>{notif.title}</Text>
          <Text style={notificationStyles.messageText}>{notif.message}</Text>
          <Text style={notificationStyles.timeText}>
            {formatTime(notif.created_at)}
          </Text>
        </View>

        {!notif.is_read && <View style={notificationStyles.unreadIndicator} />}
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.notif.is_read === next.notif.is_read &&
    prev.notif.notification_id === next.notif.notification_id &&
    prev.processingId === next.processingId &&
    prev.notif.title === next.notif.title &&
    prev.notif.message === next.notif.message,
);

// ─── Main screen ──────────────────────────────────────────────────────────────
const BaseNotificationScreen: React.FC<BaseNotificationScreenProps> = ({
  userType,
  getIconInfo,
  filterTabs,
  emptyStateMessage,
}) => {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const hasRefreshedRef = useRef(false);

  const {
    notifications,
    markAsRead,
    markAllAsRead,
    loading,
    refreshNotifications,
  } = useNotificationContext();

  useFocusEffect(
    useCallback(() => {
      if (!hasRefreshedRef.current) {
        console.log(`📱 ${userType} notification screen focused - refreshing`);
        refreshNotifications();
        hasRefreshedRef.current = true;
      }
      return () => {
        hasRefreshedRef.current = false;
      };
    }, [userType, refreshNotifications]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const userTypeNotifications = React.useMemo(
    () => notifications.filter((n) => n.user_type === userType),
    [notifications, userType],
  );

  const filteredNotifications = React.useMemo(
    () =>
      filter === "all"
        ? userTypeNotifications
        : userTypeNotifications.filter((n) => n.type === filter),
    [userTypeNotifications, filter],
  );

  const unreadCountForType = React.useMemo(
    () => userTypeNotifications.filter((n) => !n.is_read).length,
    [userTypeNotifications],
  );

  // Single DB call instead of looping markAsRead
  const handleMarkAllAsRead = useCallback(async () => {
    if (unreadCountForType === 0) return;
    await markAllAsRead();
  }, [markAllAsRead, unreadCountForType]);

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      const notificationId = notification.notification_id;
      if (processingId === notificationId) return;

      setProcessingId(notificationId);
      try {
        await markAsRead(notificationId);
        const route = getNavigationRoute(userType, notification);
        if (route) router.push(route as any);
      } catch (error) {
        console.error("Error handling notification:", error);
      } finally {
        setProcessingId(null);
      }
    },
    [processingId, markAsRead, userType, router],
  );

  const keyExtractor = useCallback(
    (item: Notification) => item.notification_id,
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem
        notif={item}
        userType={userType}
        getIconInfo={getIconInfo}
        processingId={processingId}
        onPress={handleNotificationPress}
      />
    ),
    [userType, getIconInfo, processingId, handleNotificationPress],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.primary }}>
      <View style={notificationStyles.container}>
        {/* Header — untouched, stays outside FlatList */}
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

        {/* Notifications List — only this part changed from ScrollView to FlatList */}
        <FlatList
          data={filteredNotifications}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
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
          ListEmptyComponent={
            <View style={notificationStyles.emptyState}>
              {loading && !refreshing ? (
                <Text style={notificationStyles.emptyText}>
                  Loading notifications...
                </Text>
              ) : (
                <>
                  <Ionicons
                    name="notifications-off-outline"
                    size={64}
                    color="#ccc"
                  />
                  <Text style={notificationStyles.emptyText}>
                    {emptyStateMessage}
                  </Text>
                </>
              )}
            </View>
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={15}
        />
      </View>
    </SafeAreaView>
  );
};

export default BaseNotificationScreen;
