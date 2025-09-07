import React, { useState, useRef } from "react";
import {
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants";
import { PrimaryButton } from "../components/ui/buttons/PrimaryButton";
import { SecondaryButton } from "../components/ui/buttons/SecondaryButton";
import { TextInputWithIcon } from "../components/ui/inputs/InputField";
import { AuthCard } from "../components/ui/cards/AuthCard";
import { ScreenHeader } from "../components/ui/headers/ScreenHeader";
import { DividerWithText } from "../components/ui/DividerWithText";
import { FacebookButton } from "./ui/buttons/FacebookButton";

export const LoginScreen = ({
  onNavigate,
}: {
  onNavigate: (screen: string) => void;
}) => {
  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Interaction states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Refs
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Animations
  const buttonScale = new Animated.Value(1);
  const focusAnim = new Animated.Value(0);

  const handleLogin = () => {
    onNavigate("buyer-dashboard");
  };

  const animatePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const animatePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const animateFocus = (focused: boolean) => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 150,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  };

  return (
    <LinearGradient
      colors={[
        COLORS.light.oceanLight,
        COLORS.light.seafoam,
        COLORS.light.aquaSoft,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScreenHeader title="Login" onBackPress={() => onNavigate("welcome")} />

      <AuthCard title="Welcome Back" subtitle="Sign in to your MARINA account">
        {/* Email Input */}
        <TextInputWithIcon
          iconName="mail-outline"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          focused={emailFocused}
          focusAnim={focusAnim}
          label="Email"
          onFocus={() => {
            setEmailFocused(true);
            animateFocus(true);
          }}
          onBlur={() => {
            setEmailFocused(false);
            animateFocus(false);
          }}
        />

        {/* Password Input */}
        <TextInputWithIcon
          iconName="lock-closed-outline"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          focused={passwordFocused}
          focusAnim={focusAnim}
          label="Password"
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onFocus={() => {
            setPasswordFocused(true);
            animateFocus(true);
          }}
          onBlur={() => {
            setPasswordFocused(false);
            animateFocus(false);
          }}
        />

        {/* Forgot Password */}
        <Pressable
          style={({ pressed }) => [
            styles.forgotPasswordButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </Pressable>

        <PrimaryButton
          title="Sign In"
          onPress={handleLogin}
          buttonScale={buttonScale}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
        />

        {/* <FacebookButton
          title="Connect with Facebook"
          onPress={handleLogin}
          buttonScale={buttonScale}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
        /> */}

        {/* Divider */}
        <DividerWithText text="Don't have an account?" />

        <SecondaryButton
          title="Create Account"
          onPress={() => onNavigate("signup")}
          buttonScale={buttonScale}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
          onLongPress={() => {
            setTimeout(() => {}, 500);
          }}
        />
      </AuthCard>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.light.oceanMedium,
    fontWeight: "500",
    fontSize: 12,
  },
});
