import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../constants";
import * as Location from "expo-location";

// Import your existing AddressForm component
import AddressForm from "../../components/registration/AddressForm";

// Update the Address type to include coordinates
type Address = {
  address_id: string;
  user_id: string;
  full_address: string;
  purok: string;
  barangay: string;
  municipality: string;
  address_type: string;
  is_default: boolean;
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
};

// Real data for Mabini, Bohol
const MUNICIPALITIES = [{ value: "Mabini, Bohol", label: "Mabini, Bohol" }];
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

const AddressManagement = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressType, setAddressType] = useState<"home" | "work">("home");
  const [isDefault, setIsDefault] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [formErrors, setFormErrors] = useState({
    municipality: false,
    barangay: false,
    purok: false,
  });

  // Address form state
  const [municipality, setMunicipality] = useState("Mabini, Bohol");
  const [barangay, setBarangay] = useState("");
  const [purok, setPurok] = useState("");
  const [address, setAddress] = useState("");

  // Coordinate state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Barangay selector modal state
  const [barangayModalVisible, setBarangayModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load addresses on mount
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      // Filter to only get home and work addresses
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", session.user.id)
        .in("address_type", ["home", "work"])
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAddresses(data || []);
    } catch (error) {
      console.error("Error loading addresses:", error);
      Alert.alert("Error", "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAddressType("home");
    setIsDefault(false);
    setUseCurrentLocation(false);
    setMunicipality("Mabini, Bohol");
    setBarangay("");
    setPurok("");
    setAddress("");
    setLatitude(null);
    setLongitude(null);
    setFormErrors({ municipality: false, barangay: false, purok: false });
    setEditingAddress(null);
  };

  const validateForm = (): boolean => {
    const errors = {
      municipality: !municipality,
      barangay: !barangay,
      purok: !purok.trim(),
    };

    setFormErrors(errors);

    if (errors.municipality || errors.barangay || errors.purok) {
      Alert.alert("Validation", "Please fill in all required fields");
      return false;
    }

    return true;
  };

  const getCurrentLocation = async () => {
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is needed to use this feature. You can enable it in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        setUseCurrentLocation(false);
        return;
      }

      setSaving(true);

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      setLatitude(latitude);
      setLongitude(longitude);
      setUseCurrentLocation(true);

      Alert.alert("Success", "Current location coordinates saved!");
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert(
        "Error",
        "Failed to get your current location. Please check your GPS connection.",
      );
      setUseCurrentLocation(false);
    } finally {
      setSaving(false);
    }
  };

  // Handle checkbox toggle
  const handleLocationCheckboxToggle = async () => {
    if (!useCurrentLocation) {
      // Trying to check - get location
      await getCurrentLocation();
    } else {
      // Unchecking - clear coordinates
      setLatitude(null);
      setLongitude(null);
      setUseCurrentLocation(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      // Prepare address data with coordinates (if useCurrentLocation is checked)
      const addressData: any = {
        user_id: session.user.id,
        full_address: address,
        purok: purok.trim(),
        barangay,
        municipality,
        address_type: addressType,
        is_default: isDefault,
        latitude: useCurrentLocation ? latitude : null,
        longitude: useCurrentLocation ? longitude : null,
      };

      let result;

      if (editingAddress) {
        // Update existing address
        const { data, error } = await supabase
          .from("addresses")
          .update(addressData)
          .eq("address_id", editingAddress.address_id)
          .select();

        if (error) throw error;
        result = data;
      } else {
        // Insert new address
        const { data, error } = await supabase
          .from("addresses")
          .insert([addressData])
          .select();

        if (error) throw error;
        result = data;
      }

      // If setting as default, update other addresses
      if (isDefault) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", session.user.id)
          .neq(
            "address_id",
            editingAddress?.address_id || result?.[0]?.address_id,
          );
      }

      Alert.alert(
        "Success",
        editingAddress
          ? "Address updated successfully"
          : "Address added successfully",
      );

      resetForm();
      setShowAddForm(false);
      loadAddresses();
    } catch (error: any) {
      console.error("Error saving address:", error);
      Alert.alert("Error", error.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddressType(addr.address_type as "home" | "work");
    setIsDefault(addr.is_default);
    setUseCurrentLocation(!!addr.latitude && !!addr.longitude);
    setMunicipality(addr.municipality);
    setBarangay(addr.barangay);
    setPurok(addr.purok);
    setAddress(addr.full_address);
    setLatitude(addr.latitude || null);
    setLongitude(addr.longitude || null);
    setShowAddForm(true);
  };

  const handleDeleteAddress = (addr: Address) => {
    Alert.alert(
      "Delete Address",
      `Are you sure you want to delete this ${addr.address_type} address?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAddress(addr.address_id),
        },
      ],
    );
  };

  const deleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("address_id", addressId);

      if (error) throw error;

      Alert.alert("Success", "Address deleted successfully");
      loadAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      Alert.alert("Error", "Failed to delete address");
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      // Update all addresses to non-default first
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", session.user.id);

      // Set the selected address as default
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("address_id", addressId);

      if (error) throw error;

      Alert.alert("Success", "Default address updated");
      loadAddresses();
    } catch (error) {
      console.error("Error setting default address:", error);
      Alert.alert("Error", "Failed to update default address");
    }
  };

  // Barangay selector functions
  const openBarangaySelector = () => {
    setSearchQuery("");
    setBarangayModalVisible(true);
  };

  const handleSelectBarangay = (item: string) => {
    setBarangay(item);
    setBarangayModalVisible(false);
    setFormErrors((prev) => ({ ...prev, barangay: false }));
  };

  const getFilteredBarangays = () => {
    if (!searchQuery) return BARANGAYS;
    return BARANGAYS.filter((barangayItem) =>
      barangayItem.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  const renderBarangayItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleSelectBarangay(item)}
    >
      <Text style={styles.dropdownItemText}>{item}</Text>
    </TouchableOpacity>
  );

  // Format address for display
  const formatAddress = (addr: Address) => {
    return addr.full_address || "No address specified";
  };

  // Get address type icon
  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return "home";
      case "work":
        return "business";
      default:
        return "location";
    }
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
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Addresses</Text>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setShowAddForm(true);
          }}
          style={styles.addButton}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Address List */}
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Addresses Yet</Text>
            <Text style={styles.emptyText}>
              Add your first address for deliveries
            </Text>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                setShowAddForm(true);
              }}
              style={styles.addFirstButton}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addFirstText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((addr) => (
              <View key={addr.address_id} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressTypeContainer}>
                    <Ionicons
                      name={getAddressTypeIcon(addr.address_type)}
                      size={20}
                      color={COLORS.light.primary}
                    />
                    <Text style={styles.addressType}>
                      {addr.address_type.charAt(0).toUpperCase() +
                        addr.address_type.slice(1)}{" "}
                      Address
                    </Text>
                    {addr.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.addressActions}>
                    <TouchableOpacity
                      onPress={() => handleEditAddress(addr)}
                      style={styles.iconButton}
                    >
                      <Ionicons name="create-outline" size={20} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteAddress(addr)}
                      style={styles.iconButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.addressText}>{formatAddress(addr)}</Text>

                {/* Show coordinates badge if available */}
                {addr.latitude && addr.longitude && (
                  <View style={styles.coordinatesBadge}>
                    <Ionicons
                      name="locate"
                      size={12}
                      color={COLORS.light.primary}
                    />
                    <Text style={styles.coordinatesBadgeText}>
                      Coordinates saved
                    </Text>
                  </View>
                )}

                {!addr.is_default && (
                  <TouchableOpacity
                    onPress={() => handleSetDefault(addr.address_id)}
                    style={styles.setDefaultButton}
                  >
                    <Text style={styles.setDefaultText}>Set as Default</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Add/Edit Address Modal */}
        <Modal
          visible={showAddForm}
          animationType="slide"
          onRequestClose={() => {
            setShowAddForm(false);
            resetForm();
          }}
        >
          <SafeAreaView style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                style={styles.modalBackButton}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={COLORS.light.primary}
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingAddress ? "Edit Address" : "Add New Address"}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Address Type Selection */}
              <View style={styles.typeContainer}>
                <View style={styles.typeOptions}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      addressType === "home" && styles.typeOptionSelected,
                    ]}
                    onPress={() => setAddressType("home")}
                  >
                    <Ionicons
                      name="home"
                      size={20}
                      color={
                        addressType === "home" ? "#fff" : COLORS.light.primary
                      }
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        addressType === "home" && styles.typeOptionTextSelected,
                      ]}
                    >
                      Home
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      addressType === "work" && styles.typeOptionSelected,
                    ]}
                    onPress={() => setAddressType("work")}
                  >
                    <Ionicons
                      name="business"
                      size={20}
                      color={
                        addressType === "work" ? "#fff" : COLORS.light.primary
                      }
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        addressType === "work" && styles.typeOptionTextSelected,
                      ]}
                    >
                      Work
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ paddingHorizontal: 16 }}>
                <AddressForm
                  address={address}
                  onChange={setAddress}
                  errors={formErrors}
                  onFieldsChange={(newBarangay, newPurok) => {
                    setBarangay(newBarangay);
                    setPurok(newPurok);
                  }}
                  onMunicipalityChange={setMunicipality}
                  onCoordinatesChange={(lat, lng) => {
                    if (!useCurrentLocation) {
                      setLatitude(lat);
                      setLongitude(lng);
                    }
                  }}
                  initialLatitude={editingAddress?.latitude}
                  initialLongitude={editingAddress?.longitude}
                />
              </View>

              {/* Use Current Location Checkbox */}
              <View style={styles.locationCheckboxContainer}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={handleLocationCheckboxToggle}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      useCurrentLocation && styles.checkboxChecked,
                    ]}
                  >
                    {useCurrentLocation && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Use current location</Text>
                </TouchableOpacity>

                <Text style={styles.locationHelperText}>
                  When checked, your exact coordinates will be saved to help
                  riders deliver more accurately
                </Text>

                {saving && useCurrentLocation && (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.light.primary}
                    style={styles.locationLoader}
                  />
                )}

                {useCurrentLocation && latitude && longitude && !saving && (
                  <View style={styles.coordinatesPreview}>
                    <Ionicons name="locate" size={14} color="#10b981" />
                    <Text style={styles.coordinatesPreviewText}>
                      Coordinates ready
                    </Text>
                  </View>
                )}
              </View>

              {/* Set as Default Option */}
              <View style={styles.defaultContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setIsDefault(!isDefault)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isDefault && styles.checkboxChecked,
                    ]}
                  >
                    {isDefault && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Set as default address
                  </Text>
                </TouchableOpacity>
                <Text style={styles.defaultHelperText}>
                  Default address will be used for deliveries unless specified
                  otherwise
                </Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSaveAddress}
                disabled={saving}
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>
                    {editingAddress ? "Update Address" : "Save Address"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                style={styles.cancelButton}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Barangay Selector Modal */}
        <Modal
          visible={barangayModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setBarangayModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Barangay</Text>
                <TouchableOpacity
                  onPress={() => setBarangayModalVisible(false)}
                >
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

              <FlatList
                data={getFilteredBarangays()}
                renderItem={renderBarangayItem}
                keyExtractor={(item) => item}
                style={styles.modalList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyListText}>No barangays found</Text>
                  </View>
                }
              />

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setBarangayModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddressManagement;

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
  addButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addFirstText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Address List
  addressList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addressCard: {
    backgroundColor: COLORS.common.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  addressTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  addressType: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  defaultBadge: {
    backgroundColor: "#e0f2ed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  addressActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  addressText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 12,
  },
  setDefaultButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 6,
  },
  setDefaultText: {
    fontSize: 12,
    color: COLORS.light.primary,
    fontWeight: "500",
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.common.white,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f2ed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modalBackButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  // Address Type Selection
  typeContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  typeOptions: {
    flexDirection: "row",
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    backgroundColor: "#fff",
  },
  typeOptionSelected: {
    backgroundColor: COLORS.light.primary,
    borderColor: COLORS.light.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  typeOptionTextSelected: {
    color: "#fff",
  },
  // Location Checkbox
  locationCheckboxContainer: {
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  locationHelperText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginLeft: 36,
  },
  locationLoader: {
    marginTop: 8,
    alignSelf: "center",
  },
  coordinatesPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
    marginTop: 8,
  },
  coordinatesPreviewText: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "500",
  },
  // Default Address Option
  defaultContainer: {
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.light.primary,
    borderColor: COLORS.light.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    flex: 1,
  },
  defaultHelperText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginLeft: 36,
    marginTop: 8,
  },
  // Save Button
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.light.primary,
    paddingVertical: 16,
    borderRadius: 8,
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
  // Cancel Button
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.light.primary,
  },
  cancelText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  // Barangay Selector Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.common.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    margin: 16,
    marginBottom: 8,
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
    maxHeight: 300,
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#333",
    textAlign: "center",
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
  },
  modalCancelText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    fontWeight: "600",
  },
  coordinatesBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  coordinatesBadgeText: {
    fontSize: 10,
    color: COLORS.light.primary,
    fontStyle: "italic",
  },
});
