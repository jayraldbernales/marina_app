// components/notifications/RiderNotificationScreen.tsx
import React from "react";
import { COLORS } from "@/constants";
import BaseNotificationScreen from "./BaseNotificationScreen";

const getRiderIconInfo = (type: string) => {
  switch (type) {
    case "delivery":
      return {
        icon: "bicycle",
        iconType: "ionicons" as const,
        iconColor: COLORS.light.primary,
      };
    case "payment":
      return {
        icon: "cash",
        iconType: "ionicons" as const,
        iconColor: "#10b981",
      };
    case "message":
      return {
        icon: "chatbubble",
        iconType: "ionicons" as const,
        iconColor: COLORS.light.oceanMedium,
      };
    case "schedule":
      return {
        icon: "calendar",
        iconType: "ionicons" as const,
        iconColor: "#f59e0b",
      };
    default:
      return {
        icon: "notifications-outline",
        iconType: "ionicons" as const,
        iconColor: COLORS.light.primary,
      };
  }
};

const riderFilterTabs = [
  { key: "all", label: "All" },
  { key: "delivery", label: "Deliveries" },
  { key: "payment", label: "Payments" },
  { key: "message", label: "Messages" },
  { key: "schedule", label: "Schedule" },
];

const RiderNotificationScreen = () => {
  return (
    <BaseNotificationScreen
      userType="rider"
      getIconInfo={getRiderIconInfo}
      filterTabs={riderFilterTabs}
      emptyStateMessage="No rider notifications yet"
    />
  );
};

export default RiderNotificationScreen;
