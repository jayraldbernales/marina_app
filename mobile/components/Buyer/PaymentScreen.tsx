import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons, Feather, FontAwesome5 } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { COLORS } from "@/constants";

type PaymentParams = {
  orderId?: string;
  orderNumber?: string;
  productId: string;
  vendorUserId: string;
  quantity: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  specialInstructions?: string;
  addressId: string;
};

const GcashPaymentScreen = () => {
  const params = useLocalSearchParams<PaymentParams>();
  const user = useUserStore((state) => state.user);

  // Parse params
  const orderId = params.orderId;
  const orderNumber = params.orderNumber;
  const productId = params.productId;
  const vendorUserId = params.vendorUserId;
  const quantity = parseInt(params.quantity || "1");
  const subtotal = parseFloat(params.subtotal || "0");
  const deliveryFee = parseFloat(params.deliveryFee || "50");
  const total = parseFloat(params.total || "0");
  const specialInstructions = params.specialInstructions || "";
  const addressId = params.addressId;

  // State
  const [loading, setLoading] = useState(false);
  const [vendor, setVendor] = useState<any>(null);
  const [gcashReference, setGcashReference] = useState("");
  const [gcashScreenshot, setGcashScreenshot] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load vendor data on mount
  React.useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("shop_name, gcash_number, gcash_name")
        .eq("user_id", vendorUserId)
        .maybeSingle();

      if (error) throw error;
      setVendor(data);
    } catch (error) {
      console.error("Error loading vendor:", error);
      Alert.alert("Error", "Failed to load vendor payment details");
    } finally {
      setLoading(false);
    }
  };

  // Upload screenshot to Supabase Storage
  const uploadScreenshot = async (uri: string): Promise<string> => {
    try {
      const fileName = `gcash-proof-${Date.now()}.jpg`;
      const filePath = `${user?.id}/${fileName}`;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const binaryData = atob(base64);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }

      const { error } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, bytes, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) throw error;

      const { data: publicData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    } catch (error) {
      console.error("Error uploading screenshot:", error);
      throw error;
    }
  };

  // Handle screenshot upload
  const handleScreenshotUpload = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setGcashScreenshot(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select screenshot");
    }
  };

  // Take photo with camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow camera access.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setGcashScreenshot(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  // Show image source options
  const showImageSourceOptions = () => {
    Alert.alert(
      "Upload Payment Proof",
      "Choose how you want to provide your GCash payment screenshot",
      [
        { text: "Take Photo", onPress: handleTakePhoto },
        { text: "Choose from Gallery", onPress: handleScreenshotUpload },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handleBackToPrevious = () => {
    router.back();
  };

  // Submit GCash payment proof
  const handleSubmitPayment = async () => {
    if (!gcashReference.trim()) {
      Alert.alert("Error", "Please enter GCash reference number");
      return;
    }

    if (!gcashScreenshot) {
      Alert.alert("Error", "Please upload payment screenshot");
      return;
    }

    setIsUploading(true);

    try {
      // Upload screenshot
      const screenshotUrl = await uploadScreenshot(gcashScreenshot);

      if (orderId) {
        // Update existing order with payment proof
        const { error } = await supabase
          .from("orders")
          .update({
            payment_proof_url: screenshotUrl,
            gcash_reference: gcashReference,
            payment_status: "pending_verification",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId);

        if (error) throw error;

        Alert.alert(
          "Payment Submitted Successfully!",
          `Your payment proof for order #${orderNumber} has been submitted. The vendor will verify it within 15-30 minutes.`,
          [
            {
              text: "View Order",
              onPress: () => router.push("/(tabs)/orders"),
            },
          ],
        );
      } else {
        // Create new order with payment proof (direct order)
        const { data: addressData } = await supabase
          .from("addresses")
          .select("address_id")
          .eq("user_id", user?.id)
          .eq("is_default", true)
          .maybeSingle();

        if (!addressData) {
          Alert.alert("Error", "No default address found.");
          return;
        }

        const { data: newOrderId, error: rpcError } = await supabase.rpc(
          "place_direct_order",
          {
            p_user_id: user?.id,
            p_vendor_user_id: vendorUserId,
            p_product_id: productId,
            p_address_id: addressData.address_id,
            p_quantity: quantity,
            p_payment_method: "gcash",
            p_order_total: total,
            p_delivery_fee: deliveryFee,
            p_note: specialInstructions || null,
            p_payment_proof_url: screenshotUrl,
            p_gcash_reference: gcashReference,
          },
        );

        if (rpcError) throw rpcError;

        Alert.alert(
          "Order Placed Successfully!",
          `Your order has been placed and payment proof submitted. The vendor will verify it within 15-30 minutes.`,
          [
            {
              text: "View Order",
              onPress: () => router.push("/(tabs)/orders"),
            },
          ],
        );
      }
    } catch (error: any) {
      console.error("Payment submission error:", error);
      Alert.alert("Error", `Failed to submit payment: ${error.message}`);
    } finally {
      setIsUploading(false);
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
          onPress={handleBackToPrevious}
          style={styles.headerBackBtn}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitleCart}>GCash Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>₱{total.toLocaleString()}</Text>
        </View>

        {/* Vendor Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pay to</Text>

          <View style={styles.row}>
            <FontAwesome5
              name="store"
              size={16}
              color={COLORS.light.primary}
              solid
            />
            <Text style={styles.rowLabel}>Shop:</Text>
            <Text style={styles.rowValue}>{vendor?.shop_name}</Text>
          </View>

          <View style={styles.row}>
            <FontAwesome5
              name="user"
              size={16}
              color={COLORS.light.primary}
              solid
            />
            <Text style={styles.rowLabel}>GCash Name:</Text>
            <Text style={styles.rowValue}>
              {vendor?.gcash_name || vendor?.shop_name}
            </Text>
          </View>

          <View style={styles.row}>
            <FontAwesome5
              name="mobile-alt"
              size={16}
              color={COLORS.light.primary}
              solid
            />
            <Text style={styles.rowLabel}>GCash Number:</Text>
            <Text style={styles.rowValueHighlight}>
              {vendor?.gcash_number || "N/A"}
            </Text>
          </View>
        </View>

        {/* Quick Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to pay:</Text>
          <Text style={styles.instruction}>
            1. Send exact amount to GCash number above
          </Text>
          <Text style={styles.instruction}>
            2. Take screenshot of confirmation
          </Text>
          <Text style={styles.instruction}>
            3. Enter reference number below
          </Text>
          <Text style={styles.instruction}>
            4. Upload screenshot and submit
          </Text>
        </View>

        {/* Reference Number Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reference Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 1234567890123456"
            placeholderTextColor="#999"
            value={gcashReference}
            onChangeText={setGcashReference}
            keyboardType="numeric"
          />
        </View>

        {/* Screenshot Upload */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Payment Screenshot</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={showImageSourceOptions}
          >
            {gcashScreenshot ? (
              <Image
                source={{ uri: gcashScreenshot }}
                style={styles.screenshotPreview}
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Feather name="camera" size={28} color="#999" />
                <Text style={styles.uploadText}>Tap to upload</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Verification Note */}
        <View style={styles.noteBox}>
          <Ionicons
            name="time-outline"
            size={18}
            color={COLORS.light.primary}
          />
          <Text style={styles.noteText}>
            Vendor verifies payment (15-30 mins)
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!gcashReference || !gcashScreenshot || isUploading) &&
              styles.disabledButton,
          ]}
          onPress={handleSubmitPayment}
          disabled={!gcashReference || !gcashScreenshot || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Payment</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.common.white,
    paddingTop: 48,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#cce3de",
  },
  headerBackBtn: { marginRight: 12, color: COLORS.light.primary },
  headerTitleCart: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  amountCard: {
    backgroundColor: COLORS.light.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  rowLabel: {
    fontSize: 14,
    color: "#666",
    width: 85,
    marginLeft: 8,
  },
  rowValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  rowValueHighlight: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.light.primary,
    flex: 1,
  },
  instructionsCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  instruction: {
    fontSize: 13,
    color: "#666",
    marginVertical: 2,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },
  uploadPlaceholder: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    marginTop: 6,
    fontSize: 13,
    color: "#999",
  },
  screenshotPreview: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  noteBox: {
    flexDirection: "row",
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 13,
    color: COLORS.light.primary,
  },
  submitButton: {
    backgroundColor: COLORS.light.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default GcashPaymentScreen;
