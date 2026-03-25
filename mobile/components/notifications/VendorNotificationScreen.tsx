// components/notifications/VendorNotificationScreen.tsx
import React from "react";
import { COLORS } from "@/constants";
import BaseNotificationScreen from "./BaseNotificationScreen";

const getVendorIconInfo = (type: string) => {
  switch (type) {
    case "order":
      return {
        icon: "cart",
        iconType: "ionicons" as const,
        iconColor: COLORS.light.oceanMedium,
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

const vendorFilterTabs = [
  { key: "all", label: "All" },
  { key: "order", label: "Orders" },
  { key: "payment", label: "Payments" },
  { key: "message", label: "Messages" },
  { key: "review", label: "Reviews" },
];

const VendorNotificationScreen = () => {
  return (
    <BaseNotificationScreen
      userType="vendor"
      getIconInfo={getVendorIconInfo}
      filterTabs={vendorFilterTabs}
      emptyStateMessage="No vendor notifications yet"
    />
  );
};

export default VendorNotificationScreen;
