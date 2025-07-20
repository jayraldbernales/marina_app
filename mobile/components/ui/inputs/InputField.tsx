import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../../constants";

// Define the specific icon names you'll be using
type IoniconsName =
  | "mail-outline"
  | "lock-closed-outline"
  | "eye-outline"
  | "eye-off-outline";

interface TextInputWithIconProps {
  iconName: IoniconsName;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
  focused: boolean;
  focusAnim: Animated.Value;
  label: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const TextInputWithIcon = ({
  iconName,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  showPassword = false,
  onTogglePassword,
  keyboardType = "default",
  autoCapitalize = "none",
  focused,
  focusAnim,
  label,
  onFocus,
  onBlur,
}: TextInputWithIconProps) => {
  const focusBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${COLORS.light.oceanLight}4D`, COLORS.light.aquaBright],
  });

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor: focused
              ? focusBorderColor
              : `${COLORS.light.oceanLight}4D`,
            shadowColor: COLORS.light.aquaBright,
            shadowOpacity: focused ? 0.2 : 0,
            shadowRadius: focused ? 6 : 0,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <Ionicons
          name={iconName}
          size={18}
          color={COLORS.light.oceanPrimary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.light.mutedForeground}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !showPassword}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {onTogglePassword && (
          <Pressable
            onPress={onTogglePassword}
            style={({ pressed }) => [
              styles.eyeIcon,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={COLORS.light.oceanPrimary}
            />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.light.oceanPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.light.card,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 40,
    color: COLORS.light.foreground,
    fontSize: 14,
  },
  eyeIcon: {
    padding: 8,
  },
});
