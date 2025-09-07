import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants";

interface ScreenHeaderProps {
  title: string;
  onBackPress: () => void;
}

export const ScreenHeader = ({ title, onBackPress }: ScreenHeaderProps) => {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBackPress}
        style={({ pressed }) => [
          styles.backButton,
          pressed && { opacity: 0.6 },
        ]}
      >
        <Ionicons
          name="arrow-back"
          size={24}
          color={COLORS.light.oceanPrimary}
        />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 24,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.light.oceanPrimary,
  },
});
