import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { supabase } from "../lib/supabase";
import { PrimaryButton } from "../components/ui/buttons/PrimaryButton";
import { showError, showSuccess } from "../lib/toast";
import { useRouter } from "expo-router";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSendReset = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      showError("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo: "marina://reset-password",
        }
      );

      if (error) {
        showError(error.message || "Failed to send reset email");
        return;
      }

      setSubmitted(true);
      showSuccess("Reset link sent! Check your email.");
    } catch (err: any) {
      console.error("Reset email error:", err);
      showError(err?.message || "Failed to send reset email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successMessage}>
            We've sent a password reset link to {email}
          </Text>
          <Text style={styles.successSubtext}>
            Click the link to reset your password. The link will expire in 24
            hours.
          </Text>
        </View>

        <PrimaryButton
          title="Back to Login"
          onPress={() => router.replace("/login")}
        />

        <Pressable onPress={() => setSubmitted(false)}>
          <Text style={styles.tryAgain}>Didn't receive email? Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Reset Your Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your
          password.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
      </View>

      <View>
        <PrimaryButton
          title={loading ? "Sending..." : "Send Reset Link"}
          onPress={handleSendReset}
          disabled={loading}
          isLoading={loading}
        />

        <Pressable onPress={() => router.replace("/login")}>
          <Text style={styles.backLink}>Back to Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 0,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#000",
  },
  backLink: {
    marginTop: 16,
    textAlign: "center",
    color: "#0066cc",
    fontSize: 14,
    fontWeight: "500",
  },
  successBox: {
    alignItems: "center",
    paddingVertical: 32,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#000",
  },
  successMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  successSubtext: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
  },
  tryAgain: {
    marginTop: 16,
    textAlign: "center",
    color: "#0066cc",
    fontSize: 14,
    fontWeight: "500",
  },
});
