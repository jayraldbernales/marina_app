import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../../constants";
import { SellerNotificationStyles } from "./styles/sellerNotificationStyles";

type NotificationType = "order" | "payment" | "message" | "schedule";

type IconName =
  | "cart-outline"
  | "cash"
  | "chatbubble-outline"
  | "calendar-outline"
  | "notifications-outline";

interface IconInfo {
  icon: IconName;
  iconColor: string;
}

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const notifications: Notification[] = [
  {
    id: 1,
    type: "order",
    title: "New Order Received",
    message: "Order ORD-001 from John Doe for 5 items, prepare for fulfillment",
    time: "5 min ago",
    read: false,
  },
  {
    id: 2,
    type: "payment",
    title: "Payment Received",
    message: "₱650 earned from completed order ORD-002",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    type: "order",
    title: "Order Fulfilled",
    message: "ORD-003 marked as shipped successfully",
    time: "2 hours ago",
    read: true,
  },
  {
    id: 4,
    type: "message",
    title: "New Message from Customer",
    message: "Jane Smith: Do you have this item in blue?",
    time: "3 hours ago",
    read: true,
  },
  {
    id: 5,
    type: "schedule",
    title: "Restock Reminder",
    message: "Low stock alert: Restock popular items before evening rush",
    time: "5 hours ago",
    read: true,
  },
  {
    id: 6,
    type: "payment",
    title: "Weekly Payout Ready",
    message: "Your earnings of ₱5,200 are available for withdrawal",
    time: "1 day ago",
    read: true,
  },
  {
    id: 7,
    type: "order",
    title: "Inventory Optimization Update",
    message: "New efficient stocking suggestions for high-demand products",
    time: "2 days ago",
    read: true,
  },
];

const getIconInfo = (type: NotificationType): IconInfo => {
  switch (type) {
    case "order":
      return {
        icon: "cart-outline",
        iconColor: COLORS.light.primary,
      };
    case "payment":
      return {
        icon: "cash",
        iconColor: "#10b981",
      };
    case "message":
      return {
        icon: "chatbubble-outline",
        iconColor: COLORS.light.oceanMedium,
      };
    case "schedule":
      return {
        icon: "calendar-outline",
        iconColor: "#f59e0b",
      };
    default:
      return {
        icon: "notifications-outline",
        iconColor: COLORS.light.primary,
      };
  }
};

const SellerNotification = () => {
  const [filter, setFilter] = useState<"all" | NotificationType>("all");
  const [notificationList, setNotificationList] =
    useState<Notification[]>(notifications);
  const unreadCount = notificationList.filter((n) => !n.read).length;
  const filteredNotifications =
    filter === "all"
      ? notificationList
      : notificationList.filter((n) => n.type === filter);

  const handleNotificationPress = (id: number) => {
    setNotificationList((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const handleMarkAllRead = () => {
    setNotificationList((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.background }}>
      <View style={SellerNotificationStyles.headerBar}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          style={SellerNotificationStyles.headerBackBtn}
          accessibilityLabel="Back to dashboard"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={SellerNotificationStyles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={SellerNotificationStyles.markAllReadButton}
          >
            <Text style={SellerNotificationStyles.markAllReadText}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={SellerNotificationStyles.tabsContainer}
        contentContainerStyle={SellerNotificationStyles.tabsContent}
      >
        {[
          { key: "all" as const, label: "All" },
          { key: "order" as const, label: "Orders" },
          { key: "payment" as const, label: "Payments" },
          { key: "message" as const, label: "Messages" },
          { key: "schedule" as const, label: "Schedule" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              SellerNotificationStyles.tab,
              filter === tab.key && SellerNotificationStyles.activeTab,
            ]}
            onPress={() => setFilter(tab.key)}
          >
            <Text
              style={[
                SellerNotificationStyles.tabText,
                filter === tab.key && SellerNotificationStyles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Notifications List */}
      <ScrollView
        style={SellerNotificationStyles.scrollView}
        contentContainerStyle={SellerNotificationStyles.scrollContent}
      >
        {filteredNotifications.length === 0 ? (
          <View style={SellerNotificationStyles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={COLORS.light.oceanMedium}
            />
            <Text style={SellerNotificationStyles.emptyText}>
              No notifications yet
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notif) => {
            const { icon, iconColor } = getIconInfo(notif.type);
            return (
              <TouchableOpacity
                key={notif.id}
                onPress={() => handleNotificationPress(notif.id)}
                style={[
                  SellerNotificationStyles.notificationCard,
                  notif.read
                    ? SellerNotificationStyles.notificationRead
                    : SellerNotificationStyles.notificationUnread,
                ]}
              >
                {/* Icon */}
                <View
                  style={[
                    SellerNotificationStyles.iconContainer,
                    { backgroundColor: `${iconColor}` }, // Slightly transparent for better UX
                  ]}
                >
                  <Ionicons name={icon} size={24} color="#fff" />
                </View>
                {/* Content */}
                <View style={SellerNotificationStyles.content}>
                  <Text style={SellerNotificationStyles.titleText}>
                    {notif.title}
                  </Text>
                  <Text style={SellerNotificationStyles.messageText}>
                    {notif.message}
                  </Text>
                  <Text style={SellerNotificationStyles.timeText}>
                    {notif.time}
                  </Text>
                </View>
                {/* Unread Indicator */}
                {!notif.read && (
                  <View style={SellerNotificationStyles.unreadIndicator} />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SellerNotification;
