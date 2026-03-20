import * as WebBrowser from "expo-web-browser";
import Toast from "react-native-toast-message";
import { Stack, useRouter, useSegments } from "expo-router";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useUserStore } from "../store/userStore";
import { COLORS } from "../constants";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationProvider } from "../contexts/NotificationContext";
import { CartProvider } from "../contexts/CartContext";
import { VendorOrderProvider } from "../contexts/VendorOrderContext";
import { RiderDeliveryProvider } from "../contexts/RiderDeliveryContext";

WebBrowser.maybeCompleteAuthSession();

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const { user, setUser } = useUserStore();
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (!url.includes("type=recovery") && !url.includes("reset-password"))
        return;

      const fragment = url.split("#")[1];
      if (!fragment) return;

      const params = new URLSearchParams(fragment);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) {
          router.replace("/reset-password");
        }
      }
    };

    // App already open when link clicked
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    // App opened cold from the link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);
  // Initialize auth session and welcome flag on app launch
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Load welcome flag
        const seenWelcome = await AsyncStorage.getItem("hasSeenWelcome");
        setHasSeenWelcome(seenWelcome === "true");

        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? "",
            fullName: session.user.user_metadata?.full_name ?? "",
          });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          fullName: session.user.user_metadata?.full_name ?? "",
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isReady || !(segments.length > 0)) return;

    const currentSegment = segments[0] as string;
    const authScreens = [
      "login",
      "signup",
      "forgot-password",
      "reset-password",
      "terms",
      "privacy",
    ];
    const isAuthScreen = authScreens.includes(currentSegment);

    // If welcome already seen and user lands on index, skip it
    if (currentSegment === "index" && hasSeenWelcome) {
      router.replace("/login");
      return;
    }

    if (!user && !isAuthScreen && currentSegment !== "index") {
      router.replace("/login");
    } else if (user && isAuthScreen && currentSegment !== "reset-password") {
      router.replace("/(tabs)");
    }
  }, [user, isReady, segments, hasSeenWelcome]);
  // Show loading screen during auth initialization
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.light.oceanLight,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.light.oceanPrimary} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.toastContainer}>
        <Toast topOffset={60} />
      </View>

      {/* WRAP YOUR STACK WITH NOTIFICATION PROVIDER */}
      <NotificationProvider>
        <CartProvider>
          <VendorOrderProvider>
            <RiderDeliveryProvider>
              <View style={{ flex: 1 }}>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="login" />
                  <Stack.Screen name="signup" />
                  <Stack.Screen name="terms" options={{ headerShown: true }} />
                  <Stack.Screen
                    name="privacy"
                    options={{ headerShown: true }}
                  />

                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(seller-tabs)" />
                  <Stack.Screen name="(rider-tabs)" />

                  <Stack.Screen
                    name="registration"
                    options={{ headerShown: false }}
                  />

                  <Stack.Screen name="forgot-password" />
                  <Stack.Screen name="reset-password" />

                  <Stack.Screen
                    name="+not-found"
                    options={{ headerShown: false }}
                  />
                </Stack>
              </View>
            </RiderDeliveryProvider>
          </VendorOrderProvider>
        </CartProvider>
      </NotificationProvider>
    </>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    elevation: 999999,
  },
});
