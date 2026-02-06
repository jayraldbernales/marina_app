import React, { useState, useRef } from "react";
import {
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants";
import { PrimaryButton } from "../components/ui/buttons/PrimaryButton";
import { SecondaryButton } from "../components/ui/buttons/SecondaryButton";
import { TextInputWithIcon } from "../components/ui/inputs/InputField";
import { AuthCard } from "../components/ui/cards/AuthCard";
import { DividerWithText } from "../components/ui/DividerWithText";
import { FacebookButton } from "./ui/buttons/FacebookButton";
import { useRouter } from "expo-router";
import { showError } from "../lib/toast";
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isFacebookLoggingIn, setIsFacebookLoggingIn] = useState(false);

  const { signInWithPassword, signInWithOAuth } = useAuth();
  const {
    buttonScale,
    focusAnim,
    animatePressIn,
    animatePressOut,
    animateFocus,
  } = usePressAndFocusAnimations();

  const handleLogin = async () => {
    // Prevent multiple clicks if already logging in
    if (isLoggingIn) return;

    // Basic validation
    if (!email.trim() || !password.trim()) {
      showError("Please enter both email and password");
      return;
    }

    setIsLoggingIn(true);

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

      // Auth state listener in root layout will handle navigation
      // No need to manually set user or navigate
    } catch (err: any) {
      console.error(err);
      showError("Something went wrong while signing in");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFacebookLogin = async () => {
    if (isFacebookLoggingIn) return;

    setIsFacebookLoggingIn(true);

    try {
      const { data, error } = await signInWithOAuth("facebook");
      if (error) {
        console.error("Facebook login error:", error);
        showError((error as any)?.message || "Error retrieving session");
        return;
      }

      // Auth state listener in root layout will handle navigation
      // No need to manually set user or navigate
    } catch (err: any) {
      console.error("Facebook login error:", err);
      showError("Error retrieving session: " + (err?.message || String(err)));
    } finally {
      setIsFacebookLoggingIn(false);
    }
  };

  const navigateToForgotPassword = () => {
    router.push("/forgot-password");
  };

  return (
    <LinearGradient
      colors={[
        COLORS.light.background,
        COLORS.light.seafoam,
        COLORS.light.background,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LOGIN</Text>
      </View>

      <AuthCard title="Welcome" subtitle="Sign in to your MARINA account">
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
          onPress={navigateToForgotPassword}
          style={({ pressed }) => [
            styles.forgotPasswordButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </Pressable>

        <PrimaryButton
          title={isLoggingIn ? "Signing In..." : "Sign In"}
          onPress={handleLogin}
          buttonScale={buttonScale}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
          isLoading={isLoggingIn}
          disabled={isLoggingIn}
        />

        <FacebookButton
          title={
            isFacebookLoggingIn ? "Connecting..." : "Continue with Facebook"
          }
          onPress={handleFacebookLogin}
          buttonScale={buttonScale}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
          isLoading={isFacebookLoggingIn}
          disabled={isFacebookLoggingIn}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.light.oceanPrimary,
  },
});
