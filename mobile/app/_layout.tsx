import React, { useState } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useColorScheme } from "@/hooks/useColorScheme";
import { WelcomeScreen } from "../components/WelcomeScreen";
import { LoginScreen } from "../components/LoginScreen";
import { SignupScreen } from "../components/SignupScreen";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [currentScreen, setCurrentScreen] = useState<
    "welcome" | "login" | "signup" | "tabs"
  >("welcome");

  if (!loaded) return null;

  const handleNavigate = (screen: "login" | "signup" | "tabs") => {
    if (screen === "tabs") {
      setCurrentScreen("tabs");
      router.replace("/(tabs)");
    } else {
      setCurrentScreen(screen);
    }
  };

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {currentScreen === "welcome" && (
        <WelcomeScreen
          onNavigate={(screen: string) =>
            handleNavigate(screen as "login" | "signup" | "tabs")
          }
        />
      )}
      {currentScreen === "login" && (
        <LoginScreen
          onNavigate={(screen: string) =>
            handleNavigate(screen as "login" | "signup" | "tabs")
          }
        />
      )}
      {currentScreen === "signup" && (
        <SignupScreen
          onNavigate={(screen: string) =>
            handleNavigate(screen as "login" | "signup" | "tabs")
          }
        />
      )}
      {currentScreen === "tabs" && (
        <>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </>
      )}
    </ThemeProvider>
  );
}
