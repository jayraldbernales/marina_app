import React from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants";
import { useRouter } from "expo-router";

export const PrivacyScreen = () => {
  const router = useRouter();

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
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.effectiveDate}>
            Effective Date: November 22, 2025
          </Text>

          <Text style={styles.sectionTitle}>Company Name: MARINA Inc.</Text>
          <Text style={styles.sectionTitle}>App Name: MARINA</Text>
          <Text style={styles.sectionTitle}>
            Contact Email: support@marinaapp.com
          </Text>
          <Text style={styles.sectionTitle}>
            Website: https://marinaapp.com
          </Text>

          <Text style={styles.sectionTitle}>Introduction</Text>
          <Text style={styles.paragraph}>
            MARINA Inc. ("we," "us," or "our") operates the MARINA mobile
            application (the "App"). This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use
            our App.
          </Text>
          <Text style={styles.paragraph}>
            We are committed to protecting your personal information and your
            right to privacy. If you have any questions or concerns about this
            Privacy Policy, please contact us at support@marinaapp.com.
          </Text>

          <Text style={styles.sectionTitle}>Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information that identifies, relates to, or could
            reasonably be linked with you ("Personal Information"). The types of
            Personal Information we collect depend on how you interact with our
            App.
          </Text>

          <Text style={styles.sectionSubtitle}>
            Information You Provide Directly
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>Account Information: When you
            create an account, we may collect your name, email address,
            password, and other registration details.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>Usage Data: We collect
            information about how you use the App, such as features accessed,
            time spent, and interactions.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>Communications: If you contact
            us, we may collect your name, email, and message content.
          </Text>

          <Text style={styles.sectionSubtitle}>
            Information Collected Automatically
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>Device Information: We collect
            device type, operating system, unique device identifiers, and mobile
            network information.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>Log Data: We log app usage,
            errors, and performance data.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>Location Data: With your
            consent, we may collect precise or approximate location data.
          </Text>

          <Text style={styles.sectionSubtitle}>
            Information from Third Parties
          </Text>
          <Text style={styles.paragraph}>
            We may receive information about you from third-party services, such
            as analytics providers.
          </Text>

          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            We use your Personal Information for the following purposes:
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>To provide and maintain the
            App.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>To notify you about changes to
            the App.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>To allow you to participate in
            interactive features.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>To provide customer support.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>To gather analysis or valuable
            information to improve the App.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>To monitor App usage and for
            internal analytics.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>To detect, prevent, and address
            technical issues.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>To comply with legal
            obligations.
          </Text>

          <Text style={styles.sectionTitle}>Sharing of Information</Text>
          <Text style={styles.paragraph}>
            We may share your Personal Information in the following situations:
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>With Service Providers: We may
            share with vendors who perform services on our behalf.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>For Business Transfers: We may
            share or transfer in connection with mergers, acquisitions, or
            sales.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>With Affiliates: We may share
            with our affiliates for internal purposes.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>With Business Partners: We may
            share for joint promotions or co-branded services.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>With Your Consent: We may
            disclose when you authorize us to do so.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>For Legal Purposes: We may
            disclose to comply with laws or protect rights.
          </Text>

          <Text style={styles.sectionTitle}>Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain Personal Information for as long as necessary to fulfill
            the purposes outlined in this Privacy Policy, unless a longer
            retention period is required or permitted by law.
          </Text>

          <Text style={styles.sectionTitle}>Your Rights and Choices</Text>
          <Text style={styles.paragraph}>
            Depending on your location, you may have the following rights
            regarding your Personal Information:
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>Access: Request access to your
            Personal Information.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>Correction: Request correction
            of inaccurate information.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>Deletion: Request deletion of
            your Personal Information.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>Opt-Out: Opt out of certain
            data processing activities.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bullet}>• </Text>Do Not Sell My Personal
            Information: If applicable under CCPA/CPRA.
          </Text>
          <Text style={styles.paragraph}>
            To exercise these rights, contact us at support@marinaapp.com. We
            will respond to verifiable requests within the time required by law.
          </Text>

          <Text style={styles.sectionTitle}>Security of Information</Text>
          <Text style={styles.paragraph}>
            We use administrative, technical, and physical security measures to
            protect your Personal Information. However, no method of
            transmission over the Internet is 100% secure.
          </Text>

          <Text style={styles.sectionTitle}>Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Our App is not intended for children under 13 years of age. We do
            not knowingly collect Personal Information from children under 13.
            If we learn we have collected such information, we will delete it.
          </Text>

          <Text style={styles.sectionTitle}>
            Changes to This Privacy Policy
          </Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Effective Date" at the top.
          </Text>
          <Text style={styles.paragraph}>
            We encourage you to review this Privacy Policy periodically.
          </Text>

          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions about this Privacy Policy, contact us at:
          </Text>
          <Text style={styles.paragraph}>MARINA Inc.</Text>
          <Text style={styles.paragraph}>support@marinaapp.com</Text>
          <Text style={styles.paragraph}>[Your Mailing Address]</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "hsl(210, 100%, 20%)",
    textAlign: "center",
    marginBottom: 10,
  },
  effectiveDate: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "hsl(210, 100%, 20%)",
    marginTop: 20,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "hsl(210, 100%, 20%)",
    marginTop: 15,
    marginBottom: 5,
  },
  paragraph: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 10,
  },
  bullet: {
    fontWeight: "bold",
  },
});
