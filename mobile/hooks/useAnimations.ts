import { useCallback, useRef } from "react";
import { Animated, Easing } from "react-native";

// Hook to share press and focus animations across components
export function usePressAndFocusAnimations() {
  // Use refs so Animated.Values aren't recreated each render
  const buttonScale = useRef(new Animated.Value(1)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;

  const animatePressIn = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const animatePressOut = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const animateFocus = useCallback(
    (focused: boolean) => {
      Animated.timing(focusAnim, {
        toValue: focused ? 1 : 0,
        duration: 150,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
    },
    [focusAnim]
  );

  return {
    buttonScale,
    focusAnim,
    animatePressIn,
    animatePressOut,
    animateFocus,
  };
}
