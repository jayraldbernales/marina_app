import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../constants";

// Define types
type FaqItem = {
  question: string;
  answer: string;
};

const Support = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err),
    );
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqData: FaqItem[] = [
    {
      question: "How do I create an account?",
      answer:
        "Open the MARINA app and tap 'Sign Up'. Enter your details and choose whether to register as a Buyer or Vendor. Complete the registration process to start using the platform.",
    },
    {
      question: "How do I place an order?",
      answer:
        "Browse available seafood products from participating vendors in your barangay, select your desired items and quantity, add them to your cart, and proceed to checkout. Confirm your delivery and payment option to place the order.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "MARINA supports Cash on Delivery (COD) and secure online payments Gcash. Available payment options may vary depending on vendor setup.",
    },
    {
      question: "How do I become a vendor?",
      answer:
        "Create an account and select the Vendor role during registration. Once approved and activated, you can start listing your seafood products, manage inventory, and receive orders through the app.",
    },
    {
      question: "What is the delivery timeframe?",
      answer:
        "Delivery depends on the vendor and location within the barangay. Since MARINA operates locally, most orders are processed and delivered within the same day, depending on availability and confirmation.",
    },
    {
      question: "How do I track my order?",
      answer:
        "You can monitor your order status in real-time through the 'My Orders' section in the app. You will also receive in-app notifications when the order status changes.",
    },
    {
      question: "What is your return policy?",
      answer:
        "Because seafood is perishable, returns are only accepted for incorrect or damaged items. Report the issue immediately through the app after delivery for proper resolution.",
    },
    {
      question: "How do I reset my password?",
      answer:
        "On the login screen, tap 'Forgot Password' and follow the instructions to securely reset your password.",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Support Card */}
        <View style={styles.quickSupportCard}>
          <View style={styles.supportIconContainer}>
            <Ionicons
              name="headset-outline"
              size={32}
              color={COLORS.light.primary}
            />
          </View>
          <Text style={styles.quickSupportTitle}>Need Assistance?</Text>
          <Text style={styles.quickSupportText}>
            We're here to help you 24/7.
          </Text>
        </View>

        {/* Contact Options */}
        <View style={styles.contactOptionsCard}>
          <Text style={styles.sectionTitle}>Contact Options</Text>

          <TouchableOpacity
            style={styles.contactOptionItem}
            onPress={() => handleOpenLink("tel:+639947546757")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.optionIconContainer,
                { backgroundColor: "#E3F2FD" },
              ]}
            >
              <Ionicons name="call" size={22} color="#1976D2" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Hotline</Text>
              <Text style={styles.optionSubtitle}>+63 994 754 6757</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactOptionItem}
            onPress={() => handleOpenLink("mailto:bernalesj28@gmail.com")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.optionIconContainer,
                { backgroundColor: "#FFE0B2" },
              ]}
            >
              <Ionicons name="mail" size={22} color="#E64A19" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Email Support</Text>
              <Text style={styles.optionSubtitle}>bernalesj28@gmail.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactOptionItem}
            onPress={() => handleOpenLink("https://m.me/jayrald.bernales.3")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.optionIconContainer,
                { backgroundColor: "#E8EAF6" },
              ]}
            >
              <Ionicons name="chatbubbles" size={22} color="#3F51B5" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Messenger</Text>
              <Text style={styles.optionSubtitle}>Jayrald Bernales</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqCard}>
          <View style={styles.faqHeader}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <TouchableOpacity onPress={() => setExpandedFaq(null)}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {faqData.map((faq: FaqItem, index: number) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFaq(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === index ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
              {expandedFaq === index && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Report Issue Card */}
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <Ionicons
              name="alert-circle-outline"
              size={24}
              color={COLORS.light.primary}
            />
            <Text style={styles.reportTitle}>Report an Issue</Text>
          </View>
          <Text style={styles.reportText}>
            Found a bug or experiencing technical difficulties? Let us know and
            we'll fix it promptly.
          </Text>
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => handleOpenLink("https://m.me/jayrald.bernales.3")}
            activeOpacity={0.7}
          >
            <Text style={styles.reportButtonText}>Report Issue</Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={COLORS.common.white}
            />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.copyright}>
            © 2026 Marina Thesis Project. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Support;

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
  quickSupportCard: {
    backgroundColor: COLORS.light.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  supportIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.common.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  quickSupportTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.common.white,
    marginBottom: 8,
  },
  quickSupportText: {
    fontSize: 14,
    color: COLORS.common.white,
    textAlign: "center",
    opacity: 0.9,
    lineHeight: 20,
  },
  contactOptionsCard: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  contactOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  faqCard: {
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
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resetText: {
    fontSize: 12,
    color: COLORS.light.primary,
    fontWeight: "500",
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  faqQuestionText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingBottom: 16,
    paddingTop: 4,
  },
  faqAnswerText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  reportCard: {
    backgroundColor: "#FFF3E0",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E64A19",
    marginLeft: 8,
  },
  reportText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 16,
  },
  reportButton: {
    backgroundColor: "#E64A19",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  reportButtonText: {
    color: COLORS.common.white,
    fontWeight: "600",
    fontSize: 14,
    marginRight: 8,
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
