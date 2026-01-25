import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system";

/* ================================
   Types for registration data
================================ */

export interface VendorRegistrationData {
  shopName: string;
  email: string;
  mobile: string;
  gcash: string;
  barangay: string;
  purok: string;
  municipality: string;
  validIdFrontImage: string;
  validIdBackImage: string | null;
  selfieImage: string;
  optionalDoc: string | null;
  idType: string;
  acceptedTerms: boolean;
  acceptedConsent: boolean;
}

export interface RiderRegistrationData {
  email: string;
  mobile: string;
  gcashNumber: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  barangay: string;
  purok: string;
  municipality: string;
  vehicleType: string;
  plateNumber: string;
  driversLicenseFrontImage: string;
  driversLicenseBackImage: string | null;
  selfieWithIdImage: string;
  motorcycleRegistrationImage: string | null;
  acceptedTerms: boolean;
  acceptedConsent: boolean;
}

/* ================================
   Upload image to Supabase Storage
================================ */

export const uploadImageToStorage = async (
  imageUri: string,
  bucket: string,
  fileName: string,
): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const binaryData = atob(base64);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, bytes, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) throw error;

    // IMPORTANT:
    // Store ONLY the bucket-relative path
    return fileName;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

/* ================================
   Vendor Registration
================================ */

export const saveVendorRegistration = async (
  userId: string,
  data: VendorRegistrationData,
): Promise<void> => {
  try {
    const timestamp = Date.now();

    const validIdFrontUrl = await uploadImageToStorage(
      data.validIdFrontImage,
      "verifications",
      `vendor/${userId}/valid-id-front-${timestamp}.jpg`,
    );

    let validIdBackUrl: string | null = null;
    if (data.validIdBackImage) {
      validIdBackUrl = await uploadImageToStorage(
        data.validIdBackImage,
        "verifications",
        `vendor/${userId}/valid-id-back-${timestamp}.jpg`,
      );
    }

    const selfieUrl = await uploadImageToStorage(
      data.selfieImage,
      "verifications",
      `vendor/${userId}/selfie-${timestamp}.jpg`,
    );

    let optionalDocUrl: string | null = null;
    if (data.optionalDoc) {
      optionalDocUrl = await uploadImageToStorage(
        data.optionalDoc,
        "verifications",
        `vendor/${userId}/optional-doc-${timestamp}.jpg`,
      );
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ mobile_number: data.mobile })
      .eq("user_id", userId);

    if (profileError) throw profileError;

    const { error: vendorError } = await supabase
      .from("vendor_profiles")
      .insert([
        {
          user_id: userId,
          shop_name: data.shopName,
          gcash_number: data.gcash,
          approval_status: "pending",
          agreed_to_terms: data.acceptedTerms,
          created_at: new Date().toISOString(),
        },
      ]);

    if (vendorError) throw vendorError;

    const { error: addressError } = await supabase.from("addresses").insert([
      {
        user_id: userId,
        full_address: `${data.purok}, ${data.barangay}, ${data.municipality}`,
        purok: data.purok,
        barangay: data.barangay,
        municipality: data.municipality,
        address_type: "business",
        is_default: true,
        created_at: new Date().toISOString(),
      },
    ]);

    if (addressError) throw addressError;

    const verifications = [
      {
        user_id: userId,
        document_type: `id-front-${data.idType}`,
        file_url: validIdFrontUrl,
        status: "pending",
        is_required: true,
        uploaded_at: new Date().toISOString(),
      },
      {
        user_id: userId,
        document_type: "selfie-with-id",
        file_url: selfieUrl,
        status: "pending",
        is_required: true,
        uploaded_at: new Date().toISOString(),
      },
    ];

    if (validIdBackUrl) {
      verifications.push({
        user_id: userId,
        document_type: `id-back-${data.idType}`,
        file_url: validIdBackUrl,
        status: "pending",
        is_required: true,
        uploaded_at: new Date().toISOString(),
      });
    }

    if (optionalDocUrl) {
      verifications.push({
        user_id: userId,
        document_type: "optional-document",
        file_url: optionalDocUrl,
        status: "pending",
        is_required: false,
        uploaded_at: new Date().toISOString(),
      });
    }

    const { error: verificationsError } = await supabase
      .from("user_verifications")
      .insert(verifications);

    if (verificationsError) throw verificationsError;
  } catch (error) {
    console.error("Error saving vendor registration:", error);
    throw error;
  }
};

