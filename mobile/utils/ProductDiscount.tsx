import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants";

interface ProductDiscountProps {
  price: number;
  discountPercent?: number;
  showBadge?: boolean;
  textSize?: "small" | "medium" | "large";
  badgeSize?: "small" | "medium";
  style?: any;
}

export const ProductDiscount: React.FC<ProductDiscountProps> = ({
  price,
  discountPercent = 0,
  showBadge = true,
  textSize = "medium",
  badgeSize = "small",
  style,
}) => {
  // Define helper functions first
  const getTextSizeStyle = (size: string) => {
    switch (size) {
      case "small":
        return { fontSize: 12 };
      case "medium":
        return { fontSize: 16 };
      case "large":
        return { fontSize: 20 };
      default:
        return { fontSize: 16 };
    }
  };

  const getBadgeSizeStyle = (size: string) => {
    switch (size) {
      case "small":
        return { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 };
      case "medium":
        return { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 };
      default:
        return { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 };
    }
  };

  const getBadgeTextSizeStyle = (size: string) => {
    switch (size) {
      case "small":
        return { fontSize: 10 };
      case "medium":
        return { fontSize: 12 };
      default:
        return { fontSize: 10 };
    }
  };

  if (!discountPercent || discountPercent <= 0) {
    return (
      <View style={[styles.priceContainer, style]}>
        <Text style={[styles.regularPrice, getTextSizeStyle(textSize)]}>
          ₱
          {price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </View>
    );
  }

  const discountedPrice = price * (1 - discountPercent / 100);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.priceRow}>
        {/* Original price with strikethrough */}
        <Text style={[styles.originalPrice, getTextSizeStyle(textSize)]}>
          ₱
          {price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>

        {/* Discounted price */}
        <Text style={[styles.discountedPrice, getTextSizeStyle(textSize)]}>
          ₱{discountedPrice.toFixed(2)}
        </Text>

        {/* Discount badge */}
        {showBadge && (
          <View style={[styles.inlineBadge, getBadgeSizeStyle(badgeSize)]}>
            <Text
              style={[
                styles.discountBadgeText,
                getBadgeTextSizeStyle(badgeSize),
              ]}
            >
              -{discountPercent}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Helper function to calculate discounted price (can be imported separately)
export const calculateDiscountedPrice = (
  price: number,
  discountPercent: number,
): number => {
  if (!discountPercent || discountPercent <= 0) return price;
  return price * (1 - discountPercent / 100);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  regularPrice: {
    color: COLORS.light.coral,
    fontWeight: "600",
  },
  originalPrice: {
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  discountedPrice: {
    color: COLORS.light.coral,
    fontWeight: "700",
  },
  inlineBadge: {
    backgroundColor: "#dc2626",
    alignSelf: "center",
  },
  discountBadgeText: {
    color: "#fff",
    fontWeight: "700",
  },
});
