import React, { useState } from "react";
import { Pressable, Text, StyleSheet, Animated } from "react-native";
import { COLORS } from "../../../constants";

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  buttonScale?: Animated.Value;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
}

export const SecondaryButton = ({
  title,
  onPress,
  buttonScale = new Animated.Value(1),
  onPressIn,
  onPressOut,
  onLongPress,
}: SecondaryButtonProps) => {
  const [longPressed, setLongPressed] = useState(false);
  const [pressed, setPressed] = useState(false);

  const handlePressIn = () => {
    setPressed(true);
    onPressIn?.();
    setLongPressed(false);
  };

  const handlePressOut = () => {
    setPressed(false);
    onPressOut?.();
    setLongPressed(false);
  };

  const handleLongPress = () => {
    setLongPressed(true);
    onLongPress?.();
    setTimeout(() => setLongPressed(false), 500);
  };

  return (
    <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
      <Pressable
        style={[
          styles.button,
          pressed && styles.buttonPressed,
          longPressed && styles.buttonLongPressed,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        onLongPress={handleLongPress}
      >
        <Text
          style={[
            styles.buttonText,
            (pressed || longPressed) && styles.buttonTextPressed,
          ]}
        >
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderColor: COLORS.light.oceanPrimary,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  buttonPressed: {
    backgroundColor: `${COLORS.light.oceanPrimary}20`,
  },
  buttonLongPressed: {
    backgroundColor: COLORS.light.oceanPrimary,
  },
  buttonText: {
    color: COLORS.light.oceanPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextPressed: {
    color: COLORS.light.primaryForeground,
  },
});