/* ================================
   Rider Registration
================================ */

export const saveRiderRegistration = async (
  userId: string,
  data: RiderRegistrationData,
): Promise<void> => {
  try {
    const timestamp = Date.now();

    const driversLicenseFrontUrl = await uploadImageToStorage(
      data.driversLicenseFrontImage,
      "verifications",
      `rider/${userId}/drivers-license-front-${timestamp}.jpg`,
    );

    let driversLicenseBackUrl: string | null = null;
    if (data.driversLicenseBackImage) {
      driversLicenseBackUrl = await uploadImageToStorage(
        data.driversLicenseBackImage,
        "verifications",
        `rider/${userId}/drivers-license-back-${timestamp}.jpg`,
      );
    }

    const selfieUrl = await uploadImageToStorage(
      data.selfieWithIdImage,
      "verifications",
      `rider/${userId}/selfie-with-id-${timestamp}.jpg`,
    );

    let motorcycleRegistrationUrl: string | null = null;
    if (data.motorcycleRegistrationImage) {
      motorcycleRegistrationUrl = await uploadImageToStorage(
        data.motorcycleRegistrationImage,
        "verifications",
        `rider/${userId}/motorcycle-registration-${timestamp}.jpg`,
      );
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ mobile_number: data.mobile })
      .eq("user_id", userId);

    if (profileError) throw profileError;

    const { error: riderError } = await supabase.from("rider_profiles").insert([
      {
        user_id: userId,
        vehicle_type: data.vehicleType,
        license_plate: data.plateNumber,
        gcash_number: data.gcashNumber,
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_number: data.emergencyContactNumber,
        approval_status: "pending",
        agreed_to_terms: data.acceptedTerms,
        is_available: false,
        created_at: new Date().toISOString(),
      },
    ]);

    if (riderError) throw riderError;

    const { error: addressError } = await supabase.from("addresses").insert([
      {
        user_id: userId,
        full_address: `${data.purok}, ${data.barangay}, ${data.municipality}`,
        purok: data.purok,
        barangay: data.barangay,
        municipality: data.municipality,
        address_type: "residential",
        is_default: true,
        created_at: new Date().toISOString(),
      },
    ]);

    if (addressError) throw addressError;

    const verifications = [
      {
        user_id: userId,
        document_type: "drivers-license-front",
        file_url: driversLicenseFrontUrl,
        status: "pending",
        is_required: true,
        uploaded_at: new Date().toISOString(),
      },
      {
        user_id: userId,
        document_type: "selfie-with-drivers-license",
        file_url: selfieUrl,
        status: "pending",
        is_required: true,
        uploaded_at: new Date().toISOString(),
      },
    ];

    if (driversLicenseBackUrl) {
      verifications.push({
        user_id: userId,
        document_type: "drivers-license-back",
        file_url: driversLicenseBackUrl,
        status: "pending",
        is_required: false,
        uploaded_at: new Date().toISOString(),
      });
    }

    if (motorcycleRegistrationUrl) {
      verifications.push({
        user_id: userId,
        document_type: "motorcycle-registration",
        file_url: motorcycleRegistrationUrl,
        status: "pending",
        is_required: false,
        uploaded_at: new Date().toISOString(),
      });
    }

    const { error: verificationsError } = await supabase
      .from("user_verifications")
      .insert(verifications);

    if (verificationsError) throw verificationsError;
  } catch (error) {
    console.error("Error saving rider registration:", error);
    throw error;
  }
};
