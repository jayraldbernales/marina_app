import React from "react";
import { Pressable, Text, StyleSheet, Animated } from "react-native";
import { COLORS } from "../../../constants";

interface FacebookButtonProps {
  title: string;
  onPress: () => void;
  buttonScale?: Animated.Value;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export const FacebookButton = ({
  title,
  onPress,
  buttonScale = new Animated.Value(1),
  onPressIn,
  onPressOut,
}: FacebookButtonProps) => {
  return (
    <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.common.facebook,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: COLORS.common.facebook,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonPressed: {
    backgroundColor: COLORS.common.facebook,
  },
  buttonText: {
    color: COLORS.light.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
  },
});
