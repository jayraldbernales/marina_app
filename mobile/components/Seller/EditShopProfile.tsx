import React, { useEffect, useState, useCallback } from "react";
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
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../constants";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Location from "expo-location"; // ADDED

// Barangay data for Mabini, Bohol
const BARANGAYS = [
  "Abaca",
  "Abad Santos",
  "Aguipo",
  "Concepcion (Banlas)",
  "Baybayon",
  "Bulawan",
  "Cabidian",
  "Cawayanan",
  "Del Mar",
  "Lungsoda-an",
  "Marcelo",
  "Minol",
  "Paraiso",
  "Poblacion I",
  "Poblacion II",
  "San Isidro",
  "San Jose",
  "San Rafael",
  "San Roque (Cabulao)",
  "Tambo",
  "Tangkigan",
  "Valaga",
];

const EditShopProfile = () => {
  const [form, setForm] = useState({
    shop_name: "",
    gcash_number: "",
    gcash_name: "",
    avatar_url: "",
  });

  // Address state
  const [addressData, setAddressData] = useState({
    address_id: "",
    barangay: "",
    purok: "",
    municipality: "Mabini, Bohol",
    full_address: "",
    is_default: false,
  });

  // NEW: Coordinate state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // NEW: Request location permission on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // NEW: Function to request location permission
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === "granted");

      if (status !== "granted") {
        Alert.alert(
          "Location Permission",
          "We need location permission to convert your business address to coordinates for accurate rider matching. You can enable it in settings.",
          [
            { text: "Later", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
      setLocationPermission(false);
    }
  };

  // NEW: Geocode address to get coordinates
  const geocodeAddress = useCallback(
    async (fullAddr: string) => {
      if (!fullAddr) return;

      // Check if we have permission
      if (!locationPermission) {
        console.log("No location permission, skipping geocoding");
        return;
      }

      try {
        setIsGeocoding(true);
        const results = await Location.geocodeAsync(fullAddr);

        if (results && results.length > 0) {
          const { latitude, longitude } = results[0];
          setLatitude(latitude);
          setLongitude(longitude);
        }
      } catch (error: any) {
        console.error("Geocoding error:", error);
        if (error.message?.includes("Not authorized")) {
          setLocationPermission(false);
        }
      } finally {
        setIsGeocoding(false);
      }
    },
    [locationPermission],
  );

  useEffect(() => {
    loadShopProfile();
  }, []);

  const loadShopProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const userId = session.user.id;

      // Load vendor profile
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendor_profiles")
        .select("shop_name, avatar_url, gcash_number, gcash_name, created_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (vendorError) console.warn("vendor load error", vendorError);

      // Load business address
      const { data: address, error: addressError } = await supabase
        .from("addresses")
        .select(
          "address_id, full_address, purok, barangay, municipality, is_default, latitude, longitude", // ADDED latitude, longitude
        )
        .eq("user_id", userId)
        .eq("address_type", "business")
        .limit(1)
        .maybeSingle();

      if (addressError) console.warn("address load error", addressError);

      // Parse full_address if it exists to extract barangay and purok
      let barangay = address?.barangay || "";
      let purok = address?.purok || "";
      let municipality = address?.municipality || "Mabini, Bohol";

      setForm((prev) => ({
        ...prev,
        shop_name: vendorData?.shop_name ?? "",
        gcash_number: vendorData?.gcash_number ?? "",
        gcash_name: vendorData?.gcash_name ?? "",
        avatar_url: vendorData?.avatar_url ?? "",
      }));

      setAddressData({
        address_id: address?.address_id || "",
        barangay,
        purok,
        municipality,
        full_address: address?.full_address || "",
        is_default: address?.is_default || false,
      });

      // NEW: Set coordinates if they exist
      setLatitude(address?.latitude || null);
      setLongitude(address?.longitude || null);
    } catch (err) {
      console.error("Error loading shop profile:", err);
      Alert.alert("Error", "Failed to load shop profile");
    } finally {
      setLoading(false);
    }
  };

  // Generate full address from components
  const generateFullAddress = (barangay: string, purok: string) => {
    if (barangay && purok) {
      return `${purok}, ${barangay}, Mabini, Bohol`;
    }
    return "";
  };

  // Handle barangay selection
  const handleBarangaySelect = (selectedBarangay: string) => {
    setAddressData((prev) => {
      const fullAddr = generateFullAddress(selectedBarangay, prev.purok);
      // NEW: Trigger geocoding when address changes
      if (fullAddr && prev.purok) {
        geocodeAddress(fullAddr);
      }
      return {
        ...prev,
        barangay: selectedBarangay,
        full_address: fullAddr,
      };
    });
    setShowAddressModal(false);
    setSearchQuery("");
  };

  // Handle purok input
  const handlePurokChange = (text: string) => {
    const normalizedPurok = text.replace(/\s+/g, " ").trim();
    setAddressData((prev) => {
      const fullAddr = generateFullAddress(prev.barangay, normalizedPurok);
      // NEW: Trigger geocoding when address changes
      if (fullAddr && prev.barangay) {
        geocodeAddress(fullAddr);
      }
      return {
        ...prev,
        purok: text,
        full_address: fullAddr,
      };
    });
  };

  // Filter barangays based on search
  const getFilteredBarangays = () => {
    if (!searchQuery) return BARANGAYS;
    return BARANGAYS.filter((barangay) =>
      barangay.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  const updateVendorProfile = async (
    userId: string,
    updates: any,
    isFullSave = false,
  ) => {
    if (isFullSave) {
      const payload: any = {
        user_id: userId,
        shop_name: updates.shop_name?.trim(),
        avatar_url: updates.avatar_url,
        gcash_number: updates.gcash_number?.trim(),
        gcash_name: updates.gcash_name?.trim(),
      };

      if (!payload.shop_name) {
        throw new Error("Shop name is required");
      }

      const { data, error } = await supabase
        .from("vendor_profiles")
        .upsert(payload);
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .update(updates)
        .eq("user_id", userId);

      if (error) throw error;
      return data;
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const userId = session.user.id;
      const path = `vendors/${userId}/avatar.jpg`;

      const manipulated = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const response = await fetch(manipulated.uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

      await updateVendorProfile(userId, { avatar_url: publicUrl }, false);
      setForm((prev) => ({ ...prev, avatar_url: publicUrl }));
      Alert.alert("Success", "Shop photo updated");
    } catch (err: any) {
      console.error("Upload error:", err);
      Alert.alert("Error", err.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

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

  const validateGcashNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length > 11) {
      return cleaned.substring(0, 11);
    }
    return cleaned;
  };

  const handleGcashNumberChange = (text: string) => {
    const validatedNumber = validateGcashNumber(text);
    setForm((prev) => ({ ...prev, gcash_number: validatedNumber }));
  };

  const handleGcashNameChange = (text: string) => {
    setForm((prev) => ({ ...prev, gcash_name: text }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const userId = session.user.id;

      // Validate shop name
      if (!form.shop_name.trim()) {
        Alert.alert("Validation", "Shop name is required");
        setSaving(false);
        return;
      }

      // Validate GCash number if provided
      const cleanedGcash = form.gcash_number.replace(/\D/g, "");
      if (form.gcash_number && cleanedGcash.length !== 11) {
        Alert.alert("Validation", "GCash number must be exactly 11 digits");
        setSaving(false);
        return;
      }

      // Validate address
      if (!addressData.barangay || !addressData.purok) {
        Alert.alert("Validation", "Barangay and Purok are required");
        setSaving(false);
        return;
      }

      // Update vendor profile
      await updateVendorProfile(userId, form, true);

      // Upsert business address with coordinates
      const addrPayload = {
        user_id: userId,
        full_address: addressData.full_address,
        purok: addressData.purok.trim(),
        barangay: addressData.barangay,
        municipality: addressData.municipality,
        address_type: "business",
        is_default: false,
        latitude: latitude, // NEW: Add coordinates
        longitude: longitude, // NEW: Add coordinates
      };

      if (addressData.address_id) {
        const { error: addrError } = await supabase
          .from("addresses")
          .update(addrPayload)
          .eq("address_id", addressData.address_id);
        if (addrError) throw addrError;
      } else {
        const { error: insertErr } = await supabase
          .from("addresses")
          .insert(addrPayload);
        if (insertErr) throw insertErr;
      }

      Alert.alert("Success", "Shop profile updated");
      router.back();
    } catch (err: any) {
      console.error("Save error:", err);
      Alert.alert("Error", err.message || "Failed to update shop profile");
    } finally {
      setSaving(false);
    }
  };

  const renderImageSourceModal = () => (
    <Modal
      transparent
      visible={showImageSourceModal}
      animationType="slide"
      onRequestClose={() => setShowImageSourceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Shop Photo</Text>
            <TouchableOpacity
              onPress={() => setShowImageSourceModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Choose how you want to update your shop photo
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

  const renderAddressModal = () => (
    <Modal
      visible={showAddressModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddressModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Barangay</Text>
            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search barangay..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          <ScrollView style={styles.modalList}>
            {getFilteredBarangays().map((barangay) => (
              <TouchableOpacity
                key={barangay}
                style={[
                  styles.dropdownItem,
                  addressData.barangay === barangay &&
                    styles.dropdownItemSelected,
                ]}
                onPress={() => handleBarangaySelect(barangay)}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    addressData.barangay === barangay &&
                      styles.dropdownItemTextSelected,
                  ]}
                >
                  {barangay}
                </Text>
                {addressData.barangay === barangay && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={COLORS.light.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
            {getFilteredBarangays().length === 0 && (
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>No barangays found</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowAddressModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
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
        <View style={styles.headerBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Shop</Text>
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
              style={styles.changePhotoButton}
              onPress={() => setShowImageSourceModal(true)}
            >
              <Text style={styles.changePhotoText}>Change Shop Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Shop Information */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Shop Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shop Name</Text>
              <TextInput
                value={form.shop_name}
                onChangeText={(t) => setForm((p) => ({ ...p, shop_name: t }))}
                style={styles.input}
                placeholder="Enter shop name"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>GCash Account Name</Text>
              <TextInput
                value={form.gcash_name}
                onChangeText={handleGcashNameChange}
                style={styles.input}
                placeholder="e.g., Juan Dela Cruz"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>GCash Number</Text>
              <TextInput
                value={form.gcash_number}
                onChangeText={handleGcashNumberChange}
                style={styles.input}
                placeholder="09XXXXXXXXX"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>
          </View>

          {/* Business Address */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Business Address</Text>

            {/* Municipality */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Municipality</Text>
              <View style={styles.readOnlyContainer}>
                <Text style={styles.readOnlyText}>Mabini, Bohol</Text>
              </View>
            </View>

            {/* Barangay */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Barangay *</Text>
              <TouchableOpacity
                style={styles.addressSelector}
                onPress={() => setShowAddressModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.addressSelectorContent}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={COLORS.light.primary}
                  />
                  <Text
                    style={[
                      styles.addressSelectorText,
                      !addressData.barangay &&
                        styles.addressSelectorPlaceholder,
                    ]}
                  >
                    {addressData.barangay || "-- Select Barangay --"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </TouchableOpacity>
              {!addressData.barangay && (
                <Text style={styles.errorText}>Barangay is required</Text>
              )}
            </View>

            {/* Purok */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purok / Sitio *</Text>
              <TextInput
                style={[styles.input, !addressData.purok && styles.inputError]}
                placeholder="e.g., Purok 1, Near Total Gasoline Station"
                value={addressData.purok}
                onChangeText={handlePurokChange}
                placeholderTextColor="#999"
                maxLength={100}
              />
              {!addressData.purok && (
                <Text style={styles.errorText}>Purok is required</Text>
              )}
              <Text style={styles.helperText}>
                Enter your specific purok, sitio, or nearby landmark
              </Text>
            </View>

            {/* NEW: Permission warning */}
            {locationPermission === false && (
              <View style={styles.permissionWarning}>
                <Ionicons name="warning" size={16} color="#f59e0b" />
                <Text style={styles.permissionWarningText}>
                  Enable location permission for accurate rider matching
                </Text>
                <TouchableOpacity
                  onPress={requestLocationPermission}
                  style={styles.permissionButton}
                >
                  <Text style={styles.permissionButtonText}>Enable</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* NEW: Geocoding status */}
            {isGeocoding && (
              <View style={styles.geocodingContainer}>
                <ActivityIndicator size="small" color={COLORS.light.primary} />
                <Text style={styles.geocodingText}>Getting coordinates...</Text>
              </View>
            )}

            {/* Full Address Preview */}
            {addressData.barangay && addressData.purok && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>
                  Business address will be:
                </Text>
                <Text style={styles.previewAddress}>
                  {addressData.full_address}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderImageSourceModal()}
      {renderAddressModal()}
    </SafeAreaView>
  );
};

export default EditShopProfile;

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
    paddingBottom: 48,
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
  inputError: {
    borderColor: "#ef4444",
  },
  readOnlyContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  readOnlyText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
  },
  addressSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  addressSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  addressSelectorText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  addressSelectorPlaceholder: {
    color: "#999",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
    fontStyle: "italic",
    marginLeft: 4,
  },
  previewContainer: {
    padding: 12,
    backgroundColor: "#e8f5f1",
    borderRadius: 8,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.light.oceanMedium,
    marginBottom: 4,
  },
  previewAddress: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.light.primary,
    lineHeight: 18,
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
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    marginVertical: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: "#333",
  },
  modalList: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemSelected: {
    backgroundColor: "#e0f2ed",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#333",
  },
  dropdownItemTextSelected: {
    color: COLORS.light.primary,
    fontWeight: "600",
  },
  emptyList: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyListText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  modalCancelButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    fontWeight: "600",
  },
  // NEW: Permission warning styles
  permissionWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  permissionWarningText: {
    fontSize: 12,
    color: "#D97706",
    flex: 1,
  },
  permissionButton: {
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  // NEW: Geocoding styles
  geocodingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  geocodingText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  coordinatesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
    backgroundColor: "#f0f9ff",
    padding: 8,
    borderRadius: 6,
  },
  coordinatesText: {
    fontSize: 12,
    color: COLORS.light.primary,
    fontFamily: "monospace",
  },
});
