import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import { PrimaryButton } from "../components/ui/buttons/PrimaryButton";
import { showError, showSuccess } from "../lib/toast";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ResetPasswordScreen() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  /**
   * Check if user has an active session (from email link)
   * Supabase automatically establishes session when email link is clicked
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session check error:", error);
          showError("Session expired. Please request a new reset link.");
          return;
        }

        if (session) {
          setHasSession(true);
        } else {
          showError(
            "No active recovery session. Please click the link in your email."
          );
        }
      } catch (err: any) {
        console.error("Error checking session:", err);
        showError("Failed to verify session");
      } finally {
        setInitializing(false);
      }
    };

    checkSession();
  }, []);

  const handleResetPassword = async () => {
    // Validate inputs
    if (!password.trim()) {
      showError("Please enter a new password");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        showError(error.message || "Failed to update password");
        return;
      }

      showSuccess("Password updated successfully!");
      await supabase.auth.signOut();
      router.replace("/login");
    } catch (err: any) {
      console.error("Reset error:", err);
      showError(err?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Verifying reset link...</Text>
      </View>
    );
  }

  if (!hasSession) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Session Expired</Text>
        <Text style={styles.errorMessage}>
          Your password reset link is no longer valid. Please request a new one.
        </Text>
        <PrimaryButton
          title="Request New Reset Link"
          onPress={() => router.replace("/forgot-password")}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Password</Text>
      <Text style={styles.subtitle}>
        Enter a secure password for your account
      </Text>

      {/* Password Input */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          secureTextEntry={!showPassword}
          placeholder="New password"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          placeholderTextColor="#999"
        />
        <Pressable onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#666"
          />
        </Pressable>
      </View>

      {/* Confirm Password Input */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          secureTextEntry={!showPassword}
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!loading}
          placeholderTextColor="#999"
        />
      </View>

      <PrimaryButton
        title={loading ? "Updating..." : "Reset Password"}
        onPress={handleResetPassword}
        disabled={loading}
        isLoading={loading}
      />

      <Pressable onPress={() => router.replace("/login")}>
        <Text style={styles.backLink}>Back to Login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
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
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#d32f2f",
  },
  errorMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  backLink: {
    marginTop: 16,
    textAlign: "center",
    color: "#0066cc",
    fontSize: 14,
    fontWeight: "500",
  },
});
