import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export const SignupScreen = ({
  onNavigate,
}: {
  onNavigate: (screen: string) => void;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller" | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onNavigate("welcome")}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Account</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>I want to:</Text>
        <View style={styles.roleSelection}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              selectedRole === "buyer" && styles.roleButtonSelected,
            ]}
            onPress={() => setSelectedRole("buyer")}
          >
            <Text
              style={[
                styles.roleButtonText,
                selectedRole === "buyer" && styles.roleButtonTextSelected,
              ]}
            >
              🛒 Buy Seafood
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleButton,
              selectedRole === "seller" && styles.roleButtonSelected,
            ]}
            onPress={() => setSelectedRole("seller")}
          >
            <Text
              style={[
                styles.roleButtonText,
                selectedRole === "seller" && styles.roleButtonTextSelected,
              ]}
            >
              🐟 Sell Seafood
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.icon}>👤</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.icon}>📧</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.icon}>📞</Text>
          <TextInput
            style={styles.input}
            placeholder="+63 9XX XXX XXXX"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.icon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={(text) =>
              setFormData({ ...formData, password: text })
            }
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Text>{showPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.icon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            secureTextEntry={!showPassword}
            value={formData.confirmPassword}
            onChangeText={(text) =>
              setFormData({ ...formData, confirmPassword: text })
            }
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.termsText}>
          By creating an account, you agree to our Terms of Service and Privacy
          Policy.
        </Text>

        <TouchableOpacity
          style={[
            styles.signupButton,
            !selectedRole && styles.signupButtonDisabled,
          ]}
          disabled={!selectedRole}
          onPress={() => {
            if (selectedRole === "buyer") {
              onNavigate("buyer-dashboard");
            } else if (selectedRole === "seller") {
              onNavigate("seller-dashboard");
            }
          }}
        >
          <Text style={styles.signupButtonText}>Create Account</Text>
        </TouchableOpacity>

        <View style={styles.loginLinkWrapper}>
          <Text style={styles.loginLinkText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => onNavigate("login")}>
            <Text style={styles.loginLinkButton}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    color: "#00BFFF",
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#004E7C",
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: "#004E7C",
    marginBottom: 8,
    fontWeight: "500",
  },
  roleSelection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#00BFFF",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  roleButtonSelected: {
    backgroundColor: "#00BFFF",
  },
  roleButtonText: {
    color: "#00BFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  roleButtonTextSelected: {
    color: "white",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#00BFFF",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 8,
    fontSize: 18,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: "#000",
  },
  eyeButton: {
    padding: 4,
  },
  termsText: {
    fontSize: 12,
    color: "#004E7C",
    textAlign: "center",
    marginBottom: 20,
  },
  signupButton: {
    backgroundColor: "#00BFFF",
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  signupButtonDisabled: {
    opacity: 0.5,
  },
  signupButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  loginLinkWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  loginLinkText: {
    color: "#004E7C",
    fontSize: 14,
  },
  loginLinkButton: {
    color: "#00BFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
