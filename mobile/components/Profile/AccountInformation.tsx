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
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../constants";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

type ProfileForm = {
  full_name: string;
  email: string;
  avatar_url: string;
  mobile_number: string;
};

type Address = {
  address_id: string;
  full_address: string;
  purok: string;
  barangay: string;
  municipality: string;
  address_type: string;
  is_default: boolean;
};

const AccountInformation = () => {
  const [form, setForm] = useState<ProfileForm>({
    full_name: "",
    email: "",
    avatar_url: "",
    mobile_number: "",
  });
  const [homeAddress, setHomeAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);

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
        throw new Error("User not authenticated");
      }

      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, mobile_number")
        .eq("user_id", session.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Load DEFAULT address (regardless of type - home OR work)
      const { data: defaultAddressData, error: defaultAddressError } =
        await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("is_default", true)
          .in("address_type", ["home", "work"]) // Only home or work addresses
          .limit(1)
          .single();

      // If no default address, fall back to home address
      let displayAddress = null;
      if (defaultAddressData) {
        displayAddress = defaultAddressData;
      } else {
        // Fallback: Get home address if no default is set
        const { data: homeAddressData, error: homeAddressError } =
          await supabase
            .from("addresses")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("address_type", "home")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (homeAddressError && homeAddressError.code !== "PGRST116") {
          // Ignore "no rows" error
          console.warn("Error loading home address:", homeAddressError);
        }

        displayAddress = homeAddressData || null;
      }

      setForm({
        full_name: profileData?.full_name ?? "",
        avatar_url: profileData?.avatar_url ?? "",
        email: session.user.email ?? "",
        mobile_number: profileData?.mobile_number ?? "", // FIX: Ensure empty string instead of null
      });
      setHomeAddress(displayAddress);
    } catch (err) {
      console.error("Error loading profile:", err);
      Alert.alert("Error", "Failed to load account information");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (
    userId: string,
    updates: Partial<ProfileForm>,
  ) => {
    // FIX: Only include mobile_number if it has a value, don't set it to null
    const updateData: any = {
      user_id: userId,
      full_name: updates.full_name?.trim(),
      avatar_url: updates.avatar_url,
    };

    // Only include mobile_number if it's not empty
    if (updates.mobile_number && updates.mobile_number.trim() !== "") {
      updateData.mobile_number = updates.mobile_number.trim();
    }
    // If mobile_number is explicitly set to empty string, keep it as empty string
    else if (updates.mobile_number === "") {
      updateData.mobile_number = "";
    }

    const { data, error } = await supabase.from("profiles").upsert(updateData);

    if (error) {
      throw error; // Let caller handle
    }

    return data;
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      const userId = session.user.id;
      const path = `users/${userId}/avatar.jpg`; // Fixed path for standardization

      // Compress and convert to JPEG
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [], // No resizing or other manipulations
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );

      const response = await fetch(manipulated.uri);
      const arrayBuffer = await response.arrayBuffer();

      // Upload (upsert to overwrite if same path)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, arrayBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL - add timestamp to prevent caching
      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;
      if (!publicUrl) {
        throw new Error("Failed to generate public URL");
      }

      // Update profile
      await updateProfile(userId, { avatar_url: publicUrl });

      // Update local state and force image refresh
      setForm((prev) => ({ ...prev, avatar_url: publicUrl }));
      Alert.alert("Success", "Profile photo updated");
    } catch (err: any) {
      console.error("Upload error:", err);
      Alert.alert("Error", err.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== "granted" || libraryStatus !== "granted") {
        console.warn("Camera/gallery permissions not granted");
      }
    })();
  }, []);

  const takePhoto = async () => {
    setShowImageSourceModal(false);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        aspect: [1, 1],
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Camera error:", err);
      Alert.alert("Error", "Unable to take photo");
    }
  };

  const pickFromGallery = async () => {
    setShowImageSourceModal(false);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        aspect: [1, 1],
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Gallery error:", err);
      Alert.alert("Error", "Unable to pick image from gallery");
    }
  };

  // FIX: Add mobile number validation
  const validateMobileNumber = (number: string) => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, "");

    // Check if it's exactly 11 digits
    if (cleaned.length > 11) {
      return cleaned.substring(0, 11);
    }

    return cleaned;
  };

  const handleMobileNumberChange = (text: string) => {
    const validatedNumber = validateMobileNumber(text);
    setForm((prev) => ({ ...prev, mobile_number: validatedNumber }));
  };

  const handleSave = async () => {
    const trimmedFullName = form.full_name.trim();
    if (!trimmedFullName) {
      Alert.alert("Validation", "Full name is required");
      return;
    }

    // Validate mobile number length
    const cleanedMobile = form.mobile_number.replace(/\D/g, "");
    if (cleanedMobile && cleanedMobile.length !== 11) {
      Alert.alert("Validation", "Mobile number must be exactly 11 digits");
      return;
    }

    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      await updateProfile(session.user.id, {
        full_name: trimmedFullName,
        avatar_url: form.avatar_url,
        mobile_number: form.mobile_number,
      });

      Alert.alert("Success", "Profile updated successfully");
      router.back();
    } catch (error: any) {
      console.error("Save error:", error.message || error);
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleNavigateToAddress = () => {
    router.push("/buyer/address-management");
  };

  const renderImageSourceModal = () => (
    <Modal
      transparent={true}
      visible={showImageSourceModal}
      animationType="slide"
      onRequestClose={() => setShowImageSourceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Profile Photo</Text>
            <TouchableOpacity
              onPress={() => setShowImageSourceModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Choose how you want to update your profile photo
          </Text>

          <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
            <View style={styles.modalOptionIconContainer}>
              <Ionicons
                name="camera-outline"
                size={28}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.modalOptionTextContainer}>
              <Text style={styles.modalOptionTitle}>Take Photo</Text>
              <Text style={styles.modalOptionDescription}>
                Use your camera to take a new photo
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={pickFromGallery}
          >
            <View style={styles.modalOptionIconContainer}>
              <Ionicons
                name="images-outline"
                size={28}
                color={COLORS.light.primary}
              />
            </View>
            <View style={styles.modalOptionTextContainer}>
              <Text style={styles.modalOptionTitle}>Choose from Gallery</Text>
              <Text style={styles.modalOptionDescription}>
                Select a photo from your device
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowImageSourceModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
          {/* Avatar Section */}
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                onPress={() => setShowImageSourceModal(true)}
                activeOpacity={0.8}
                style={styles.avatarWrapper}
              >
                <Image
                  source={
                    form.avatar_url
                      ? { uri: form.avatar_url }
                      : require("../../assets/img/user.jpg")
                  }
                  style={styles.avatar}
                />

                {uploading ? (
                  <View style={styles.avatarBadge}>
                    <ActivityIndicator color="#fff" size="small" />
                  </View>
                ) : (
                  <View style={styles.avatarBadge}>
                    <Ionicons name="camera" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.changePhotoButton}
              onPress={() => setShowImageSourceModal(true)}
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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                value={form.mobile_number}
                onChangeText={handleMobileNumberChange}
                style={styles.input}
                placeholder="09XXXXXXXXX"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>
          </View>

          {/* Home Address Section */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {homeAddress?.is_default ? "Default Address" : "Home Address"}
            </Text>
            <TouchableOpacity
              onPress={handleNavigateToAddress}
              style={styles.addressInputContainer}
              activeOpacity={0.8}
            >
              <View style={styles.addressInputContent}>
                <Ionicons
                  name={
                    homeAddress?.address_type === "work"
                      ? "business"
                      : "location-outline"
                  }
                  size={20}
                  color={COLORS.light.primary}
                  style={styles.addressIcon}
                />
                <View style={styles.addressTextContainer}>
                  {homeAddress ? (
                    <>
                      <Text style={styles.addressLabel}>
                        {homeAddress.address_type === "work"
                          ? "Work Address "
                          : "Home Address "}
                        {homeAddress.is_default && (
                          <Text style={styles.defaultBadge}> Default</Text>
                        )}
                      </Text>
                      <Text style={styles.addressText} numberOfLines={2}>
                        {homeAddress.full_address || "No address specified"}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.addressLabel}>No Address Set</Text>
                      <Text style={styles.addressPlaceholder}>
                        Tap to add your delivery address
                      </Text>
                    </>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </TouchableOpacity>
            <Text style={styles.addressHelperText}>
              {homeAddress?.is_default
                ? "Your default address is used for deliveries"
                : "Your home address is shown here. Set a default address for faster checkout."}
            </Text>
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
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Source Modal */}
      {renderImageSourceModal()}
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
  addressInputContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fafafa",
    overflow: "hidden",
  },
  addressInputContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  addressIcon: {
    marginRight: 12,
  },
  addressTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 18,
  },
  addressPlaceholder: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  defaultBadge: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.light.primary,
    backgroundColor: "#e0f2ed",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  addressHelperText: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
    fontStyle: "italic",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalOptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0f2ed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalOptionTextContainer: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginBottom: 2,
  },
  modalOptionDescription: {
    fontSize: 12,
    color: "#64748b",
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
});
