import React from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../constants";
import { useRouter } from "expo-router";

export const TermsScreen = () => {
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
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.lastUpdated}>
            Last updated: November 22, 2025
          </Text>

          <Text style={styles.sectionTitle}>
            Interpretation and Definitions
          </Text>
          <Text style={styles.sectionSubtitle}>Interpretation</Text>
          <Text style={styles.paragraph}>
            The words of which the initial letter is capitalized have meanings
            defined under the following conditions. The following definitions
            shall have the same meaning regardless of whether they appear in
            singular or in plural.
          </Text>

          <Text style={styles.sectionSubtitle}>Definitions</Text>
          <Text style={styles.paragraph}>
            For the purposes of these Terms and Conditions:
          </Text>
          <Text style={styles.definition}>
            - "Application" means the software program provided by the Company
            downloaded by You on any electronic device, named "MARINA"
          </Text>
          <Text style={styles.definition}>
            - "Application Store" means the digital distribution service
            operated and developed by Apple Inc. (Apple App Store) or Google
            Inc. (Google Play Store) in which the Application has been
            downloaded.
          </Text>
          <Text style={styles.definition}>
            - "Affiliate" means an entity that controls, is controlled by or is
            under common control with a party, where "control" means ownership
            of 50% or more of the shares, equity interest or other securities
            entitled to vote for election of directors or other managing
            authority.
          </Text>
          <Text style={styles.definition}>
            - "Account" means a unique account created for You to access our
            Service or parts of our Service.
          </Text>
          <Text style={styles.definition}>
            - "Company" (referred to as either "the Company", "We", "Us" or
            "Our" in this Agreement) refers to MARINA Inc..
          </Text>
          <Text style={styles.definition}>
            - "Country" refers to United States.
          </Text>
          <Text style={styles.definition}>
            - "Content" refers to content such as text, images, or other
            information that can be posted, uploaded, linked to or otherwise
            made available by You, regardless of the form of that content.
          </Text>
          <Text style={styles.definition}>
            - "Device" means any device that can access the Service such as a
            computer, a cellphone or a digital tablet.
          </Text>
          <Text style={styles.definition}>
            - "Feedback" means feedback, innovations or suggestions sent by You
            regarding the attributes, performance or features of our Service.
          </Text>
          <Text style={styles.definition}>
            - "Service" refers to the MARINA mobile application.
          </Text>
          <Text style={styles.definition}>
            - "Terms and Conditions" (also referred as "Terms") mean these Terms
            and Conditions that form the entire agreement between You and the
            Company regarding the use of the Service.
          </Text>
          <Text style={styles.definition}>
            - "Third-party Social Media Service" means any services or content
            (including data, information, products or services) provided by a
            third-party that may be displayed, included or made available by the
            Service.
          </Text>
          <Text style={styles.definition}>
            - "You" means the individual accessing or using the Service, or the
            company, or other legal entity on behalf of which such individual is
            accessing or using the Service, as applicable.
          </Text>

          <Text style={styles.sectionTitle}>Acknowledgment</Text>
          <Text style={styles.paragraph}>
            These are the Terms and Conditions governing the use of this Service
            and the agreement that operates between You and the Company. These
            Terms and Conditions set out the rights and obligations of all users
            regarding the use of the Service.
          </Text>
          <Text style={styles.paragraph}>
            Your access to and use of the Service is conditioned on Your
            acceptance of and compliance with these Terms and Conditions. These
            Terms and Conditions apply to all visitors, users and others who
            access or use the Service.
          </Text>
          <Text style={styles.paragraph}>
            By accessing or using the Service You agree to be bound by these
            Terms and Conditions. If You disagree with any part of these Terms
            and Conditions then You may not access the Service.
          </Text>
          <Text style={styles.paragraph}>
            You represent that you are over the age of 18. The Company does not
            permit those under 18 to use the Service.
          </Text>
          <Text style={styles.paragraph}>
            Your access to and use of the Service is also conditioned on Your
            acceptance of and compliance with the Privacy Policy of the Company.
            Our Privacy Policy describes Our policies and procedures on the
            collection, use and disclosure of Your personal information when You
            use the Application. Please read Our Privacy Policy carefully before
            using Our Service.
          </Text>

          <Text style={styles.sectionTitle}>User Accounts</Text>
          <Text style={styles.paragraph}>
            When You create an account with Us, You must provide Us information
            that is accurate, complete, and current at all times. Failure to do
            so constitutes a breach of the Terms, which may result in immediate
            termination of Your account on Our Service.
          </Text>
          <Text style={styles.paragraph}>
            You are responsible for safeguarding the password that You use to
            access the Service and for any activities or actions under Your
            password, whether Your password is with Our Service or a Third-Party
            Social Media Service.
          </Text>
          <Text style={styles.paragraph}>
            You agree not to disclose Your password to any third party. You must
            notify Us immediately upon becoming aware of any breach of security
            or unauthorized use of Your account.
          </Text>
          <Text style={styles.paragraph}>
            You may not use as a username the name of another person or entity
            or that is not lawfully available for use, a name or trademark that
            is subject to any rights of another person or entity other than You
            without appropriate authorization, or a name that is otherwise
            offensive, vulgar or obscene.
          </Text>

          <Text style={styles.sectionTitle}>Content</Text>
          <Text style={styles.sectionSubtitle}>Your Right to Post Content</Text>
          <Text style={styles.paragraph}>
            Our Service allows You to post Content. You are responsible for the
            Content that You post to the Service, including its legality,
            reliability, and appropriateness.
          </Text>
          <Text style={styles.paragraph}>
            By posting Content to the Service, You grant Us the right and
            license to use, modify, publicly perform, publicly display,
            reproduce, and distribute such Content on and through the Service.
            You retain any and all of Your rights to any Content You submit,
            post or display on or through the Service and You are responsible
            for protecting those rights.
          </Text>
          <Text style={styles.paragraph}>
            You represent and warrant that: (i) the Content is Yours (You own
            it) or You have the right to use it and grant Us the rights and
            license as provided in these Terms, and (ii) the posting of Your
            Content on or through the Service does not violate the privacy
            rights, publicity rights, copyrights, contract rights or any other
            rights of any person.
          </Text>

          <Text style={styles.sectionSubtitle}>Content Restrictions</Text>
          <Text style={styles.paragraph}>
            The Company is not responsible for the content of the Service's
            users. You expressly understand and agree that You are solely
            responsible for the Content and for all activity that occurs under
            your account, whether done so by You or any third person using Your
            account.
          </Text>
          <Text style={styles.paragraph}>
            You may not transmit any Content that is unlawful, offensive,
            upsetting, intended to disgust, threatening, libelous, defamatory,
            obscene or otherwise objectionable.
          </Text>

          {/* Add more sections as needed, but truncated for brevity */}
          <Text style={styles.sectionTitle}>Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            Notwithstanding any damages that You might incur, the entire
            liability of the Company and any of its suppliers under any
            provision of this Terms and Your exclusive remedy for all of the
            foregoing shall be limited to the amount actually paid by You
            through the Service or 100 USD if You haven't purchased anything
            through the Service.
          </Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by applicable law, in no event shall
            the Company or its suppliers be liable for any special, incidental,
            indirect, or consequential damages whatsoever (including, but not
            limited to, damages for loss of profits, loss of data or other
            information, for business interruption, for personal injury, loss of
            privacy arising out of or in any way related to the use of or
            inability to use the Service, third-party software and/or
            third-party hardware used with the Service, or otherwise in
            connection with any provision of this Terms), even if the Company or
            any supplier has been advised of the possibility of such damages and
            even if the remedy fails of its essential purpose.
          </Text>

          <Text style={styles.sectionTitle}>
            "AS IS" and "AS AVAILABLE" Disclaimer
          </Text>
          <Text style={styles.paragraph}>
            The Service is provided to You "AS IS" and "AS AVAILABLE" and with
            all faults and defects without warranty of any kind. To the maximum
            extent permitted under applicable law, the Company, on its own
            behalf and on behalf of its Affiliates and its and their respective
            licensors and service providers, expressly disclaims all warranties,
            whether express, implied, statutory or otherwise, with respect to
            the Service.
          </Text>

          <Text style={styles.contact}>
            For questions about these Terms, contact us at support@marinaapp.com
          </Text>
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
  lastUpdated: {
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
  definition: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 5,
    marginLeft: 10,
  },
  contact: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 30,
    padding: 20,
  },
});
