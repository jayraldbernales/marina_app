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

export const SignupScreen = () => {
  const router = useRouter();
  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Interaction states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  //Name
  const [fullName, setFullName] = useState("");
  const [nameFocused, setNameFocused] = useState(false);

  // Animations
  const buttonScale = new Animated.Value(1);
  const focusAnim = new Animated.Value(0);

  const handleSignup = async () => {
    try {
      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      // Build redirect URI similarly to Login flow so email links return
      // to the app and can be exchanged for a session.
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
        alert(error.message);
        return;
      }

      // If a session was returned, user is already signed in. Otherwise
      // Supabase has sent a confirmation email and we should prompt user
      // to check their inbox.
      if (data?.session) {
        router.push("/(tabs)");
      } else {
        alert("Check your email to confirm your account.\nThen sign in.");
        router.replace("/login");
      }
    } catch (err: any) {
      console.error(err);
      alert("Error creating account: " + (err?.message ?? err));
    }
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
      <ScreenHeader
        title="Create Account"
        onBackPress={() => router.replace("/login")}
      />

      <AuthCard title="Join MARINA" subtitle="Start your seafood journey today">
        {/* Name Input */}
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
        {/* Confirm Password Input */}
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

        {/* Divider */}
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
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.light.oceanMedium,
    fontWeight: "500",
    fontSize: 12,
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
