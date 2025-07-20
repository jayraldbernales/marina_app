import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../../constants";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthCard = ({ title, subtitle, children }: AuthCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.light.card,
    borderRadius: 8,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowColor: COLORS.common.black,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    padding: 24,
    paddingBottom: 16,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.light.oceanPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    fontWeight: "500",
  },
  cardContent: {
    padding: 24,
    paddingTop: 0,
  },
});
