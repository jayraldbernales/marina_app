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
import * as AuthSession from "expo-auth-session";
import { supabase } from "../lib/supabase";

// ⭐ Import toast helpers
import { showError, showSuccess, showInfo } from "../lib/toast";

export const SignupScreen = () => {
  const router = useRouter();

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

  // Animations
  const buttonScale = new Animated.Value(1);
  const focusAnim = new Animated.Value(0);

  const validatePassword = (password: string) => {
    const rules = [
      { test: /.{8,}/, msg: "Password must be at least 8 characters long." },
      {
        test: /[A-Z]/,
        msg: "Password must contain at least one uppercase letter.",
      },
      {
        test: /[a-z]/,
        msg: "Password must contain at least one lowercase letter.",
      },
      { test: /[0-9]/, msg: "Password must contain at least one number." },
      {
        test: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
        msg: "Password must contain at least one symbol.",
      },
    ];

    return rules
      .filter((rule) => !rule.test.test(password))
      .map((rule) => rule.msg);
  };

  const handleSignup = async () => {
    try {
      if (!fullName) {
        showError("Please enter your full name.");
        return;
      }
      if (!email) {
        showError("Please enter your email.");
        return;
      }

      // ⭐ Validate password with rules
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        showError(passwordErrors[0]);
        return;
      }

      if (password !== confirmPassword) {
        showError("Passwords do not match.");
        return;
      }

      // Redirect handling
      let redirectTo: string;
      if (__DEV__) {
        redirectTo = AuthSession.makeRedirectUri({ useProxy: true } as any);
      } else {
        redirectTo = AuthSession.makeRedirectUri({
          scheme: "marina",
          path: "/auth/callback",
          preferLocalhost: false,
        });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            fullname: fullName,
          },
        },
      });

      if (error) {
        showError(error.message);
        return;
      }

      if (data?.user && !data?.session) {
        showError(
          "This email is already registered. Please verify your email or log in."
        );
        return;
      }

      if (data?.session) {
        showSuccess("Account created!");
        router.push("/(tabs)");
        return;
      }

      showInfo("Check your email to confirm your account.");
      router.replace("/login");
    } catch (err: any) {
      console.error(err);
      showError("Error creating account: " + (err?.message ?? err));
    }
  };

  const animatePressIn = () =>
    Animated.spring(buttonScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();

  const animatePressOut = () =>
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();

  const animateFocus = (focused: boolean) =>
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 150,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();

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
          title="Create Account"
          onPress={handleSignup}
          buttonScale={buttonScale}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
        />

        <View style={styles.loginLinkWrapper}>
          <Text style={styles.loginLinkText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
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
    color: "#00BFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
