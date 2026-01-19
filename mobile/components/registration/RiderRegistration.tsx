// components/registration/RiderRegistration.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../constants";
import AddressForm from "./AddressForm";

const RiderRegistration = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedConsent, setAcceptedConsent] = useState(false);

  // Step 1: Personal Information
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactNumber, setEmergencyContactNumber] = useState("");

  // Step 2: Vehicle Information
  const [vehicleType, setVehicleType] = useState("");
  const [plateNumber, setPlateNumber] = useState("");

  // Step 3: Verification (removed ID type and valid ID)
  const [driversLicenseImage, setDriversLicenseImage] = useState<string | null>(
    null,
  );
  const [selfieWithIdImage, setSelfieWithIdImage] = useState<string | null>(
    null,
  );
  const [motorcycleRegistrationImage, setMotorcycleRegistrationImage] =
    useState<string | null>(null);

  // Address fields for validation
  const [addressFields, setAddressFields] = useState({
    barangay: "",
    purok: "",
  });

  // Error states (removed idType and validId errors)
  const [errors, setErrors] = useState({
    fullName: false,
    email: false,
    mobile: false,
    barangay: false,
    purok: false,
    emergencyContactName: false,
    emergencyContactNumber: false,
    vehicleType: false,
    plateNumber: false,
    driversLicense: false,
    selfieWithId: false,
  });

  // Vehicle Type Options
  const VEHICLE_TYPES = [
    { label: "-- Select Vehicle Type --", value: "" },
    { label: "Motorcycle", value: "MOTORCYCLE" },
    { label: "Bicycle", value: "BICYCLE" },
    { label: "E-Bike", value: "EBIKE" },
    { label: "Tricycle", value: "TRICYCLE" },
  ];

  // Vehicle Type Labels
  const VEHICLE_TYPE_LABELS: Record<string, string> = {
    MOTORCYCLE: "Motorcycle",
    BICYCLE: "Bicycle",
    EBIKE: "E-Bike",
    TRICYCLE: "Tricycle",
  };

  // Memoized address form errors object
  const addressFormErrors = useMemo(
    () => ({
      municipality: false,
      barangay: errors.barangay,
      purok: errors.purok,
    }),
    [errors.barangay, errors.purok],
  );

  // Memoized callback functions
  const handleAddressChange = useCallback((newAddress: string) => {
    setAddress(newAddress);
  }, []);

  const handleAddressErrorsChange = useCallback((addressErrors: any) => {
    setErrors((prev) => ({ ...prev, ...addressErrors }));
  }, []);

  const handleAddressFieldsUpdate = useCallback(
    (barangayValue: string, purokValue: string) => {
      setAddressFields({
        barangay: barangayValue,
        purok: purokValue,
      });
    },
    [],
  );

  // Fetch user email from auth
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmail(session.user.email);
        }
      } catch (error) {
        console.error("Error fetching user email:", error);
      }
    };
    fetchUserEmail();
  }, []);

  // Validation functions (updated validateStep3)
  const validateStep1 = useCallback(() => {
    const isBarangayEmpty = !addressFields.barangay.trim();
    const isPurokEmpty = !addressFields.purok.trim();

    const newErrors = {
      ...errors,
      fullName: !fullName.trim(),
      email: !email.trim(),
      mobile: !mobile.trim(),
      barangay: isBarangayEmpty,
      purok: isPurokEmpty,
      emergencyContactName: !emergencyContactName.trim(),
      emergencyContactNumber: !emergencyContactNumber.trim(),
    };

    setErrors(newErrors);

    const hasErrors =
      newErrors.fullName ||
      newErrors.email ||
      newErrors.mobile ||
      newErrors.barangay ||
      newErrors.purok ||
      newErrors.emergencyContactName ||
      newErrors.emergencyContactNumber;

    return !hasErrors;
  }, [
    fullName,
    email,
    mobile,
    addressFields,
    emergencyContactName,
    emergencyContactNumber,
    errors,
  ]);

  const validateStep2 = useCallback(() => {
    const newErrors = {
      ...errors,
      vehicleType: !vehicleType.trim(),
      plateNumber: !plateNumber.trim(),
    };

    setErrors(newErrors);

    return !newErrors.vehicleType && !newErrors.plateNumber;
  }, [vehicleType, plateNumber, errors]);

  const validateStep3 = useCallback(() => {
    const newErrors = {
      ...errors,
      driversLicense: !driversLicenseImage,
      selfieWithId: !selfieWithIdImage,
    };

    setErrors(newErrors);

    return !newErrors.driversLicense && !newErrors.selfieWithId;
  }, [driversLicenseImage, selfieWithIdImage, errors]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
    } else if (step === 3) {
      if (validateStep3()) {
        setStep(4);
      }
    }
  }, [step, validateStep1, validateStep2, validateStep3]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4);
    }
  }, [step]);

  // Camera handler
  const openCamera = useCallback(
    async (
      setter: (uri: string) => void,
      type: "photo" | "document" = "photo",
    ) => {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera access is required.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: type === "document" ? 1 : 0.85,
        allowsEditing: type === "photo",
        aspect: type === "document" ? [4, 3] : [1, 1],
      });

      if (!result.canceled) {
        setter(result.assets[0].uri);
      }
    },
    [],
  );

  // Submit registration
  const handleSubmit = useCallback(async () => {
    if (!acceptedTerms || !acceptedConsent) {
      Alert.alert(
        "Agreement Required",
        "Please accept the Terms & Conditions and Privacy Policy.",
      );
      return;
    }

    try {
      // Here you would submit to your backend
      Alert.alert(
        "Registration Submitted",
        "Your rider registration has been submitted for review. You'll receive a notification once approved by the admin.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ],
      );
    } catch (error) {
      Alert.alert("Error", "Failed to submit registration. Please try again.");
    }
  }, [acceptedTerms, acceptedConsent]);

  // Render image preview or upload button
  const renderUploadSection = useCallback(
    (
      label: string,
      image: string | null,
      setImage: (uri: string) => void,
      errorField: boolean,
      type: "photo" | "document" = "photo",
      instructions?: string,
    ) => (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TouchableOpacity
          style={[styles.uploadCard, errorField && styles.inputError]}
          onPress={() => openCamera(setImage, type)}
        >
          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <View style={styles.imageOverlay}>
                <Ionicons name="camera-outline" size={24} color="#fff" />
                <Text style={styles.imageOverlayText}>Retake Photo</Text>
              </View>
            </View>
          ) : (
            <View style={styles.uploadContent}>
              <Ionicons
                name={
                  type === "document" ? "document-outline" : "camera-outline"
                }
                size={32}
                color={errorField ? "#ef4444" : COLORS.light.primary}
              />
              <Text
                style={[
                  styles.uploadText,
                  errorField && styles.uploadTextError,
                ]}
              >
                Capture {label}
              </Text>
              {instructions && (
                <Text style={styles.uploadSubtext}>{instructions}</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
        {errorField && (
          <Text style={styles.errorText}>{label} is required</Text>
        )}
      </View>
    ),
    [openCamera],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rider Registration</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* STEP 1: Personal Information */}
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  setErrors((prev) => ({ ...prev, fullName: false }));
                }}
              />
              {errors.fullName && (
                <Text style={styles.errorText}>Full name is required</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Your registered email"
                value={email}
                editable={false}
                selectTextOnFocus={false}
              />
              <Text style={styles.helperText}>
                Email is taken from your account and cannot be changed
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number *</Text>
              <TextInput
                style={[styles.input, errors.mobile && styles.inputError]}
                placeholder="09XX XXX XXXX"
                value={mobile}
                onChangeText={(text) => {
                  setMobile(text);
                  setErrors((prev) => ({ ...prev, mobile: false }));
                }}
                keyboardType="phone-pad"
                maxLength={11}
              />
              {errors.mobile && (
                <Text style={styles.errorText}>Mobile number is required</Text>
              )}
            </View>

            {/* Address Form */}
            <AddressForm
              address={address}
              onChange={handleAddressChange}
              errors={addressFormErrors}
              onErrorsChange={handleAddressErrorsChange}
              onFieldsChange={handleAddressFieldsUpdate}
              initialBarangay={addressFields.barangay}
              initialPurok={addressFields.purok}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Emergency Contact Person *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.emergencyContactName && styles.inputError,
                ]}
                placeholder="Full name of emergency contact"
                value={emergencyContactName}
                onChangeText={(text) => {
                  setEmergencyContactName(text);
                  setErrors((prev) => ({
                    ...prev,
                    emergencyContactName: false,
                  }));
                }}
              />
              {errors.emergencyContactName && (
                <Text style={styles.errorText}>
                  Emergency contact person is required
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Emergency Contact Number *</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.emergencyContactNumber && styles.inputError,
                ]}
                placeholder="09XX XXX XXXX"
                value={emergencyContactNumber}
                onChangeText={(text) => {
                  setEmergencyContactNumber(text);
                  setErrors((prev) => ({
                    ...prev,
                    emergencyContactNumber: false,
                  }));
                }}
                keyboardType="phone-pad"
                maxLength={11}
              />
              {errors.emergencyContactNumber && (
                <Text style={styles.errorText}>
                  Emergency contact number is required
                </Text>
              )}
            </View>
          </>
        )}

        {/* STEP 2: Vehicle Information */}
        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Vehicle Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicle Type *</Text>
              <View
                style={[
                  styles.dropdownWrapper,
                  errors.vehicleType && styles.inputError,
                ]}
              >
                <Picker
                  selectedValue={vehicleType}
                  onValueChange={(value) => {
                    setVehicleType(value);
                    setErrors((prev) => ({ ...prev, vehicleType: false }));
                  }}
                  style={styles.picker}
                >
                  {VEHICLE_TYPES.map((type) => (
                    <Picker.Item
                      key={type.value}
                      label={type.label}
                      value={type.value}
                    />
                  ))}
                </Picker>
              </View>
              {errors.vehicleType && (
                <Text style={styles.errorText}>Please select vehicle type</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicle Plate Number *</Text>
              <TextInput
                style={[styles.input, errors.plateNumber && styles.inputError]}
                placeholder="Enter plate number"
                value={plateNumber}
                onChangeText={(text) => {
                  setPlateNumber(text);
                  setErrors((prev) => ({ ...prev, plateNumber: false }));
                }}
                autoCapitalize="characters"
              />
              {errors.plateNumber && (
                <Text style={styles.errorText}>Plate number is required</Text>
              )}
              <Text style={styles.helperText}>
                For bicycles/e-bikes: Enter frame number or "N/A"
              </Text>
            </View>
          </>
        )}

        {/* STEP 3: Verification */}
        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Verification</Text>

            <Text style={styles.sectionDescription}>
              Please provide the following documents for verification:
            </Text>

            {renderUploadSection(
              "Driver's License *",
              driversLicenseImage,
              setDriversLicenseImage,
              errors.driversLicense,
              "document",
              "Front and back if applicable",
            )}

            {renderUploadSection(
              "Selfie with ID *",
              selfieWithIdImage,
              setSelfieWithIdImage,
              errors.selfieWithId,
              "photo",
              "Hold your Driver's License next to your face",
            )}

            {renderUploadSection(
              "Motorcycle Registration (Optional)",
              motorcycleRegistrationImage,
              setMotorcycleRegistrationImage,
              false,
              "document",
              "Optional but recommended for verification",
            )}
          </>
        )}

        {/* STEP 4: Confirmation */}
        {step === 4 && (
          <>
            <Text style={styles.stepTitle}>Review & Submit</Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Registration Summary</Text>

              <View style={styles.summarySection}>
                <Text style={styles.summarySectionTitle}>
                  Personal Information
                </Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Full Name:</Text>
                  <Text style={styles.summaryValue}>{fullName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Email:</Text>
                  <Text style={styles.summaryValue}>{email}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Mobile:</Text>
                  <Text style={styles.summaryValue}>{mobile}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Address:</Text>
                  <Text style={styles.summaryValue} numberOfLines={2}>
                    {address || "Not specified"}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Emergency Contact:</Text>
                  <Text style={styles.summaryValue}>
                    {emergencyContactName} ({emergencyContactNumber})
                  </Text>
                </View>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summarySectionTitle}>
                  Vehicle Information
                </Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Vehicle Type:</Text>
                  <Text style={styles.summaryValue}>
                    {VEHICLE_TYPE_LABELS[vehicleType] || "Not selected"}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Plate Number:</Text>
                  <Text style={styles.summaryValue}>{plateNumber}</Text>
                </View>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summarySectionTitle}>Documents</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Required Documents:</Text>
                  <Text style={styles.summaryValue}>
                    {[
                      driversLicenseImage && "Driver's License",
                      selfieWithIdImage && "Selfie with ID",
                      motorcycleRegistrationImage && "Registration",
                    ]
                      .filter(Boolean)
                      .join(", ") || "None"}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkboxCard}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <Ionicons
                name={acceptedTerms ? "checkbox" : "square-outline"}
                size={22}
                color={COLORS.light.primary}
              />
              <Text style={styles.checkboxText}>
                I agree to the{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => router.push("/terms")}
                >
                  Terms & Conditions
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxCard}
              onPress={() => setAcceptedConsent(!acceptedConsent)}
            >
              <Ionicons
                name={acceptedConsent ? "checkbox" : "square-outline"}
                size={22}
                color={COLORS.light.primary}
              />
              <Text style={styles.checkboxText}>
                I agree to the{" "}
                <Text
                  style={styles.linkText}
                  onPress={() => router.push("/privacy")}
                >
                  Privacy Policy
                </Text>{" "}
                and consent to data processing
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>Step {step} of 4</Text>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < 4 ? (
            <TouchableOpacity
              style={[
                styles.button,
                styles.nextButton,
                step > 1 && styles.nextButtonHalf,
              ]}
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                !(acceptedTerms && acceptedConsent) && styles.disabledButton,
              ]}
              disabled={!(acceptedTerms && acceptedConsent)}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>Submit Registration</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RiderRegistration;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light.background },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
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
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
    marginLeft: 12,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e0f2ed",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.light.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500",
  },
  content: { padding: 16, paddingBottom: 32 },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.light.primary,
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.light.oceanMedium,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.common.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    fontSize: 15,
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
  },
  helperText: {
    fontSize: 11,
    color: COLORS.light.oceanMedium,
    marginTop: 4,
    fontStyle: "italic",
  },
  dropdownWrapper: {
    backgroundColor: COLORS.common.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  uploadCard: {
    backgroundColor: COLORS.common.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  uploadContent: {
    padding: 20,
    alignItems: "center",
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  uploadTextError: {
    color: "#ef4444",
  },
  uploadSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    textAlign: "center",
  },
  imagePreviewContainer: {
    position: "relative",
    width: "100%",
    height: 140,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlayText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: COLORS.common.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0f2ed",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.light.primary,
    marginBottom: 16,
  },
  summarySection: {
    marginBottom: 16,
  },
  summarySectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.oceanMedium,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.light.oceanMedium,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 13,
    color: COLORS.light.primary,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  checkboxCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.common.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0f2ed",
  },
  checkboxText: {
    marginLeft: 12,
    fontSize: 13,
    color: COLORS.light.oceanMedium,
    lineHeight: 18,
    flex: 1,
  },
  linkText: {
    color: COLORS.light.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e8f5f1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    marginLeft: 10,
    fontSize: 12,
    color: COLORS.light.oceanMedium,
    lineHeight: 17,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  backButton: {
    backgroundColor: COLORS.common.white,
    borderWidth: 0.5,
    borderColor: COLORS.light.primary,
    flex: 1,
  },
  backButtonText: {
    color: COLORS.light.primary,
    fontWeight: "600",
    fontSize: 15,
  },
  nextButton: {
    backgroundColor: COLORS.light.primary,
    flex: 1,
  },
  nextButtonHalf: {
    borderWidth: 0.5,
    flex: 1,
  },
  submitButton: {
    backgroundColor: COLORS.light.primary,
    flex: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.common.white,
    fontWeight: "600",
    fontSize: 15,
  },
});
