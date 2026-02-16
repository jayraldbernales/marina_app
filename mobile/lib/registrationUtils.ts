// lib/registrationUtils.ts
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { showError } from "../lib/toast"; // Assume your toast lib from previous code

export async function pickImageAsync(
  allowCamera = true
): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    showError("Permission to access camera roll is required!");
    return null;
  }

  if (allowCamera) {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPerm.granted) {
      showError("Permission to access camera is required for selfies!");
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.5,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function uploadImageToSupabase(
  uri: string,
  userId: string,
  fileName: string
): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const fileExt = uri.split(".").pop() || "jpg";
    const filePath = `${userId}/${fileName}.${fileExt}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from("verification-docs") // Ensure this bucket exists in Supabase with proper policies
      .upload(filePath, blob, { contentType: `image/${fileExt}` });

    if (error) throw error;

    const { data } = supabase.storage
      .from("verification-docs")
      .getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err: any) {
    console.error("Upload error:", err);
    showError(err.message || "Image upload failed. Please try again.");
    return null;
  }
}
