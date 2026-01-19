import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../constants";

type ProfileForm = {
  full_name: string;
  email: string;
  avatar_url: string;
};

type Address = {
  id: string;
  label: string;
  address: string;
  isEditing?: boolean;
};

const AccountInformation = () => {
  const [form, setForm] = useState<ProfileForm>({
    full_name: "",
    email: "",
    avatar_url: "",
  });

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", session.user.id)
        .single();

      setForm({
        full_name: data?.full_name ?? "",
        avatar_url: data?.avatar_url ?? "",
        email: session.user.email ?? "",
      });

      // TEMP addresses (can be connected to DB later)
      setAddresses([
        {
          id: "1",
          label: "Home",
          address: "Barangay Poblacion, Mabini, Bohol",
        },
      ]);
    } catch (err) {
      Alert.alert("Error", "Failed to load account information");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      Alert.alert("Validation", "Full name is required");
      return;
    }

    try {
      setSaving(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      await supabase.from("profiles").upsert({
        user_id: session.user.id,
        full_name: form.full_name.trim(),
        avatar_url: form.avatar_url,
        updated_at: new Date().toISOString(),
      });

      Alert.alert("Success", "Profile updated successfully");
      router.back();
    } catch {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const addAddress = () => {
    const newAddress: Address = {
      id: Date.now().toString(),
      label: "",
      address: "",
      isEditing: true,
    };
    setAddresses((prev) => [...prev, newAddress]);
  };

  const updateAddress = (
    id: string,
    field: "label" | "address",
    value: string,
  ) => {
    setAddresses((prev) =>
      prev.map((addr) => (addr.id === id ? { ...addr, [field]: value } : addr)),
    );
  };

  const toggleEditAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) =>
        addr.id === id ? { ...addr, isEditing: !addr.isEditing } : addr,
      ),
    );
  };

  const removeAddress = (id: string) => {
    Alert.alert(
      "Remove Address",
      "Are you sure you want to remove this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            setAddresses((prev) => prev.filter((a) => a.id !== id)),
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.light.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section - Now Centered */}
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={
                    form.avatar_url
                      ? { uri: form.avatar_url }
                      : require("../../assets/img/user.jpg")
                  }
                  style={styles.avatar}
                />
                <View style={styles.avatarBadge}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.changePhotoButton}
            >
              <Text style={styles.changePhotoText}>Change Profile Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                value={form.full_name}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, full_name: text }))
                }
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.disabledInputContainer}>
                <TextInput
                  value={form.email}
                  editable={false}
                  style={[styles.input, styles.disabledInput]}
                />
                <Ionicons name="lock-closed" size={16} color="#999" />
              </View>
              <Text style={styles.helperText}>
                Email cannot be changed for security reasons
              </Text>
            </View>
          </View>

          {/* Saved Addresses */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Saved Addresses</Text>
              <TouchableOpacity onPress={addAddress} activeOpacity={0.7}>
                <Ionicons
                  name="add-circle"
                  size={24}
                  color={COLORS.light.primary}
                />
              </TouchableOpacity>
            </View>

            {addresses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>No saved addresses</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add an address to save it for future orders
                </Text>
              </View>
            ) : (
              addresses.map((item) => (
                <View key={item.id} style={styles.addressCard}>
                  {item.isEditing ? (
                    <>
                      <TextInput
                        value={item.label}
                        onChangeText={(text) =>
                          updateAddress(item.id, "label", text)
                        }
                        placeholder="Address Label (e.g., Home, Work)"
                        placeholderTextColor="#999"
                        style={[styles.input, { marginBottom: 8 }]}
                      />
                      <TextInput
                        value={item.address}
                        onChangeText={(text) =>
                          updateAddress(item.id, "address", text)
                        }
                        placeholder="Full address"
                        placeholderTextColor="#999"
                        style={styles.input}
                        multiline
                      />
                    </>
                  ) : (
                    <View style={styles.addressContent}>
                      <View style={styles.addressIcon}>
                        <Ionicons
                          name="location"
                          size={20}
                          color={COLORS.light.primary}
                        />
                      </View>
                      <View style={styles.addressInfo}>
                        <Text style={styles.addressLabel}>{item.label}</Text>
                        <Text style={styles.addressText}>{item.address}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.addressActions}>
                    <TouchableOpacity
                      onPress={() => toggleEditAddress(item.id)}
                      style={styles.iconButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={item.isEditing ? "checkmark" : "create-outline"}
                        size={20}
                        color={COLORS.light.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeAddress(item.id)}
                      style={styles.iconButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#e53935"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.saveText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AccountInformation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  // Centered Avatar Styles
  avatarContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
    borderWidth: 3,
    borderColor: COLORS.light.primary,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.light.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  changePhotoButton: {
    alignItems: "center",
  },
  changePhotoText: {
    color: COLORS.light.primary,
    fontSize: 14,
    fontWeight: "600",
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#333",
  },
  disabledInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  disabledInput: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    color: "#666",
  },
  helperText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  addressCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  addressContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  addressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e0f2ed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.light.primary,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    shadowColor: COLORS.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
