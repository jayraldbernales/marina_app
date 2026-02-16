import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../constants";

const About = () => {
  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - matches Support screen */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App Info Card - clean like quick support */}
        <View style={styles.appCard}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Marina</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* Description Card - clean card style */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About MARINA</Text>
          <Text style={styles.description}>
            MARINA – Marketplace for Aquatic Retail & Instant Network Access is
            a mobile seafood marketplace by BSCS students of Bohol Island State
            University – Candijay Campus connecting vendors and consumers.
          </Text>
        </View>

        {/* Contact Card - matches contact options style */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact</Text>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleOpenLink("mailto:bernalesj28@gmail.com")}
            activeOpacity={0.7}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: "#FFE0B2" }]}
            >
              <Ionicons name="mail" size={20} color="#E64A19" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>bernalesj28@gmail.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleOpenLink("tel:+639947546757")}
            activeOpacity={0.7}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: "#E3F2FD" }]}
            >
              <Ionicons name="call" size={20} color="#1976D2" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>+63 994 754 6757</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactItem}
            onPress={() => handleOpenLink("https://www.bisu.edu.ph")}
            activeOpacity={0.7}
          >
            <View
              style={[styles.iconContainer, { backgroundColor: "#E8EAF6" }]}
            >
              <Ionicons name="globe" size={20} color="#3F51B5" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={styles.contactValue}>www.bisu.edu.ph</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Team Card - clean list style */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Team</Text>

          <View style={styles.teamItem}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#E0F2FE" }]}
            >
              <Ionicons name="person" size={20} color={COLORS.light.primary} />
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>Jayrald Bernales</Text>
              <Text style={styles.teamRole}>Lead Developer</Text>
            </View>
          </View>

          <View style={styles.teamItem}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#E0F2FE" }]}
            >
              <Ionicons name="person" size={20} color={COLORS.light.primary} />
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>Rose Ann Ocmar</Text>
              <Text style={styles.teamRole}>Researcher</Text>
            </View>
          </View>

          <View style={styles.teamItem}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#E0F2FE" }]}
            >
              <Ionicons name="person" size={20} color={COLORS.light.primary} />
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>Anna Dupalco</Text>
              <Text style={styles.teamRole}>Researcher</Text>
            </View>
          </View>

          <View style={styles.teamItem}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#E0F2FE" }]}
            >
              <Ionicons name="person" size={20} color={COLORS.light.primary} />
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>Junre Gamutan</Text>
              <Text style={styles.teamRole}>Researcher</Text>
            </View>
          </View>

          <View style={styles.adviserContainer}>
            <Text style={styles.adviserLabel}>Thesis Adviser</Text>
            <Text style={styles.adviserName}>Rodelou G. Tuyor</Text>
          </View>
        </View>

        {/* Footer - matches Support screen */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>
            © 2026 Marina Thesis Project. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default About;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.common.white,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f2ed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  appCard: {
    backgroundColor: COLORS.light.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.common.white,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: COLORS.common.white,
    opacity: 0.9,
  },
  card: {
    backgroundColor: COLORS.common.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  teamItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  teamRole: {
    fontSize: 13,
    color: "#999",
  },
  adviserContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  adviserLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  adviserName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },

  footer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  copyright: {
    fontSize: 11,
    color: "#999",
    marginBottom: 4,
  },
});
