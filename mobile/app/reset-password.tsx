// app/reset-password.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    buttonScale,
    focusAnim,
    animatePressIn,
    animatePressOut,
    animateFocus,
  } = usePressAndFocusAnimations();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery session detected ✅");
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  const handleUpdatePassword = async () => {
    if (isLoading) return;

    if (!newPassword || !confirmPassword) {
      showError("Please enter both password fields");
      return;
    }

    if (newPassword.length < 6) {
      showError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Update password error:", error);
        showError(error.message || "Failed to update password");
        return;
      }

      showSuccess("Password updated successfully!");
      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Update password error:", err);
      showError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToForgotPassword = () => {
    router.replace("/forgot-password");
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
      <ScreenHeader
        title="Reset Password"
        onBackPress={navigateToForgotPassword}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <AuthCard
            title="Create New Password"
            subtitle="Enter your new password below"
          >
            <Text style={styles.description}>
              Your new password must be different from previously used
              passwords.
            </Text>

            <TextInputWithIcon
              iconName="lock-closed-outline"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              focused={passwordFocused}
              focusAnim={focusAnim}
              label="New Password"
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
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              focused={confirmPasswordFocused}
              focusAnim={focusAnim}
              label="Confirm Password"
              showPassword={showConfirmPassword}
              onTogglePassword={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              onFocus={() => {
                setConfirmPasswordFocused(true);
                animateFocus(true);
              }}
              onBlur={() => {
                setConfirmPasswordFocused(false);
                animateFocus(false);
              }}
            />

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementText}>Password must:</Text>
              <Text
                style={[
                  styles.requirementItem,
                  newPassword.length >= 6 && styles.requirementMet,
                ]}
              >
                • Be at least 6 characters long
              </Text>
              <Text
                style={[
                  styles.requirementItem,
                  newPassword === confirmPassword &&
                    newPassword.length > 0 &&
                    styles.requirementMet,
                ]}
              >
                • Match the confirmation
              </Text>
            </View>

            <PrimaryButton
              title={isLoading ? "Updating..." : "Update Password"}
              onPress={handleUpdatePassword}
              buttonScale={buttonScale}
              onPressIn={animatePressIn}
              onPressOut={animatePressOut}
              isLoading={isLoading}
              disabled={isLoading}
            />
          </AuthCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 20 : 20,
    paddingBottom: 40,
  },
  description: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 24,
    lineHeight: 20,
  },
  passwordRequirements: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  requirementText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 13,
    color: "#666666",
    marginLeft: 8,
    marginBottom: 4,
  },
  requirementMet: {
    color: "#4CAF50",
    textDecorationLine: "none",
  },
});
