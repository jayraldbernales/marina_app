import React from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SvgXml } from "react-native-svg";

// Simplified SVG icons as XML strings (escaped backticks)
const WavesIcon = () => (
  <SvgXml
    xml={`<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" stroke="#00BFFF" stroke-width="4"/><path d="M10 40 Q 32 10 54 40" stroke="#00BFFF" stroke-width="4" fill="none"/></svg>`}
    width={64}
    height={64}
  />
);

const FishIcon = () => (
  <SvgXml
    xml={`<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="16" cy="16" rx="14" ry="10" stroke="#F0E68C" stroke-width="3"/><circle cx="22" cy="16" r="3" fill="#F0E68C"/></svg>`}
    width={32}
    height={32}
  />
);

import { useRouter } from "expo-router";

export const WelcomeScreen = () => {
  const router = useRouter();
  return (
    <ImageBackground
      source={require("../assets/img/ocean-hero.jpg")}
      style={styles.background}
      imageStyle={{ opacity: 0.2 }}
    >
      <View style={styles.overlayTop} />
      <View style={styles.overlayBottom} />

      <View style={styles.container}>
        <View style={styles.logoSection}>
          <View style={styles.iconWrapper}>
            <WavesIcon />
            <View style={styles.fishIcon}>
              <FishIcon />
            </View>
          </View>
          <Text style={styles.title}>MARINA</Text>
          <Text style={styles.subtitle}>Fresh Seafood Marketplace</Text>
        </View>

        <View style={styles.features}>
          <View style={styles.card}>
            {/* Replace with appropriate icon */}
            <Text style={styles.featureIcon}>🛒</Text>
            <Text style={styles.featureText}>Buy Fresh</Text>
          </View>
          <View style={styles.card}>
            {/* Replace with appropriate icon */}
            <Text style={styles.featureIcon}>🏪</Text>
            <Text style={styles.featureText}>Sell Local</Text>
          </View>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.replace("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Connecting coastal communities through fresh seafood
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
    backgroundColor: "#004E7C", // fallback color similar to ocean-deep
  },
  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(127, 255, 212, 0.1)", // aqua-soft/20
  },
  overlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "rgba(0, 78, 124, 0.5)", // ocean-deep/50
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  fishIcon: {
    position: "absolute",
    top: 8,
    right: -8,
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#F0E68C", // pearl color
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(127, 255, 212, 0.7)", // aqua-soft
    fontWeight: "500",
  },
  features: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 48,
  },
  card: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    alignItems: "center",
    borderColor: "rgba(0, 191, 255, 0.3)", // aqua-bright/30
    borderWidth: 1,
  },
  featureIcon: {
    fontSize: 32,
    color: "#00BFFF", // aqua-bright
    marginBottom: 8,
  },
  featureText: {
    color: "#F0E68C", // pearl
    fontWeight: "500",
    fontSize: 14,
  },
  buttons: {
    width: "80%",
  },
  loginButton: {
    backgroundColor: "#00BFFF", // aqua-bright
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#00BFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  loginButtonText: {
    color: "#004E7C", // ocean-deep
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  footerText: {
    color: "rgba(127, 255, 212, 0.7)",
    fontSize: 12,
  },
});
