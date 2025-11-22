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

import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

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

  // Animations
  const buttonScale = new Animated.Value(1);
  const focusAnim = new Animated.Value(0);

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

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      router.push("/(tabs)");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while signing in");
    }
  };

  const handleFacebookLogin = async () => {
    try {
      // Build redirect URI. In dev use the Expo proxy so PKCE state is
      // maintained when running in Expo Go; production uses the app scheme.
      let redirectTo: string;
      if (__DEV__) {
        // `useProxy` is not present in the local TypeScript types for
        // `makeRedirectUri` in this project; cast to `any` to allow it at
        // runtime while keeping a clear dev/production branch.
        redirectTo = AuthSession.makeRedirectUri({ useProxy: true } as any);
      } else {
        redirectTo = AuthSession.makeRedirectUri({
          scheme: "marina",
          path: "/auth/callback",
          preferLocalhost: false,
        });
      }

      console.log("Redirect URI:", redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo,
          // Keep skipBrowserRedirect true so we can open the provider URL
          // inside the Expo browser and manually exchange the code.
          // This is the recommended flow for React Native / Expo.
          skipBrowserRedirect: true,
        },
      });

      console.log("signInWithOAuth response:", { data, error });

      if (error) throw error;
      if (!data?.url) throw new Error("No OAuth URL returned from Supabase.");

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      console.log("openAuthSessionAsync result:", result);

      if (result.type === "success" && result.url) {
        // The provider may return either an authorization `code` (PKCE
        // flow) or an `access_token`/`refresh_token` (implicit). Handle
        // both: prefer exchanging the code, but if a token was returned
        // directly, set the session with Supabase.
        const returnedUrl = result.url;

        // Look in the fragment first (after '#'), then in the query if
        // needed.
        const fragment = (returnedUrl.split("#")[1] || "").trim();
        const queryFragment = fragment || returnedUrl.split("?")[1] || "";
        const params = new URLSearchParams(queryFragment);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken) {
          // Provider returned tokens directly (implicit). Use them to set
          // the Supabase session so the client is authenticated.
          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken ?? undefined,
            } as any);

          if (sessionError) throw sessionError;
          if (sessionData?.session) {
            console.log("✅ Login success:", sessionData.session.user);
            router.push("/(tabs)");
          } else {
            alert("Could not retrieve session after login.");
          }
        } else {
          // No tokens present — assume authorization code flow. Normalize
          // `?` -> `#` then exchange code for a session as before.
          let urlWithCode = returnedUrl;
          if (urlWithCode.includes("?") && !urlWithCode.includes("#")) {
            const [base, query] = urlWithCode.split("?");
            urlWithCode = `${base}#${query}`;
          }

          const { data: sessionData, error: sessionError } =
            await supabase.auth.exchangeCodeForSession(urlWithCode);

          if (sessionError) throw sessionError;
          if (sessionData?.session) {
            console.log("✅ Login success:", sessionData.session.user);
            router.push("/(tabs)");
          } else {
            alert("Could not retrieve session after login.");
          }
        }
      } else {
        console.log("❌ Login cancelled or failed.");
      }
    } catch (err: any) {
      console.error("Facebook login error:", err);
      alert("Error retrieving session: " + err.message);
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
