import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Add this import

const { width, height } = Dimensions.get("window");

export const WelcomeScreen = ({ onFinish }: { onFinish?: () => void }) => {
  const router = useRouter();

  const handleGetStarted = async () => {
    // Set the flag to mark welcome as seen
    await AsyncStorage.setItem("hasSeenWelcome", "true");

    if (onFinish) {
      onFinish();
    } else {
      router.replace("/login");
    }
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
      {/* Middle Section - Illustration */}
      <View style={styles.illustrationSection}>
        <Image
          source={require("@/assets/img/market.png")}
          style={styles.illustrationImage}
          resizeMode="contain"
        />

        {/* Decorative dots */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      {/* Bottom Section - CTA */}
      <View style={styles.bottomSection}>
        <Text style={styles.welcomeTitle}>Welcome to MARINA!</Text>
        <Text style={styles.welcomeSubtitle}>
          Connecting coastal communities with fresh seafood
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGetStarted} // Updated to use the new handler
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          By continuing, you agree to our{"\n"}
          <Text style={styles.linkText} onPress={() => router.push("/terms")}>
            Terms of Service
          </Text>{" "}
          &{" "}
          <Text style={styles.linkText} onPress={() => router.push("/privacy")}>
            Privacy Policy
          </Text>
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  topSection: {
    paddingTop: height * 0.1,
    paddingBottom: 32,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  illustrationSection: {
    justifyContent: "center",
    alignItems: "center",
  },
  illustrationImage: {
    width: width * 1.0,
    height: width * 0.8,
  },

  dotsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "hsl(210, 100%, 90%)",
  },
  dotActive: {
    backgroundColor: "hsl(210, 100%, 20%)",
    width: 24,
  },
  bottomSection: {
    paddingHorizontal: 28,
    marginTop: 28,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "hsl(210, 100%, 20%)",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 23,
    paddingHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: "hsl(210, 100%, 20%)",
    height: 58,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "hsl(210, 100%, 20%)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  footerText: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    lineHeight: 17,
  },
  linkText: {
    fontSize: 11,
    fontWeight: "700",
    color: "hsl(210, 100%, 20%)",
    textDecorationLine: "none",
  },
});
