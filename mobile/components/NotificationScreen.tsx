import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import { notificationStyles } from "../components/styles/notificationStyles";

type NotificationType = "order" | "promo" | "vendor" | "review";

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
    title: "Order Delivered",
    message: "Your order of Bangus (2kg) has been delivered",
    time: "5 min ago",
    read: false,
  },
  {
    id: 2,
    type: "promo",
    title: "Early Bird Special Active",
    message: "Get 20% off on all orders before 10 AM today!",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    type: "order",
    title: "Order Out for Delivery",
    message: "Your Mayamaya order is on its way",
    time: "2 hours ago",
    read: true,
  },
  {
    id: 4,
    type: "vendor",
    title: "New Catch Alert",
    message: "Maria's Catch just added fresh Lapu-Lapu to their inventory",
    time: "3 hours ago",
    read: true,
  },
  {
    id: 5,
    type: "order",
    title: "Order Confirmed",
    message: "Your order #12345 has been confirmed by Ocean Harvest",
    time: "5 hours ago",
    read: true,
  },
  {
    id: 6,
    type: "promo",
    title: "Free Delivery Available",
    message: "Your cart qualifies for free delivery. Order now!",
    time: "1 day ago",
    read: true,
  },
  {
    id: 7,
    type: "review",
    title: "Rate Your Recent Order",
    message: "How was your experience with Deep Sea Catch?",
    time: "2 days ago",
    read: true,
  },
];

const getIconInfo = (type: NotificationType) => {
  switch (type) {
    case "order":
      return {
        icon: "receipt",
        iconType: "ionicons" as const,
        iconColor: COLORS.light.oceanMedium,
      };
    case "promo":
      return {
        icon: "pricetag",
        iconType: "ionicons" as const,
        iconColor: COLORS.light.coral,
      };
    case "vendor":
      return {
        icon: "fish",
        iconType: "material" as const,
        iconColor: COLORS.light.primary,
      };
    case "review":
      return {
        icon: "star",
        iconType: "ionicons" as const,
        iconColor: COLORS.common.yellow,
      };
    default:
      return {
        icon: "notifications-outline",
        iconType: "ionicons" as const,
        iconColor: COLORS.light.primary,
      };
  }
};

const NotificationScreen = () => {
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
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
  };

  const handleMarkAllRead = () => {
    setNotificationList((prev) =>
      prev.map((notif) => ({ ...notif, read: true })),
    );
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
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity
                onPress={handleMarkAllRead}
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
            {[
              { key: "all" as const, label: "All" },
              { key: "order" as const, label: "Orders" },
              { key: "promo" as const, label: "Promos" },
              { key: "vendor" as const, label: "Vendors" },
              { key: "review" as const, label: "Reviews" },
            ].map((tab) => (
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
        >
          {filteredNotifications.length === 0 ? (
            <View style={notificationStyles.emptyState}>
              <Ionicons
                name="notifications-off-outline"
                size={64}
                color="#ccc"
              />
              <Text style={notificationStyles.emptyText}>
                No notifications yet
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notif) => {
              const { icon, iconType, iconColor } = getIconInfo(notif.type);
              return (
                <TouchableOpacity
                  key={notif.id}
                  onPress={() => handleNotificationPress(notif.id)}
                  style={[
                    notificationStyles.notificationCard,
                    notif.read
                      ? notificationStyles.notificationRead
                      : notificationStyles.notificationUnread,
                  ]}
                >
                  {/* Icon */}
                  <View
                    style={[
                      notificationStyles.iconContainer,
                      { backgroundColor: `${iconColor}` },
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
                      {notif.time}
                    </Text>
                  </View>
                  {/* Unread Indicator */}
                  {!notif.read && (
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

export default NotificationScreen;
