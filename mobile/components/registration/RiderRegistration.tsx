// components/registration/RiderRegistration.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { COLORS } from "../../constants";
import { profileStyles } from "../../components/styles/profileStyles"; // Reuse
import {
  pickImageAsync,
  uploadImageToSupabase,
} from "../../lib/registrationUtils";
import { showError, showSuccess } from "../../lib/toast";

enum Step {
  PersonalInfo = 1,
  VehicleInfo = 2,
  Verification = 3,
  Confirmation = 4,
}

type FormData = {
  name: string;
  mobileNumber: string;
  email: string;
  password: string; // Added for auth
  address: string;
  emergencyContactPerson: string;
  emergencyContactNumber: string;
  vehicleType: string;
  vehiclePlateNumber: string;
  proofIdUri?: string;
  driversLicenseUri?: string;
  selfieWithIdUri?: string;
  motorcycleRegistrationUri?: string;
  termsAccepted: boolean;
  consentAccepted: boolean;
};

const RiderRegistrationScreen = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(Step.PersonalInfo);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    mobileNumber: "",
    email: "",
    password: "",
    address: "",
    emergencyContactPerson: "",
    emergencyContactNumber: "",
    vehicleType: "",
    vehiclePlateNumber: "",
    termsAccepted: false,
    consentAccepted: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [loading, setLoading] = useState(false);

  const validateStep = (): boolean => {
    const newErrors: typeof errors = {};
    switch (step) {
      case Step.PersonalInfo:
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (
          !formData.mobileNumber.trim() ||
          !/^\+63\d{10}$/.test(formData.mobileNumber)
        )
          newErrors.mobileNumber = "Format: +63 followed by 10 digits";
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
          newErrors.email = "Valid email is required";
        if (formData.password.length < 8)
          newErrors.password = "Password must be at least 8 characters";
        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.emergencyContactPerson.trim())
          newErrors.emergencyContactPerson =
            "Emergency contact person is required";
        if (
          !formData.emergencyContactNumber.trim() ||
          !/^\+63\d{10}$/.test(formData.emergencyContactNumber)
        )
          newErrors.emergencyContactNumber =
            "Format: +63 followed by 10 digits";
        break;
      case Step.VehicleInfo:
        if (!formData.vehicleType.trim())
          newErrors.vehicleType = "Vehicle type is required";
        if (!formData.vehiclePlateNumber.trim())
          newErrors.vehiclePlateNumber = "Plate number is required";
        break;
      case Step.Verification:
        if (!formData.proofIdUri)
          newErrors.proofIdUri = "Proof of ID is required";
        if (!formData.driversLicenseUri)
          newErrors.driversLicenseUri = "Driver’s license is required";
        if (!formData.selfieWithIdUri)
          newErrors.selfieWithIdUri = "Selfie with ID is required";
        break;
      case Step.Confirmation:
        if (!formData.termsAccepted)
          newErrors.termsAccepted = "You must accept the terms";
        if (!formData.consentAccepted)
          newErrors.consentAccepted = "You must accept the consent";
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      if (step < Step.Confirmation) {
        setStep((prev) => (prev + 1) as Step);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevStep = () => {
    if (step > Step.PersonalInfo) {
      setStep((prev) => (prev - 1) as Step);
    }
  };

  const handleImagePick = async (
    field:
      | "proofIdUri"
      | "driversLicenseUri"
      | "selfieWithIdUri"
      | "motorcycleRegistrationUri",
    allowCamera = false
  ) => {
    const uri = await pickImageAsync(allowCamera);
    if (uri) {
      setFormData((prev) => ({ ...prev, [field]: uri }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      if (authError) throw authError;
      if (!user) throw new Error("User creation failed");

      const userId = user.id;

      const proofIdUrl = formData.proofIdUri
        ? await uploadImageToSupabase(formData.proofIdUri, userId, "proof-id")
        : null;
      if (!proofIdUrl) throw new Error("Proof ID upload failed");
      const licenseUrl = formData.driversLicenseUri
        ? await uploadImageToSupabase(
            formData.driversLicenseUri,
            userId,
            "drivers-license"
          )
        : null;
      if (!licenseUrl) throw new Error("License upload failed");
      const selfieUrl = formData.selfieWithIdUri
        ? await uploadImageToSupabase(
            formData.selfieWithIdUri,
            userId,
            "selfie-with-id"
          )
        : null;
      if (!selfieUrl) throw new Error("Selfie upload failed");
      const registrationUrl = formData.motorcycleRegistrationUri
        ? await uploadImageToSupabase(
            formData.motorcycleRegistrationUri,
            userId,
            "motorcycle-registration"
          )
        : null;

      const { error: dbError } = await supabase.from("riders").insert({
        user_id: userId,
        name: formData.name,
        mobile_number: formData.mobileNumber,
        email: formData.email,
        address: formData.address,
        emergency_contact_person: formData.emergencyContactPerson,
        emergency_contact_number: formData.emergencyContactNumber,
        vehicle_type: formData.vehicleType,
        vehicle_plate_number: formData.vehiclePlateNumber,
        proof_id_url: proofIdUrl,
        drivers_license_url: licenseUrl,
        selfie_url: selfieUrl,
        motorcycle_registration_url: registrationUrl,
        status: "pending",
      });
      if (dbError) throw dbError;

      showSuccess("Registration submitted successfully! Awaiting approval.");
      router.replace("/login");
    } catch (err: any) {
      showError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepper = () => (
    <View style={styles.stepper}>
      {[1, 2, 3, 4].map((s) => (
        <View
          key={s}
          style={[styles.stepDot, step >= s ? styles.activeStepDot : null]}
        />
      ))}
    </View>
  );

  const renderPersonalInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 1: Personal Information</Text>
      <TextInput
        style={[styles.input, errors.name ? styles.inputError : null]}
        placeholder="Name"
        value={formData.name}
        onChangeText={(v) => setFormData((p) => ({ ...p, name: v }))}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      <TextInput
        style={[styles.input, errors.mobileNumber ? styles.inputError : null]}
        placeholder="Mobile Number (e.g., +639123456789)"
        keyboardType="phone-pad"
        value={formData.mobileNumber}
        onChangeText={(v) => setFormData((p) => ({ ...p, mobileNumber: v }))}
      />
      {errors.mobileNumber && (
        <Text style={styles.errorText}>{errors.mobileNumber}</Text>
      )}
      <TextInput
        style={[styles.input, errors.email ? styles.inputError : null]}
        placeholder="Email Address"
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(v) => setFormData((p) => ({ ...p, email: v }))}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      <TextInput
        style={[styles.input, errors.password ? styles.inputError : null]}
        placeholder="Password"
        secureTextEntry
        value={formData.password}
        onChangeText={(v) => setFormData((p) => ({ ...p, password: v }))}
      />
      {errors.password && (
        <Text style={styles.errorText}>{errors.password}</Text>
      )}
      <TextInput
        style={[styles.input, errors.address ? styles.inputError : null]}
        placeholder="Address"
        value={formData.address}
        onChangeText={(v) => setFormData((p) => ({ ...p, address: v }))}
      />
      {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
      <TextInput
        style={[
          styles.input,
          errors.emergencyContactPerson ? styles.inputError : null,
        ]}
        placeholder="Emergency Contact Person"
        value={formData.emergencyContactPerson}
        onChangeText={(v) =>
          setFormData((p) => ({ ...p, emergencyContactPerson: v }))
        }
      />
      {errors.emergencyContactPerson && (
        <Text style={styles.errorText}>{errors.emergencyContactPerson}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          errors.emergencyContactNumber ? styles.inputError : null,
        ]}
        placeholder="Emergency Contact Number (e.g., +639123456789)"
        keyboardType="phone-pad"
        value={formData.emergencyContactNumber}
        onChangeText={(v) =>
          setFormData((p) => ({ ...p, emergencyContactNumber: v }))
        }
      />
      {errors.emergencyContactNumber && (
        <Text style={styles.errorText}>{errors.emergencyContactNumber}</Text>
      )}
    </View>
  );

  const renderVehicleInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 2: Vehicle Information</Text>
      <TextInput
        style={[styles.input, errors.vehicleType ? styles.inputError : null]}
        placeholder="Vehicle Type"
        value={formData.vehicleType}
        onChangeText={(v) => setFormData((p) => ({ ...p, vehicleType: v }))}
      />
      {errors.vehicleType && (
        <Text style={styles.errorText}>{errors.vehicleType}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          errors.vehiclePlateNumber ? styles.inputError : null,
        ]}
        placeholder="Vehicle Plate Number"
        value={formData.vehiclePlateNumber}
        onChangeText={(v) =>
          setFormData((p) => ({ ...p, vehiclePlateNumber: v }))
        }
      />
      {errors.vehiclePlateNumber && (
        <Text style={styles.errorText}>{errors.vehiclePlateNumber}</Text>
      )}
    </View>
  );

  const renderVerification = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 3: Verification</Text>
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => handleImagePick("proofIdUri")}
      >
        <Text style={styles.uploadText}>
          Proof of Identification (National ID etc.)
        </Text>
      </TouchableOpacity>
      {formData.proofIdUri && (
        <Image
          source={{ uri: formData.proofIdUri }}
          style={styles.imagePreview}
        />
      )}
      {errors.proofIdUri && (
        <Text style={styles.errorText}>{errors.proofIdUri}</Text>
      )}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => handleImagePick("driversLicenseUri")}
      >
        <Text style={styles.uploadText}>Upload Driver’s License</Text>
      </TouchableOpacity>
      {formData.driversLicenseUri && (
        <Image
          source={{ uri: formData.driversLicenseUri }}
          style={styles.imagePreview}
        />
      )}
      {errors.driversLicenseUri && (
        <Text style={styles.errorText}>{errors.driversLicenseUri}</Text>
      )}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => handleImagePick("selfieWithIdUri", true)}
      >
        <Text style={styles.uploadText}>Selfie with ID</Text>
      </TouchableOpacity>
      {formData.selfieWithIdUri && (
        <Image
          source={{ uri: formData.selfieWithIdUri }}
          style={styles.imagePreview}
        />
      )}
      {errors.selfieWithIdUri && (
        <Text style={styles.errorText}>{errors.selfieWithIdUri}</Text>
      )}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => handleImagePick("motorcycleRegistrationUri")}
      >
        <Text style={styles.uploadText}>Optional: Motorcycle Registration</Text>
      </TouchableOpacity>
      {formData.motorcycleRegistrationUri && (
        <Image
          source={{ uri: formData.motorcycleRegistrationUri }}
          style={styles.imagePreview}
        />
      )}
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Step 4: Confirmation</Text>
      <View style={styles.checkboxRow}>
        <Switch
          value={formData.termsAccepted}
          onValueChange={(v) =>
            setFormData((p) => ({ ...p, termsAccepted: v }))
          }
        />
        <Text style={styles.checkboxLabel}>
          I accept the Terms & Conditions
        </Text>
      </View>
      {errors.termsAccepted && (
        <Text style={styles.errorText}>{errors.termsAccepted}</Text>
      )}
      <View style={styles.checkboxRow}>
        <Switch
          value={formData.consentAccepted}
          onValueChange={(v) =>
            setFormData((p) => ({ ...p, consentAccepted: v }))
          }
        />
        <Text style={styles.checkboxLabel}>
          I agree to the Agreement and Consent
        </Text>
      </View>
      {errors.consentAccepted && (
        <Text style={styles.errorText}>{errors.consentAccepted}</Text>
      )}
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {renderStepper()}
      {step === Step.PersonalInfo && renderPersonalInfo()}
      {step === Step.VehicleInfo && renderVehicleInfo()}
      {step === Step.Verification && renderVerification()}
      {step === Step.Confirmation && renderConfirmation()}
      <View style={styles.navigationButtons}>
        {step > Step.PersonalInfo && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handlePrevStep}
            disabled={loading}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextStep}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Submitting..."
              : step === Step.Confirmation
                ? "Register"
                : "Next"}
          </Text>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Same as VendorRegistration styles above
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  stepper: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ddd",
    marginHorizontal: 5,
  },
  activeStepDot: {
    backgroundColor: COLORS.light.primary,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#000",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  uploadText: {
    fontSize: 16,
    color: "#666",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.light.primary,
    borderRadius: 8,
  },
  buttonText: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff", // Adjust for back button if needed
  },
});
export default RiderRegistrationScreen;