// app/forgot-password.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants";
import { PrimaryButton } from "../components/ui/buttons/PrimaryButton";
import { TextInputWithIcon } from "../components/ui/inputs/InputField";
import { AuthCard } from "../components/ui/cards/AuthCard";
import { ScreenHeader } from "../components/ui/headers/ScreenHeader";
import { useRouter } from "expo-router";
import { showError, showSuccess } from "../lib/toast";
import { usePressAndFocusAnimations } from "../hooks/useAnimations";
import { supabase } from "../lib/supabase";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const {
    buttonScale,
    focusAnim,
    animatePressIn,
    animatePressOut,
    animateFocus,
  } = usePressAndFocusAnimations();

  const handleResetPassword = async () => {
    if (isLoading) return;

    if (!email.trim()) {
      showError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Use Supabase to send password reset email
      const redirectTo = __DEV__
        ? `exp://askl608-anonymous-8081.exp.direct/--/reset-password`
        : "marina://reset-password";

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error("Reset password error:", error);
        showError(error.message || "Failed to send reset email");
        return;
      }

      setResetSent(true);
      showSuccess("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      console.error("Reset password error:", err);
      showError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  if (resetSent) {
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
        <ScreenHeader title="Forgot Password" onBackPress={navigateToLogin} />

        <AuthCard
          title="Check Your Email"
          subtitle="We've sent you a password reset link"
        >
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              We've sent a password reset link to:
            </Text>
            <Text style={styles.emailText}>{email}</Text>
            <Text style={styles.instructionText}>
              Please check your email and follow the instructions to reset your
              password.
            </Text>
            <Text style={styles.noteText}>
              Note: The reset link will expire in 1 hour.
            </Text>
            <Pressable
              onPress={navigateToLogin}
              style={({ pressed }) => [
                styles.simpleButton,
                pressed && styles.simpleButtonPressed,
              ]}
            >
              <Text style={styles.simpleButtonText}>Back to Login</Text>
            </Pressable>
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the email? </Text>
              <Pressable onPress={() => setResetSent(false)}>
                <Text style={styles.resendLink}>Try again</Text>
              </Pressable>
            </View>
          </View>
        </AuthCard>
      </LinearGradient>
    );
  }

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
      <ScreenHeader title="Forgot Password" onBackPress={navigateToLogin} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <AuthCard
            title="Reset Password"
            subtitle="Enter your email to receive a reset link"
          >
            <Text style={styles.description}>
              We'll send you a link to reset your password. The link will expire
              in 1 hour.
            </Text>

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
              // Removed editable prop as it doesn't exist in your component
            />

            <PrimaryButton
              title={isLoading ? "Sending..." : "Send Reset Link"}
              onPress={handleResetPassword}
              buttonScale={buttonScale}
              onPressIn={animatePressIn}
              onPressOut={animatePressOut}
              isLoading={isLoading}
              disabled={isLoading}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Remember your password? </Text>
              <Pressable onPress={navigateToLogin}>
                <Text style={styles.loginLink}>Login</Text>
              </Pressable>
            </View>
          </AuthCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingTop: Platform.OS === "ios" ? 20 : 20,
    paddingBottom: 40,
  },
  description: {
    fontSize: 14,
    color: "#666666", // Using hex instead of COLORS.light.textSecondary
    marginBottom: 24,
    lineHeight: 20,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: "#666666", // Using hex instead of COLORS.light.textSecondary
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.light.oceanMedium, // This exists in your original code
    fontWeight: "600",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  successText: {
    fontSize: 16,
    color: "#666666", // Using hex instead of COLORS.light.textSecondary
    marginBottom: 8,
    textAlign: "center",
  },
  emailText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.light.oceanDeep, // This exists in your original code
    marginBottom: 16,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 14,
    color: "#666666", // Using hex instead of COLORS.light.textSecondary
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  noteText: {
    fontSize: 12,
    color: COLORS.light.oceanMedium, // This exists in your original code
    textAlign: "center",
    marginBottom: 32,
    fontStyle: "italic",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: "#666666", // Using hex instead of COLORS.light.textSecondary
  },
  resendLink: {
    fontSize: 14,
    color: COLORS.light.oceanMedium, // This exists in your original code
    fontWeight: "600",
  },
  simpleButton: {
    backgroundColor: COLORS.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  simpleButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  simpleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
