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
import { RiderNotificationStyles } from "./styles/riderNotificationStyles";

type NotificationType = "delivery" | "payment" | "message" | "schedule";

type IconName =
  | "bicycle"
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
    type: "delivery",
    title: "New Delivery Assigned",
    message: "Pickup DEL-001 from Maria's Catch at 2:00 PM",
    time: "5 min ago",
    read: false,
  },
  {
    id: 2,
    type: "payment",
    title: "Payment Received",
    message: "₱650 earned from completed delivery DEL-002",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    type: "delivery",
    title: "Delivery Completed",
    message: "DEL-003 marked as delivered successfully",
    time: "2 hours ago",
    read: true,
  },
  {
    id: 4,
    type: "message",
    title: "New Message from Customer",
    message: "Jane Smith: When will my order arrive?",
    time: "3 hours ago",
    read: true,
  },
  {
    id: 5,
    type: "schedule",
    title: "Shift Reminder",
    message: "Your afternoon shift starts in 30 minutes",
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
    type: "delivery",
    title: "Route Optimization Update",
    message: "New efficient route suggested for today's deliveries",
    time: "2 days ago",
    read: true,
  },
];

const getIconInfo = (type: NotificationType): IconInfo => {
  switch (type) {
    case "delivery":
      return {
        icon: "bicycle",
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

const RiderNotification = () => {
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
      <View style={RiderNotificationStyles.headerBar}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          style={RiderNotificationStyles.headerBackBtn}
          accessibilityLabel="Back to dashboard"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={RiderNotificationStyles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={RiderNotificationStyles.markAllReadButton}
          >
            <Text style={RiderNotificationStyles.markAllReadText}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={RiderNotificationStyles.tabsContainer}
        contentContainerStyle={RiderNotificationStyles.tabsContent}
      >
        {[
          { key: "all" as const, label: "All" },
          { key: "delivery" as const, label: "Deliveries" },
          { key: "payment" as const, label: "Payments" },
          { key: "message" as const, label: "Messages" },
          { key: "schedule" as const, label: "Schedule" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              RiderNotificationStyles.tab,
              filter === tab.key && RiderNotificationStyles.activeTab,
            ]}
            onPress={() => setFilter(tab.key)}
          >
            <Text
              style={[
                RiderNotificationStyles.tabText,
                filter === tab.key && RiderNotificationStyles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notifications List */}
      <ScrollView
        style={RiderNotificationStyles.scrollView}
        contentContainerStyle={RiderNotificationStyles.scrollContent}
      >
        {filteredNotifications.length === 0 ? (
          <View style={RiderNotificationStyles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={COLORS.light.oceanMedium}
            />
            <Text style={RiderNotificationStyles.emptyText}>
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
                  RiderNotificationStyles.notificationCard,
                  notif.read
                    ? RiderNotificationStyles.notificationRead
                    : RiderNotificationStyles.notificationUnread,
                ]}
              >
                {/* Icon */}
                <View
                  style={[
                    RiderNotificationStyles.iconContainer,
                    { backgroundColor: `${iconColor}` },
                  ]}
                >
                  <Ionicons name={icon} size={24} color="#fff" />
                </View>
                {/* Content */}
                <View style={RiderNotificationStyles.content}>
                  <Text style={RiderNotificationStyles.titleText}>
                    {notif.title}
                  </Text>
                  <Text style={RiderNotificationStyles.messageText}>
                    {notif.message}
                  </Text>
                  <Text style={RiderNotificationStyles.timeText}>
                    {notif.time}
                  </Text>
                </View>
                {/* Unread Indicator */}
                {!notif.read && (
                  <View style={RiderNotificationStyles.unreadIndicator} />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default RiderNotification;
