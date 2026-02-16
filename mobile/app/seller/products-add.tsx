import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  FlatList,
  ScrollView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../../constants";
import { supabase } from "../../lib/supabase";

/* ---------------------- TYPES ---------------------- */
type Category = {
  category_id: string;
  category_name: string;
};

/* ---------------------- HELPERS ---------------------- */
// Helper to format date for display
const formatDateForDisplay = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Helper to format time for display
const formatTimeForDisplay = (date: Date) => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/* ---------------------- SCREEN ---------------------- */
export default function AddProductScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [harvestDateTime, setHarvestDateTime] = useState<Date>(new Date());
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [showHarvestWarning, setShowHarvestWarning] = useState(false);
  // New state for pre-order
  const [isPreOrder, setIsPreOrder] = useState(false);

  const goBack = useCallback(() => {
    router.back();
  }, []);

  /* ---------------------- FETCH CATEGORIES ---------------------- */
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("category_id, category_name")
        .order("category_name");

      if (error) {
        Alert.alert("Error", "Failed to load categories.");
        return;
      }

      setCategories(data ?? []);
    };

    fetchCategories();
  }, []);

  /* ---------------------- REQUEST PERMISSIONS ---------------------- */
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== "granted" || libraryStatus !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Sorry, we need camera and gallery permissions to make this work!",
        );
      }
    })();
  }, []);

  /* ---------------------- IMAGE PICKER ---------------------- */
  const pickFromGallery = useCallback(async () => {
    setShowImageSourceModal(false);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - images.length, // Limit total images to 10
    });

    if (!result.canceled && result.assets?.length) {
      const newImages = result.assets.map((a) => a.uri);
      const totalImages = images.length + newImages.length;

      if (totalImages > 10) {
        Alert.alert(
          "Maximum Images Reached",
          `You can only upload up to 10 images. You currently have ${images.length} images.`,
        );
        return;
      }

      setImages((prev) => [...prev, ...newImages]);
    }
  }, [images]);

  const takePhoto = useCallback(async () => {
    setShowImageSourceModal(false);

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets?.length) {
      if (images.length >= 10) {
        Alert.alert(
          "Maximum Images Reached",
          "You can only upload up to 10 images. Remove some images first.",
        );
        return;
      }

      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  }, [images]);

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((img) => img !== uri));
  };

  /* ---------------------- STORAGE UPLOAD ---------------------- */
  const uploadImages = async (
    uris: string[],
    vendorId: string,
  ): Promise<string[]> => {
    const publicUrls: string[] = [];

    for (const uri of uris) {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const ext = uri.split(".").pop()?.split("?")[0] ?? "jpg";
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const path = `products/${vendorId}/${fileName}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, arrayBuffer, {
          contentType: `image/${ext}`,
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      if (!data?.publicUrl) {
        throw new Error("Failed to generate public URL");
      }

      publicUrls.push(data.publicUrl);
    }

    return publicUrls;
  };

  /* ---------------------- HANDLE DATE/TIME PICKER ---------------------- */
  const showDatePicker = () => {
    setPickerMode("date");
    setShowDateTimePicker(true);
  };

  const showTimePicker = () => {
    setPickerMode("time");
    setShowDateTimePicker(true);
  };

  const handleDateTimeChange = (event: any, selectedDate?: Date) => {
    setShowDateTimePicker(Platform.OS === "ios");

    if (selectedDate) {
      if (pickerMode === "date") {
        // Update date but keep the time
        const currentTime = harvestDateTime;
        selectedDate.setHours(
          currentTime.getHours(),
          currentTime.getMinutes(),
          currentTime.getSeconds(),
        );
      } else {
        // Update time but keep the date
        const currentDate = harvestDateTime;
        currentDate.setHours(
          selectedDate.getHours(),
          selectedDate.getMinutes(),
          selectedDate.getSeconds(),
        );
        selectedDate = currentDate;
      }
      setHarvestDateTime(selectedDate);
    }
  };

  // Show harvest date warning modal
  const showHarvestDateWarning = () => {
    setShowHarvestWarning(true);
  };

  /* ---------------------- SAVE PRODUCT ---------------------- */
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Product name is required.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Validation", "Description is required.");
      return;
    }

    if (!categoryId) {
      Alert.alert("Validation", "Category is required.");
      return;
    }

    const priceNum = Number(price);
    const stockNum = Number(stock || 0);

    if (Number.isNaN(priceNum) || Number.isNaN(stockNum)) {
      Alert.alert("Validation", "Invalid numeric values.");
      return;
    }

    // For pre-orders, validate that harvest date is in the future
    if (isPreOrder && harvestDateTime <= new Date()) {
      Alert.alert(
        "Validation",
        "For pre-orders, harvest date must be in the future.",
      );
      return;
    }

    try {
      setSaving(true);
      setUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }

      const imageUrls =
        images.length > 0 ? await uploadImages(images, user.id) : [];

      // Format the harvested_at timestamp in ISO 8601 format for Supabase
      const harvestedAtISO = harvestDateTime.toISOString();

      const insertObj = {
        product_name: name.trim(),
        description: description.trim(),
        price: priceNum,
        stock: stockNum,
        unit: "kg",
        harvested_at: harvestedAtISO, // Using timestampz
        category_id: categoryId,
        images: imageUrls,
        is_active: true,
        vendor_user_id: user.id,
      };

      const { error } = await supabase.from("products").insert(insertObj);

      if (error) {
        console.error("Supabase error:", error);
        Alert.alert("Error", "Failed to create product.");
        return;
      }

      Alert.alert(
        "Success",
        isPreOrder
          ? "Pre-order product created successfully!"
          : "Product created successfully!",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(seller-tabs)/products?refresh=1"),
          },
        ],
      );
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }, [
    name,
    description,
    price,
    stock,
    categoryId,
    images,
    harvestDateTime,
    isPreOrder,
  ]);

  /* ---------------------- IMAGE SOURCE MODAL ---------------------- */
  const renderImageSourceModal = () => (
    <Modal
      transparent={true}
      visible={showImageSourceModal}
      animationType="slide"
      onRequestClose={() => setShowImageSourceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Photos</Text>
            <TouchableOpacity
              onPress={() => setShowImageSourceModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            Choose how you want to add photos
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
                Select photos from your device
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          <View style={styles.imageLimitInfo}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#64748b"
            />
            <Text style={styles.imageLimitText}>
              Maximum 10 images allowed. Currently have {images.length} of 10.
            </Text>
          </View>

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

  /* ---------------------- HARVEST DATE WARNING MODAL ---------------------- */
  const renderHarvestWarningModal = () => (
    <Modal
      transparent={true}
      visible={showHarvestWarning}
      animationType="fade"
      onRequestClose={() => setShowHarvestWarning(false)}
    >
      <View style={styles.warningModalOverlay}>
        <View style={styles.warningModalContent}>
          <View style={styles.warningModalHeader}>
            <Ionicons name="warning" size={32} color="#f59e0b" />
            <Text style={styles.warningModalTitle}>Important Notice</Text>
          </View>

          <Text style={styles.warningModalText}>
            The harvest date and time you set{" "}
            <Text style={styles.warningModalTextBold}>
              cannot be edited later
            </Text>
            .
          </Text>

          <Text style={styles.warningModalText}>
            Once the product is created, the harvest timestamp will be
            permanently recorded and cannot be changed.
          </Text>

          <Text style={styles.warningModalText}>
            If you make a mistake, you will need to delete the product and
            create a new one.
          </Text>

          <View style={styles.warningModalActions}>
            <TouchableOpacity
              style={styles.warningModalCancelButton}
              onPress={() => setShowHarvestWarning(false)}
            >
              <Text style={styles.warningModalCancelButtonText}>
                I Understand
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  /* ---------------------- UI ---------------------- */
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {/* Pre-order Toggle - NEW SECTION */}
          <View style={styles.inputGroup}>
            <View style={styles.preOrderContainer}>
              <TouchableOpacity
                onPress={() => setIsPreOrder(!isPreOrder)}
                style={[
                  styles.toggleButton,
                  isPreOrder && styles.toggleButtonActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleIndicator,
                    isPreOrder && styles.toggleIndicatorActive,
                  ]}
                />
              </TouchableOpacity>
              <View style={styles.preOrderHeader}>
                <Text style={styles.preOrderTitle}>
                  This is a pre-order product
                </Text>
              </View>
            </View>

            {isPreOrder && (
              <View style={styles.preOrderInfo}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#2563eb"
                />
                <Text style={styles.preOrderInfoText}>
                  This product will be listed as a pre-order.
                </Text>
              </View>
            )}
          </View>
          {/* Product Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Product Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="e.g., Bangus"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              style={[styles.input, styles.textArea]}
              placeholder="Describe your product (quality, freshness, etc.)"
            />
          </View>

          {/* Harvest Date & Time */}
          <View style={styles.inputGroup}>
            <View style={styles.harvestHeader}>
              <Text style={styles.inputLabel}>
                {isPreOrder
                  ? "Expected Harvest Date & Time *"
                  : "Harvest Date & Time *"}
              </Text>
              <TouchableOpacity onPress={showHarvestDateWarning}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#f59e0b"
                  marginBottom={4}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.datetimeContainer}>
              <TouchableOpacity
                onPress={showDatePicker}
                style={[styles.datetimeButton, { flex: 1, marginRight: 8 }]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.light.primary}
                />
                <Text style={styles.datetimeText}>
                  {formatDateForDisplay(harvestDateTime)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={showTimePicker}
                style={[styles.datetimeButton, { flex: 1, marginLeft: 8 }]}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={COLORS.light.primary}
                />
                <Text style={styles.datetimeText}>
                  {formatTimeForDisplay(harvestDateTime)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Harvest Date Warning Notice */}
            <View style={styles.harvestWarningNotice}>
              <Ionicons name="alert-circle-outline" size={16} color="#f59e0b" />
              <Text style={styles.harvestWarningText}>
                This date cannot be edited after saving. Double-check before
                proceeding.
              </Text>
            </View>

            {showDateTimePicker && (
              <DateTimePicker
                value={harvestDateTime}
                mode={pickerMode}
                maximumDate={isPreOrder ? undefined : new Date()}
                minimumDate={isPreOrder ? new Date() : undefined}
                onChange={handleDateTimeChange}
              />
            )}
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category *</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.category_id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setCategoryId(item.category_id)}
                  style={[
                    styles.categoryButton,
                    categoryId === item.category_id &&
                      styles.categoryButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      categoryId === item.category_id &&
                        styles.categoryButtonTextActive,
                    ]}
                  >
                    {item.category_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Price & Stock */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Price (per kg) *</Text>
              <View style={styles.amountInput}>
                <Text style={styles.currencySymbol}>₱</Text>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  style={[styles.input, { paddingLeft: 30 }]}
                  placeholder="0.00"
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Stock *</Text>
              <TextInput
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
                style={styles.input}
                placeholder="0"
              />
            </View>
          </View>
        </View>

        {/* Images Card */}
        <View style={styles.card}>
          <View style={styles.imagesHeader}>
            <Text style={styles.cardTitle}>Product Images</Text>
            {images.length > 0 && (
              <Text style={styles.imagesCountBadge}>{images.length}/10</Text>
            )}
          </View>

          <Text style={styles.helperText}>
            Add clear photos of your product from different angles
          </Text>

          {/* Image Upload Button */}
          <TouchableOpacity
            onPress={() => setShowImageSourceModal(true)}
            style={[
              styles.uploadCard,
              images.length >= 10 && styles.uploadCardDisabled,
            ]}
            disabled={images.length >= 10}
          >
            <View style={styles.uploadContent}>
              {images.length >= 10 ? (
                <>
                  <Ionicons
                    name="alert-circle-outline"
                    size={32}
                    color="#f59e0b"
                  />
                  <Text style={styles.uploadText}>Maximum Reached</Text>
                  <Text style={styles.uploadSubtext}>
                    Remove some images to add more
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="camera"
                    size={32}
                    color={COLORS.light.primary}
                  />
                  <Text style={styles.uploadText}>Add Photos</Text>
                  <Text style={styles.uploadSubtext}>
                    Tap to choose from camera or gallery
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <View style={styles.imagesContainer}>
              <FlatList
                data={images}
                numColumns={3}
                scrollEnabled={false}
                keyExtractor={(item, index) => `${item}-${index}`}
                columnWrapperStyle={{ gap: 8 }}
                contentContainerStyle={{ gap: 8 }}
                renderItem={({ item }) => (
                  <View style={styles.imageItem}>
                    <Image source={{ uri: item }} style={styles.imagePreview} />
                    <TouchableOpacity
                      onPress={() => removeImage(item)}
                      style={styles.removeImageButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}
              />
              <Text style={styles.imageCount}>
                {images.length} {images.length === 1 ? "photo" : "photos"}{" "}
                selected
              </Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || uploading}
          style={[
            styles.saveButton,
            (saving || uploading) && styles.disabledButton,
          ]}
        >
          {saving || uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>
                {isPreOrder ? "Create Pre-order" : "Save Product"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Helper Text */}
        <Text style={styles.bottomHelperText}>* Required fields</Text>
      </ScrollView>

      {/* Image Source Modal */}
      {renderImageSourceModal()}

      {/* Harvest Date Warning Modal */}
      {renderHarvestWarningModal()}
    </SafeAreaView>
  );
}

/* ---------------------- STYLES ---------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.common.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0f2ed",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.light.primary,
  },
  imagesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  imagesCountBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.light.primary,
    backgroundColor: "#e0f2ed",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
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
  harvestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  datetimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  datetimeButton: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  datetimeText: {
    fontSize: 15,
    color: COLORS.light.primary,
    fontWeight: "500",
  },
  harvestWarningNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#fef3c7",
    gap: 8,
  },
  harvestWarningText: {
    fontSize: 12,
    color: "#92400e",
    flex: 1,
    lineHeight: 16,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    fontSize: 15,
    color: COLORS.light.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountInput: {
    position: "relative",
  },
  currencySymbol: {
    position: "absolute",
    left: 14,
    top: 14,
    fontSize: 15,
    color: COLORS.light.primary,
    fontWeight: "600",
    zIndex: 1,
  },
  categoryList: {
    paddingVertical: 4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.light.primary,
    borderColor: COLORS.light.primary,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
  },
  categoryButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  uploadCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#cce3de",
    borderStyle: "dashed",
    marginTop: 8,
  },
  uploadCardDisabled: {
    opacity: 0.7,
    borderStyle: "solid",
    borderColor: "#f59e0b",
  },
  uploadContent: {
    padding: 24,
    alignItems: "center",
  },
  uploadText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  uploadSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: "#94a3b8",
  },
  imagesContainer: {
    marginTop: 16,
  },
  imageItem: {
    position: "relative",
    width: "32%",
    aspectRatio: 1,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  imageCount: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  saveButton: {
    backgroundColor: COLORS.light.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 8,
  },
  bottomHelperText: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
  },
  // Pre-order Styles - NEW
  preOrderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#cce3de",
  },
  preOrderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  preOrderTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#cbd5e1",
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.light.primary,
  },
  toggleIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleIndicatorActive: {
    transform: [{ translateX: 22 }],
  },
  preOrderInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  preOrderInfoText: {
    fontSize: 12,
    color: "#2563eb",
    flex: 1,
    lineHeight: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  imageLimitInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  imageLimitText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 8,
    flex: 1,
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
  // Harvest Warning Modal Styles
  warningModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  warningModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  warningModalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  warningModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#92400e",
    marginTop: 12,
    textAlign: "center",
  },
  warningModalText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 12,
    textAlign: "center",
  },
  warningModalTextBold: {
    fontWeight: "700",
    color: "#92400e",
  },
  warningModalActions: {
    marginTop: 24,
  },
  warningModalCancelButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  warningModalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
