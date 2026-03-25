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
import { createNotificationWithPush } from "@/services/notificationService";

type VendorPayment = {
  vendorUserId: string;
  shopName: string;
  gcashNumber: string;
  gcashName: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: any[];
  orderId?: string;
  orderNumber?: string;
};

type MultiVendorPaymentParams = {
  orders: string; // JSON string of orders
  addressId: string;
  specialInstructions?: string;
};

const MultiVendorGcashPaymentScreen = () => {
  const params = useLocalSearchParams<MultiVendorPaymentParams>();
  const user = useUserStore((state) => state.user);

  // Parse orders from JSON
  const orders: VendorPayment[] = JSON.parse(params.orders || "[]");
  const addressId = params.addressId;
  const specialInstructions = params.specialInstructions || "";

  // State
  const [loading, setLoading] = useState(false);
  const [currentVendorIndex, setCurrentVendorIndex] = useState(0);
  const [vendorPayments, setVendorPayments] = useState<VendorPayment[]>(orders);
  const [gcashReference, setGcashReference] = useState("");
  const [gcashScreenshot, setGcashScreenshot] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentVendor = vendorPayments[currentVendorIndex];
  const totalPaid = vendorPayments.reduce((sum, v) => sum + v.total, 0);
  const completedCount = vendorPayments.filter((v) => v.orderId).length;

  // Upload screenshot to Supabase Storage
  const uploadScreenshot = async (uri: string): Promise<string> => {
    try {
      const fileName = `gcash-proof-${currentVendor.vendorUserId}-${Date.now()}.jpg`;
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

  // Submit payment for current vendor
  const handleSubmitVendorPayment = async () => {
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

      // Create order for this vendor with payment proof
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      const { data: newOrderId, error: rpcError } = await supabase.rpc(
        "place_cart_order",
        {
          p_order_number: orderNumber,
          p_user_id: user?.id,
          p_vendor_user_id: currentVendor.vendorUserId,
          p_address_id: addressId,
          p_payment_method: "gcash",
          p_order_total: currentVendor.total,
          p_delivery_fee: currentVendor.deliveryFee,
          p_note: specialInstructions,
          p_cart_item_ids: currentVendor.items.map((item) => item.cartItemId),
          p_payment_proof_url: screenshotUrl,
          p_gcash_reference: gcashReference,
        },
      );

      if (rpcError) throw rpcError;

      // Get order number
      const { data: orderData } = await supabase
        .from("orders")
        .select("order_number, total_amount")
        .eq("order_id", newOrderId)
        .single();

      // ========== SEND PUSH NOTIFICATIONS ==========
      try {
        // Notify vendor
        await createNotificationWithPush(
          {
            userId: currentVendor.vendorUserId,
            userType: "vendor",
            type: "order_paid",
            title: "🛒 New Order with GCash Payment!",
            message: `Order #${orderData?.order_number} - ₱${currentVendor.total.toLocaleString()} (GCash payment)`,
            metadata: {
              order_id: newOrderId,
              order_number: orderData?.order_number,
              total: currentVendor.total,
              shop_name: currentVendor.shopName,
            },
            relatedId: newOrderId,
          },
          true,
        );
        console.log(
          `✅ Push notification sent to vendor ${currentVendor.shopName}`,
        );

        // Notify buyer
        if (user?.id) {
          await createNotificationWithPush(
            {
              userId: user.id,
              userType: "buyer",
              type: "order_placed",
              title: "✅ Order Placed with GCash!",
              message: `Your order for ${currentVendor.shopName} (${orderData?.order_number}) has been placed. Payment pending verification.`,
              metadata: {
                order_id: newOrderId,
                order_number: orderData?.order_number,
                shop_name: currentVendor.shopName,
                total: currentVendor.total,
              },
              relatedId: newOrderId,
            },
            true,
          );
          console.log("✅ Push notification sent to buyer");
        }
      } catch (pushError) {
        console.error("Error sending push notifications:", pushError);
        // Don't block the payment flow if push fails
      }
      // ========== END PUSH NOTIFICATIONS ==========

      // Update state
      const updatedPayments = [...vendorPayments];
      updatedPayments[currentVendorIndex] = {
        ...currentVendor,
        orderId: newOrderId,
        orderNumber: orderData?.order_number,
      };
      setVendorPayments(updatedPayments);

      // Clear inputs for next vendor
      setGcashReference("");
      setGcashScreenshot(null);

      // Move to next vendor or finish
      if (currentVendorIndex < vendorPayments.length - 1) {
        setCurrentVendorIndex(currentVendorIndex + 1);
        Alert.alert(
          "Payment Submitted!",
          `Payment for ${currentVendor.shopName} submitted. Please pay the next vendor.`,
        );
      } else {
        // All vendors paid
        Alert.alert(
          "All Payments Submitted!",
          `All ${vendorPayments.length} payments have been submitted. Vendors will verify within 15-30 minutes.`,
          [
            {
              text: "View Orders",
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

  const handleBackToPrevious = () => {
    router.back();
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

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(completedCount / vendorPayments.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Vendor {currentVendorIndex + 1} of {vendorPayments.length}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>
            Pay to {currentVendor?.shopName}
          </Text>
          <Text style={styles.amountValue}>
            ₱{currentVendor?.total.toLocaleString()}
          </Text>
          <Text style={styles.totalAmount}>
            Total All Vendors: ₱{totalPaid.toLocaleString()}
          </Text>
        </View>

        {/* Vendor Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Details</Text>

          <View style={styles.row}>
            <FontAwesome5
              name="store"
              size={16}
              color={COLORS.light.primary}
              solid
            />
            <Text style={styles.rowLabel}>Shop:</Text>
            <Text style={styles.rowValue}>{currentVendor?.shopName}</Text>
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
              {currentVendor?.gcashName || currentVendor?.shopName}
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
              {currentVendor?.gcashNumber || "N/A"}
            </Text>
          </View>

          {/* Items Summary */}
          <View style={styles.itemsSummary}>
            <Text style={styles.itemsTitle}>Items:</Text>
            {currentVendor?.items.map((item, idx) => (
              <Text key={idx} style={styles.itemText}>
                • {item.name} x{item.quantity} - ₱
                {(item.price * item.quantity).toLocaleString()}
              </Text>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Subtotal:</Text>
            <Text style={styles.rowValue}>
              ₱{currentVendor?.subtotal.toLocaleString()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Delivery Fee:</Text>
            <Text style={styles.rowValue}>₱{currentVendor?.deliveryFee}</Text>
          </View>
        </View>

        {/* Quick Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>How to pay:</Text>
          <Text style={styles.instruction}>
            1. Send ₱{currentVendor?.total.toLocaleString()} to GCash number
            above
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
          onPress={handleSubmitVendorPayment}
          disabled={!gcashReference || !gcashScreenshot || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {currentVendorIndex < vendorPayments.length - 1
                ? "Submit & Pay Next Vendor"
                : "Submit Payment"}
            </Text>
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
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
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
  totalAmount: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
    marginTop: 8,
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
  itemsSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  itemText: {
    fontSize: 13,
    color: "#666",
    marginVertical: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 12,
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

export default MultiVendorGcashPaymentScreen;
