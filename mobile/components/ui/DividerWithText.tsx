import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants";

interface DividerWithTextProps {
  text: string;
}

export const DividerWithText = ({ text }: DividerWithTextProps) => {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{text}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${COLORS.light.oceanLight}4D`,
  },
  dividerText: {
    marginHorizontal: 10,
    color: COLORS.light.oceanPrimary,
    fontSize: 14,
  },
});
