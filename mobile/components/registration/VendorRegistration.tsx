import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { COLORS } from "../../constants";
import AddressForm from "./AddressForm";
import {
  saveVendorRegistration,
  VendorRegistrationData,
} from "../../lib/registrationService";

const VendorRegistration = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedConsent, setAcceptedConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [idType, setIdType] = useState("");
  const [validIdFrontImage, setValidIdFrontImage] = useState<string | null>(
    null,
  );
  const [validIdBackImage, setValidIdBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [optionalDoc, setOptionalDoc] = useState<string | null>(null);

  // Form fields with validation state
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [gcash, setGcash] = useState("");
  const [municipality, setMunicipality] = useState("");

  // Add separate state for address fields to track them individually
  const [addressFields, setAddressFields] = useState({
    barangay: "",
    purok: "",
  });

  const [errors, setErrors] = useState({
    shopName: false,
    email: false,
    municipality: false,
    barangay: false,
    purok: false,
    mobile: false,
    gcash: false,
    idType: false,
    validIdFront: false,
    validIdBack: false,
    selfie: false,
  });

  const ID_OPTIONS = [
    { label: "-- Select ID Type--", value: "" },
    { label: "National ID", value: "NATIONAL_ID" },
    { label: "Driver's License (LTO)", value: "DRIVERS_LICENSE" },
    { label: "Passport", value: "PASSPORT" },
    { label: "Barangay ID", value: "BARANGAY_ID" },
    { label: "Fisherfolk ID", value: "FISHERFOLK_ID" },
    { label: "UMID (SSS / GSIS)", value: "UMID" },
    { label: "Voter's ID / Voter's Certificate", value: "VOTERS_ID" },
    { label: "PhilHealth ID", value: "PHILHEALTH_ID" },
    { label: "Postal ID", value: "POSTAL_ID" },
  ];

  const ID_TYPE_LABELS: Record<string, string> = {
    NATIONAL_ID: "Philippine National ID",
    DRIVERS_LICENSE: "Driver's License",
    PASSPORT: "Passport",
    BARANGAY_ID: "Barangay ID",
    FISHERFOLK_ID: "Fisherfolk ID",
    UMID: "UMID (SSS / GSIS)",
    VOTERS_ID: "Voter's ID / Certificate",
    PHILHEALTH_ID: "PhilHealth ID",
    POSTAL_ID: "Postal ID",
  };

  // Check if ID type requires back photo
  const requiresBackPhoto = (type: string) => {
    const requiresBack = [
      "NATIONAL_ID",
      "DRIVERS_LICENSE",
      "BARANGAY_ID",
      "FISHERFOLK_ID",
      "UMID",
      "VOTERS_ID",
      "PHILHEALTH_ID",
      "POSTAL_ID",
    ];
    return requiresBack.includes(type);
  };

  // Add this to your imports

  // Add this useEffect
  useEffect(() => {
    const fetchUserEmail = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
    };
    fetchUserEmail();
  }, []);

  // In your email field:

  const validateStep1 = () => {
    const isBarangayEmpty = !addressFields.barangay.trim();
    const isPurokEmpty = !addressFields.purok.trim();

    const newErrors = {
      ...errors,
      shopName: !shopName.trim(),
      email: !email.trim(),
      barangay: isBarangayEmpty,
      purok: isPurokEmpty,
      mobile: !mobile.trim(),
      gcash: !gcash.trim(),
    };

    setErrors(newErrors);

    const hasErrors =
      newErrors.shopName ||
      newErrors.email ||
      newErrors.barangay ||
      newErrors.purok ||
      newErrors.mobile ||
      newErrors.gcash;

    return !hasErrors;
  };

  const validateStep2 = () => {
    // Check if front ID is required
    const frontRequired = !validIdFrontImage;

    // Check if back ID is required based on ID type
    const backRequired = requiresBackPhoto(idType) && !validIdBackImage;

    const newErrors = {
      ...errors,
      idType: !idType,
      validIdFront: frontRequired,
      validIdBack: backRequired,
      selfie: !selfieImage,
    };

    setErrors(newErrors);

    // Return true only if all required fields are filled
    const hasErrors =
      newErrors.idType ||
      newErrors.validIdFront ||
      newErrors.validIdBack ||
      newErrors.selfie;

    return !hasErrors;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = async () => {
    if (!acceptedTerms || !acceptedConsent) {
      Alert.alert(
        "Agreement Required",
        "Please accept the Terms & Conditions and Privacy Policy.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        Alert.alert("Error", "User session not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      const userId = session.user.id;

      // Prepare registration data
      const registrationData: VendorRegistrationData = {
        shopName,
        email,
        mobile,
        gcash,
        barangay: addressFields.barangay,
        purok: addressFields.purok,
        municipality,
        validIdFrontImage: validIdFrontImage!,
        validIdBackImage,
        selfieImage: selfieImage!,
        optionalDoc,
        idType,
        acceptedTerms,
        acceptedConsent,
      };

      // Save to database
      await saveVendorRegistration(userId, registrationData);

      Alert.alert(
        "Success",
        "Your vendor registration has been submitted successfully! Your account is pending approval by our admin team.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)"),
          },
        ],
      );
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to submit registration. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openCamera = async (setter: (uri: string) => void) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera access is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  };

  // Handle address change from AddressForm
  const handleAddressChange = useCallback((newAddress: string) => {
    setAddress(newAddress);
  }, []);

  // Handle errors AND field values from AddressForm
  const handleAddressErrorsChange = useCallback((addressErrors: any) => {
    setErrors((prev) => ({ ...prev, ...addressErrors }));
  }, []);

  // NEW FUNCTION: Update address fields when AddressForm changes
  const handleAddressFieldsUpdate = useCallback(
    (barangayValue: string, purokValue: string) => {
      setAddressFields({
        barangay: barangayValue,
        purok: purokValue,
      });
    },
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Registration</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* STEP 1 */}
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Shop Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Shop Name *</Text>
              <TextInput
                style={[styles.input, errors.shopName && styles.inputError]}
                placeholder="e.g., Shop Name"
                value={shopName}
                onChangeText={(text) => {
                  setShopName(text);
                  setErrors({ ...errors, shopName: false });
                }}
              />
              {errors.shopName && (
                <Text style={styles.errorText}>Shop name is required</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <View
                style={[
                  styles.emailContainer,
                  errors.email && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.emailInput}
                  placeholder="Your registered email"
                  value={email}
                  editable={false}
                  selectTextOnFocus={false}
                />
                <Ionicons
                  name="lock-closed"
                  size={18}
                  color="#6b7280"
                  style={styles.lockIcon}
                />
              </View>
              <Text style={styles.helperText}>
                Email is taken from your account and cannot be changed
              </Text>
              {errors.email && (
                <Text style={styles.errorText}>Email is required</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number *</Text>
              <TextInput
                style={[styles.input, errors.mobile && styles.inputError]}
                placeholder="09XX XXX XXXX"
                value={mobile}
                onChangeText={(text) => {
                  setMobile(text);
                  setErrors({ ...errors, mobile: false });
                }}
                keyboardType="phone-pad"
                maxLength={11}
              />
              {errors.mobile && (
                <Text style={styles.errorText}>Mobile number is required</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GCash Number *</Text>
              <TextInput
                style={[styles.input, errors.gcash && styles.inputError]}
                placeholder="09XX XXX XXXX"
                value={gcash}
                onChangeText={(text) => {
                  setGcash(text);
                  setErrors({ ...errors, gcash: false });
                }}
                keyboardType="phone-pad"
                maxLength={11}
              />
              {errors.gcash && (
                <Text style={styles.errorText}>GCash number is required</Text>
              )}
              <Text style={styles.helperText}>
                This will be used for receiving payments
              </Text>
            </View>

            {/* Address Form Card - Placed below GCash */}
            <AddressForm
              address={address}
              onChange={handleAddressChange}
              errors={{
                municipality: errors.municipality,
                barangay: errors.barangay,
                purok: errors.purok,
              }}
              onErrorsChange={handleAddressErrorsChange}
              onFieldsChange={handleAddressFieldsUpdate}
              onMunicipalityChange={setMunicipality}
              // ADD THESE PROPS TO PASS INITIAL VALUES
              initialBarangay={addressFields.barangay}
              initialPurok={addressFields.purok}
            />
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Identity Verification</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Valid ID Type *</Text>
              <View
                style={[
                  styles.dropdownWrapper,
                  errors.idType && styles.inputError,
                ]}
              >
                <Picker
                  selectedValue={idType}
                  onValueChange={(value) => {
                    setIdType(value);
                    setErrors((prev) => ({ ...prev, idType: false }));
                  }}
                  style={styles.picker}
                >
                  {ID_OPTIONS.map((id) => (
                    <Picker.Item
                      key={id.value}
                      label={id.label}
                      value={id.value}
                    />
                  ))}
                </Picker>
              </View>
              {errors.idType && (
                <Text style={styles.errorText}>Please select an ID type</Text>
              )}
            </View>

            {/* Valid ID Front Photo */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Valid ID Front Photo *</Text>
              <TouchableOpacity
                style={[
                  styles.uploadCard,
                  errors.validIdFront && styles.inputError,
                ]}
                onPress={() => openCamera(setValidIdFrontImage)}
              >
                {validIdFrontImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: validIdFrontImage }}
                      style={styles.imagePreview}
                    />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="camera-outline" size={24} color="#fff" />
                      <Text style={styles.imageOverlayText}>
                        Retake Front Photo
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadContent}>
                    <Ionicons
                      name="camera-outline"
                      size={32}
                      color={
                        errors.validIdFront ? "#ef4444" : COLORS.light.primary
                      }
                    />
                    <Text
                      style={[
                        styles.uploadText,
                        errors.validIdFront && styles.uploadTextError,
                      ]}
                    >
                      Capture Front of ID
                    </Text>
                    <Text style={styles.uploadSubtext}>
                      Make sure all details on front are clearly visible
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {errors.validIdFront && (
                <Text style={styles.errorText}>Front ID photo is required</Text>
              )}
            </View>

            {/* Valid ID Back Photo - Conditionally rendered */}
            {requiresBackPhoto(idType) && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Valid ID Back Photo *</Text>
                <TouchableOpacity
                  style={[
                    styles.uploadCard,
                    errors.validIdBack && styles.inputError,
                  ]}
                  onPress={() => openCamera(setValidIdBackImage)}
                >
                  {validIdBackImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: validIdBackImage }}
                        style={styles.imagePreview}
                      />
                      <View style={styles.imageOverlay}>
                        <Ionicons
                          name="camera-outline"
                          size={24}
                          color="#fff"
                        />
                        <Text style={styles.imageOverlayText}>
                          Retake Back Photo
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.uploadContent}>
                      <Ionicons
                        name="camera-outline"
                        size={32}
                        color={
                          errors.validIdBack ? "#ef4444" : COLORS.light.primary
                        }
                      />
                      <Text
                        style={[
                          styles.uploadText,
                          errors.validIdBack && styles.uploadTextError,
                        ]}
                      >
                        Capture Back of ID
                      </Text>
                      <Text style={styles.uploadSubtext}>
                        Required for{" "}
                        {ID_TYPE_LABELS[idType] || "selected ID type"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {errors.validIdBack && (
                  <Text style={styles.errorText}>
                    Back ID photo is required
                  </Text>
                )}
              </View>
            )}

            {/* Note for IDs that don't require back photo */}
            {idType === "PASSPORT" && (
              <View style={styles.noticeCard}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={COLORS.light.primary}
                />
                <Text style={styles.noticeText}>
                  Note: For passport, only the front photo is required as it
                  contains all necessary information.
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Selfie with ID *</Text>
              <TouchableOpacity
                style={[styles.uploadCard, errors.selfie && styles.inputError]}
                onPress={() => openCamera(setSelfieImage)}
              >
                {selfieImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: selfieImage }}
                      style={styles.imagePreview}
                    />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="camera-outline" size={24} color="#fff" />
                      <Text style={styles.imageOverlayText}>Retake Selfie</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadContent}>
                    <Ionicons
                      name="camera-outline"
                      size={32}
                      color={errors.selfie ? "#ef4444" : COLORS.light.primary}
                    />
                    <Text
                      style={[
                        styles.uploadText,
                        errors.selfie && styles.uploadTextError,
                      ]}
                    >
                      Capture Selfie with ID
                    </Text>
                    <Text style={styles.uploadSubtext}>
                      Hold your ID next to your face
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {errors.selfie && (
                <Text style={styles.errorText}>Selfie with ID is required</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Business Document (Optional)
              </Text>
              <TouchableOpacity
                style={styles.uploadCard}
                onPress={() => openCamera(setOptionalDoc)}
              >
                {optionalDoc ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: optionalDoc }}
                      style={styles.imagePreview}
                    />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="camera-outline" size={24} color="#fff" />
                      <Text style={styles.imageOverlayText}>
                        Retake Document
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadContent}>
                    <Ionicons
                      name="document-outline"
                      size={32}
                      color={COLORS.light.primary}
                    />
                    <Text style={styles.uploadText}>
                      Barangay Clearance / Permit
                    </Text>
                    <Text style={styles.uploadSubtext}>
                      Optional but recommended
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Review & Submit</Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Registration Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shop Name:</Text>
                <Text style={styles.summaryValue}>{shopName}</Text>
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
                <Text style={styles.summaryLabel}>GCash:</Text>
                <Text style={styles.summaryValue}>{gcash}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Address:</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {address || "Not specified"}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ID Type:</Text>
                <Text style={styles.summaryValue}>
                  {ID_TYPE_LABELS[idType] ?? "Not selected"}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Documents:</Text>
                <Text style={styles.summaryValue}>
                  {`${validIdFrontImage ? 1 : 0} front, ${validIdBackImage ? 1 : 0} back, ${selfieImage ? 1 : 0} selfie${optionalDoc ? ", 1 optional" : ""}`}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkboxCard}
              onPress={() => setAcceptedTerms((prev) => !prev)}
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
              onPress={() => setAcceptedConsent((prev) => !prev)}
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
              style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>Step {step} of 3</Text>
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

          {step < 3 ? (
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
                isLoading && styles.disabledButton,
              ]}
              disabled={!(acceptedTerms && acceptedConsent) || isLoading}
              onPress={handleSubmit}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.common.white} />
              ) : (
                <Text style={styles.buttonText}>Submit Registration</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VendorRegistration;

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
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginBottom: 6,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    paddingHorizontal: 14,
  },
  emailInput: {
    flex: 1,
    fontSize: 15,
    color: "#6b7280",
    paddingVertical: 14,
  },
  lockIcon: {
    marginLeft: 8,
  },
  linkText: {
    color: COLORS.light.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  input: {
    backgroundColor: COLORS.common.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    fontSize: 15,
    height: 50,
  },
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 1,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 11,
    marginTop: 4,
  },
  textArea: {
    height: 50,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  dropdownWrapper: {
    backgroundColor: COLORS.common.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    overflow: "hidden",
    height: 50,
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
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0f2ed",
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.light.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
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
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e8f5f1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
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
