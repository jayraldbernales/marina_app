// components/notifications/BuyerNotificationScreen.tsx
import React from "react";
import { COLORS } from "@/constants";
import BaseNotificationScreen from "./BaseNotificationScreen";

const getBuyerIconInfo = (type: string) => {
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
    case "delivery":
      return {
        icon: "bicycle",
        iconType: "ionicons" as const,
        iconColor: "#10b981",
      };
    case "message":
      return {
        icon: "chatbubble",
        iconType: "ionicons" as const,
        iconColor: COLORS.light.oceanMedium,
      };
    default:
      return {
        icon: "notifications-outline",
        iconType: "ionicons" as const,
        iconColor: COLORS.light.primary,
      };
  }
};

const buyerFilterTabs = [
  { key: "all", label: "All" },
  { key: "order", label: "Orders" },
  { key: "delivery", label: "Delivery" },
  { key: "promo", label: "Promos" },
  { key: "message", label: "Messages" },
  { key: "review", label: "Reviews" },
];

const BuyerNotificationScreen = () => {
  return (
    <BaseNotificationScreen
      userType="buyer"
      getIconInfo={getBuyerIconInfo}
      filterTabs={buyerFilterTabs}
      emptyStateMessage="No buyer notifications yet"
    />
  );
};

export default BuyerNotificationScreen;
