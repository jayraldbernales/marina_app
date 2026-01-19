import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants";
import { PrimaryButton } from "../components/ui/buttons/PrimaryButton";
import { TextInputWithIcon } from "../components/ui/inputs/InputField";
import { AuthCard } from "../components/ui/cards/AuthCard";
import { ScreenHeader } from "../components/ui/headers/ScreenHeader";

import { useRouter } from "expo-router";
import { showError, showSuccess, showInfo } from "../lib/toast";
import { validatePassword } from "../lib/validation";
import { useAuth } from "../hooks/useAuth";
import { usePressAndFocusAnimations } from "../hooks/useAnimations";

export const SignupScreen = () => {
  const router = useRouter();

  const [isSigningUp, setIsSigningUp] = useState(false);

  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Name
  const [fullName, setFullName] = useState("");
  const [nameFocused, setNameFocused] = useState(false);

  // Interaction states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const {
    buttonScale,
    focusAnim,
    animatePressIn,
    animatePressOut,
    animateFocus,
  } = usePressAndFocusAnimations();
  const { signUp } = useAuth();

  // Animations handled by shared hook

  const handleSignup = async () => {
    // Prevent multiple clicks
    if (isSigningUp) return;

    try {
      // Basic validation
      if (!fullName.trim()) {
        showError("Please enter your full name.");
        return;
      }
      if (!email.trim()) {
        showError("Please enter your email.");
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError("Please enter a valid email address.");
        return;
      }

      // Validate password using shared util
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        showError(passwordErrors[0]);
        return;
      }

      if (password !== confirmPassword) {
        showError("Passwords do not match.");
        return;
      }

      setIsSigningUp(true);

      // Use shared auth hook which encapsulates retry logic
      const { data, error } = await signUp(email, password, { fullName });

      if (error) {
        const errorStr = (error.message || "").toLowerCase();
        if (errorStr.includes("already registered")) {
          showError(
            "This email is already registered. Please sign in instead.",
          );
        } else if (errorStr.includes("invalid email")) {
          showError("Please enter a valid email address.");
        } else if (errorStr.includes("smtp") || errorStr.includes("email")) {
          showError("Email service is having issues. Please try again later.");
        } else {
          showError(
            error.message || "Failed to create account. Please try again.",
          );
        }
        return;
      }

      showInfo("Account created! Check your email to confirm.");
      router.replace("/login");
    } catch (err: any) {
      console.error("Signup exception:", err);
      showError("Error creating account: " + (err?.message || String(err)));
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <LinearGradient
      colors={[
        COLORS.light.oceanLight,
        COLORS.light.seafoam,
        COLORS.light.oceanLight,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScreenHeader
        title="Create Account"
        onBackPress={() => router.replace("/login")}
      />

      <AuthCard title="Join MARINA" subtitle="Start your seafood journey today">
        <TextInputWithIcon
          iconName="person-outline"
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="sentences"
          focused={nameFocused}
          focusAnim={focusAnim}
          label="Full Name"
          onFocus={() => {
            setNameFocused(true);
            animateFocus(true);
          }}
          onBlur={() => {
            setNameFocused(false);
            animateFocus(false);
          }}
        />

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

        <TextInputWithIcon
          iconName="lock-closed-outline"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          focused={passwordFocused}
          focusAnim={focusAnim}
          label="Confirm Password"
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

        <Text style={styles.termsText}>
          By creating an account, you agree to our Terms of Service and Privacy
          Policy.
        </Text>

        <PrimaryButton
          title={isSigningUp ? "Creating Account..." : "Create Account"}
          onPress={handleSignup}
          buttonScale={buttonScale}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
          isLoading={isSigningUp}
          disabled={isSigningUp}
        />

        <View style={styles.loginLinkWrapper}>
          <Text style={styles.loginLinkText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => !isSigningUp && router.replace("/login")}
            disabled={isSigningUp}
            style={isSigningUp && { opacity: 0.5 }}
          >
            <Text style={styles.loginLinkButton}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
  termsText: {
    fontSize: 12,
    color: "#004E7C",
    textAlign: "center",
    marginBottom: 20,
  },
  loginLinkWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  loginLinkText: {
    color: "#004E7C",
    fontSize: 14,
  },
  loginLinkButton: {
    color: COLORS.light.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
