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
import { useRouter } from "expo-router";
import { showError, showSuccess } from "../lib/toast";
import { useUserStore } from "../store/userStore";

import { useAuth } from "../hooks/useAuth";
import { usePressAndFocusAnimations } from "../hooks/useAnimations";

export const LoginScreen = () => {
  const router = useRouter();

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

  const { signInWithPassword, signInWithOAuth } = useAuth();
  const {
    buttonScale,
    focusAnim,
    animatePressIn,
    animatePressOut,
    animateFocus,
  } = usePressAndFocusAnimations();

  const handleLogin = async () => {
    try {
      const { data, error } = await signInWithPassword(email, password);

      if (error) {
        showError((error as any)?.message || "Error signing in");
        return;
      }

      const user = (data as any)?.user;

      if (!user) {
        showError("Could not retrieve user after login.");
        return;
      }

      useUserStore.getState().setUser({
        id: user.id,
        email: user.email ?? "",
        fullName: user.user_metadata?.fullname ?? "",
      });

      showSuccess("Welcome!");

      router.push("/(tabs)");
    } catch (err: any) {
      console.error(err);
      showError("Something went wrong while signing in");
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const { data, error } = await signInWithOAuth("facebook");

      if (error) {
        console.error("Facebook login error:", error);
        showError((error as any)?.message || "Error retrieving session");
        return;
      }

      const session = (data as any)?.session;
      if (session?.user) {
        useUserStore.getState().setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          fullName: session.user.user_metadata?.fullname ?? "",
        });
        showSuccess("Welcome!");
        router.push("/(tabs)");
      } else {
        showError("Could not retrieve session after login.");
      }
    } catch (err: any) {
      console.error("Facebook login error:", err);
      showError("Error retrieving session: " + (err?.message || String(err)));
    }
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
      <ScreenHeader title="Login" onBackPress={() => router.replace("/")} />

      <AuthCard title="Welcome Back" subtitle="Sign in to your MARINA account">
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

        {/* Facebook OAuth login */}
        <FacebookButton
          title="Continue with Facebook"
          onPress={handleFacebookLogin}
          buttonScale={buttonScale}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
        />

        <DividerWithText text="Don't have an account?" />

        <SecondaryButton
          title="Create Account"
          onPress={() => router.replace("/signup")}
          buttonScale={buttonScale}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
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
