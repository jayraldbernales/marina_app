// components/AddressForm.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { COLORS } from "../../constants";
import { Ionicons } from "@expo/vector-icons";

// Real data for Mabini, Bohol
const MUNICIPALITIES = [{ value: "mabini_bohol", label: "Mabini, Bohol" }];

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

// Proper type definitions
type AddressErrors = {
  municipality?: boolean;
  barangay?: boolean;
  purok?: boolean;
};

type AddressFormProps = {
  address: string;
  onChange: (address: string) => void;
  errors?: AddressErrors;
  onErrorsChange?: (errors: AddressErrors) => void;
  onFieldsChange?: (barangay: string, purok: string) => void;
  // ADD THESE PROPS
  initialBarangay?: string;
  initialPurok?: string;
};

const AddressForm: React.FC<AddressFormProps> = ({
  address,
  onChange,
  errors = {},
  onErrorsChange,
  onFieldsChange,
  // ADD THESE PROPS
  initialBarangay = "",
  initialPurok = "",
}) => {
  // Initialize state with initial values from parent
  const [municipality, setMunicipality] = useState("mabini_bohol");
  const [barangay, setBarangay] = useState(initialBarangay);
  const [purok, setPurok] = useState(initialPurok);

  // State for barangay selector modal
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Update local state when initial props change (when navigating back)
  useEffect(() => {
    if (initialBarangay !== barangay) {
      setBarangay(initialBarangay);
    }
    if (initialPurok !== purok) {
      setPurok(initialPurok);
    }
  }, [initialBarangay, initialPurok]);

  // Helper to get municipality display label
  const getMunicipalityLabel = useCallback((value: string) => {
    const found = MUNICIPALITIES.find((m) => m.value === value);
    return found ? found.label : "";
  }, []);

  // Generate the full address
  const generateFullAddress = useCallback(() => {
    const normalizedPurok = purok.replace(/\s+/g, " ").trim();

    if (barangay && normalizedPurok) {
      return `${normalizedPurok}, ${barangay}, ${getMunicipalityLabel(municipality)}`;
    }
    return "";
  }, [barangay, purok, municipality, getMunicipalityLabel]);

  useEffect(() => {
    const newAddress = generateFullAddress();

    if (newAddress !== address) {
      onChange(newAddress);
    }

    onFieldsChange?.(barangay, purok);
  }, [barangay, purok]); // Cleaner dependency array

  // Handle barangay change with proper error updates
  const handleBarangayChange = useCallback(
    (value: string) => {
      setBarangay(value);
      onErrorsChange?.({ barangay: !value });
    },
    [onErrorsChange],
  );

  const handlePurokChange = useCallback(
    (value: string) => {
      setPurok(value);
      const normalizedValue = value.replace(/\s+/g, " ").trim();
      onErrorsChange?.({ purok: !normalizedValue });
    },
    [onErrorsChange],
  );

  // Open barangay selector modal
  const openBarangaySelector = useCallback(() => {
    setSearchQuery("");
    setModalVisible(true);
  }, []);

  // Handle barangay selection from modal
  const handleSelectBarangay = useCallback(
    (item: string) => {
      handleBarangayChange(item);
      setModalVisible(false);
    },
    [handleBarangayChange],
  );

  // Filter barangays based on search
  const getFilteredBarangays = useCallback(() => {
    if (!searchQuery) return BARANGAYS;
    return BARANGAYS.filter((barangay) =>
      barangay.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  // Custom dropdown render item
  const renderBarangayItem = useCallback(
    ({ item }: { item: string }) => (
      <TouchableOpacity
        style={styles.dropdownItem}
        onPress={() => handleSelectBarangay(item)}
      >
        <Text style={styles.dropdownItemText}>{item}</Text>
      </TouchableOpacity>
    ),
    [handleSelectBarangay],
  );

  // Get normalized purok for display and validation
  const getNormalizedPurok = useCallback(() => {
    return purok.replace(/\s+/g, " ").trim();
  }, [purok]);

  // Check if we should show address preview
  const shouldShowPreview = useCallback(() => {
    return barangay && getNormalizedPurok();
  }, [barangay, getNormalizedPurok]);

  return (
    <View style={styles.container}>
      {/* Barangay Selector Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Barangay</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
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
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.addressCard}>
        <Text style={styles.cardTitle}>Complete Address</Text>

        {/* Municipality */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Municipality *</Text>
          <View
            style={[
              styles.dropdownWrapper,
              errors.municipality && styles.inputError,
            ]}
          >
            <Picker
              selectedValue={municipality}
              onValueChange={setMunicipality}
              style={styles.picker}
              enabled={false}
            >
              {MUNICIPALITIES.map((mun) => (
                <Picker.Item
                  key={mun.value}
                  label={mun.label}
                  value={mun.value}
                  style={styles.pickerItem}
                />
              ))}
            </Picker>
          </View>
          {errors.municipality && (
            <Text style={styles.errorText}>Municipality is required</Text>
          )}
        </View>

        {/* Barangay - Custom Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Barangay *</Text>
          <TouchableOpacity
            style={[
              styles.customDropdown,
              errors.barangay && styles.inputError,
            ]}
            onPress={openBarangaySelector}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.dropdownText,
                !barangay && styles.dropdownPlaceholder,
              ]}
            >
              {barangay || "-- Select Barangay --"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          {errors.barangay && (
            <Text style={styles.errorText}>Barangay is required</Text>
          )}
        </View>

        {/* Purok - Text Input with normalization */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Purok / Sitio / Landmark *</Text>
          <TextInput
            style={[styles.textInput, errors.purok && styles.inputError]}
            placeholder="e.g., Purok 1, Near Total Gasoline Station"
            value={purok}
            onChangeText={handlePurokChange}
            placeholderTextColor="#999"
            maxLength={100}
          />
          {errors.purok && (
            <Text style={styles.errorText}>Purok is required</Text>
          )}
          <Text style={styles.helperText}>
            Enter your specific purok, sitio, or nearby landmark
            {purok && ` (${getNormalizedPurok().length}/100 characters)`}
          </Text>
        </View>

        {/* Current Address Preview */}
        {shouldShowPreview() && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Your address will be:</Text>
            <Text style={styles.previewAddress}>
              {getNormalizedPurok()}, {barangay},{" "}
              {getMunicipalityLabel(municipality)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  addressCard: {
    backgroundColor: COLORS.common.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.light.primary,
    marginBottom: 16,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginBottom: 8,
    marginLeft: 4,
  },
  dropdownWrapper: {
    backgroundColor: COLORS.common.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    overflow: "hidden",
    height: 50,
    justifyContent: "center",
  },
  picker: {
    height: 50,
    width: "100%",
    margin: 0,
    padding: 0,
    ...Platform.select({
      android: {
        textAlign: "center",
      },
    }),
  },
  pickerItem: {
    fontSize: 14,
    textAlign: "center",
    ...Platform.select({
      ios: {
        textAlign: "center",
      },
      android: {
        textAlign: "center",
        includeFontPadding: false,
      },
    }),
  },
  // Custom Dropdown Styles
  customDropdown: {
    backgroundColor: COLORS.common.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.light.primary,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: "#999",
  },
  // Text Input Styles
  textInput: {
    backgroundColor: COLORS.common.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    height: 50,
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.light.primary,
  },
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 1.5,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.light.oceanMedium,
    marginTop: 4,
    fontStyle: "italic",
    marginLeft: 4,
  },
  previewContainer: {
    marginTop: 16,
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
  // Modal Styles
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.light.primary,
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
});

export default AddressForm;
