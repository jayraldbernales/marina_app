import React, { useEffect, useState, useCallback } from "react";
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
  ActivityIndicator,
  StyleSheet,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../constants";
import { supabase } from "../../lib/supabase";

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

export default function ProductEdit() {
  const params = useLocalSearchParams();
  const productId =
    typeof params?.product_id === "string" ? params.product_id : undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showImageSource, setShowImageSource] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [harvestedAt, setHarvestedAt] = useState<Date>(new Date());
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("category_id, category_name")
        .order("category_name");
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  // Load product data
  const loadProduct = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(
          "product_id, product_name, description, price, stock, unit, harvested_at, images, category_id, is_active",
        )
        .eq("product_id", productId)
        .single();

      if (error) {
        Alert.alert("Error", "Failed to load product.");
        return;
      }

      setName(data.product_name || "");
      setDescription(data.description || "");
      setPrice(String(data.price ?? ""));
      setStock(String(data.stock ?? ""));
      setImages(data.images || []);
      // Set harvest date and time from the timestampz field
      const harvestedAtDate = data.harvested_at
        ? new Date(data.harvested_at)
        : new Date();
      setHarvestedAt(harvestedAtDate);
      setCategoryId(data.category_id ?? null);
      setIsActive(data.is_active ?? true);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unexpected error loading product.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Image handling
  const pickFromGallery = useCallback(async () => {
    setShowImageSource(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - (images.length + newImages.length),
    });
    if (!result.canceled && result.assets?.length) {
      const uris = result.assets.map((a) => a.uri);
      setNewImages((prev) => [...prev, ...uris]);
    }
  }, [images, newImages]);

  const takePhoto = useCallback(async () => {
    setShowImageSource(false);
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      setNewImages((prev) => [...prev, result.assets[0].uri]);
    }
  }, []);

  const removeImage = (uri: string) => {
    if (newImages.includes(uri)) {
      setNewImages((prev) => prev.filter((u) => u !== uri));
      return;
    }
    setImages((prev) => prev.filter((u) => u !== uri));
    setRemovedImages((prev) => [...prev, uri]);
  };

  // Upload/delete images
  const uploadImages = async (
    uris: string[],
    vendorId: string,
  ): Promise<string[]> => {
    const publicUrls: string[] = [];

    for (const uri of uris) {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const ext = uri.split(".").pop()?.split("?")[0] ?? "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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
      if (!data?.publicUrl) throw new Error("Failed to generate public URL");
      publicUrls.push(data.publicUrl);
    }

    return publicUrls;
  };

  const deleteStorageObjects = async (publicUrls: string[]) => {
    for (const url of publicUrls) {
      try {
        const match = url.split("/storage/v1/object/public/product-images/")[1];
        if (!match) continue;
        const path = decodeURIComponent(match);
        await supabase.storage.from("product-images").remove([path]);
      } catch (err) {
        console.warn("Failed to delete storage object", err);
      }
    }
  };

  // Save product
  const handleSave = useCallback(async () => {
    if (!productId) return;
    if (!name.trim())
      return Alert.alert("Validation", "Product name is required.");

    const priceNum = Number(price);
    const stockNum = Number(stock || 0);
    if (Number.isNaN(priceNum) || Number.isNaN(stockNum))
      return Alert.alert("Validation", "Invalid numeric values.");

    try {
      setSaving(true);
      setUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) return Alert.alert("Error", "Not authenticated");

      const uploadedUrls =
        newImages.length > 0 ? await uploadImages(newImages, user.id) : [];

      const finalImages = [...images, ...uploadedUrls];

      // DO NOT update harvested_at - keep the original value
      const updateObj: any = {
        product_name: name.trim(),
        description: description.trim(),
        price: priceNum,
        stock: stockNum,
        unit: "kg",
        category_id: categoryId,
        images: finalImages,
      };

      const { error } = await supabase
        .from("products")
        .update(updateObj)
        .eq("product_id", productId);
      if (error) {
        console.error("Supabase update error:", error);
        Alert.alert("Error", "Failed to update product.");
        return;
      }

      if (removedImages.length > 0) {
        await deleteStorageObjects(removedImages);
      }

      Alert.alert("Success", "Product updated.", [
        {
          text: "OK",
          onPress: () => router.replace("/(seller-tabs)/products?refresh=1"),
        },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }, [
    productId,
    name,
    description,
    price,
    stock,
    images,
    newImages,
    removedImages,
    categoryId,
  ]);

  // Delete product (soft delete - set is_active to false)
  const handleDelete = useCallback(async () => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to remove this product? It will be hidden from buyers but can be restored later. Note: Harvest date cannot be edited. If it's incorrect, you need to delete and recreate the product.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);

              const { error } = await supabase
                .from("products")
                .update({ is_active: false })
                .eq("product_id", productId);

              if (error) {
                Alert.alert("Error", "Failed to delete product.");
                return;
              }

              Alert.alert(
                "Product Deleted",
                "The product has been removed and will no longer be visible to buyers.",
                [
                  {
                    text: "OK",
                    onPress: () =>
                      router.replace("/(seller-tabs)/products?refresh=1"),
                  },
                ],
              );
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Something went wrong.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [productId]);

  // Reactivate product (set is_active to true)
  const handleReactivate = useCallback(async () => {
    try {
      setDeleting(true);

      const { error } = await supabase
        .from("products")
        .update({ is_active: true })
        .eq("product_id", productId);

      if (error) {
        Alert.alert("Error", "Failed to reactivate product.");
        return;
      }

      setIsActive(true);
      Alert.alert(
        "Success",
        "Product has been reactivated and is now visible to buyers.",
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }, [productId]);

  // Loading states
  if (!productId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyStateText}>No product selected</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.light.primary} />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allImages = [...images, ...newImages];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Product</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Product Status Banner */}
        {!isActive && (
          <View style={styles.inactiveBanner}>
            <Ionicons name="eye-off-outline" size={20} color="#92400e" />
            <Text style={styles.inactiveBannerText}>
              This product is inactive and hidden from buyers
            </Text>
          </View>
        )}

        {/* Basic Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Enter product name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              style={[styles.input, styles.textArea]}
              placeholder="Describe your product"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Price (₱) *</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={styles.input}
                placeholder="0.00"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Stock (kg) *</Text>
              <TextInput
                value={stock}
                onChangeText={setStock}
                keyboardType="numeric"
                style={styles.input}
                placeholder="0"
              />
            </View>
          </View>

          {/* Harvest Date & Time (READ ONLY) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Harvest Date & Time</Text>
            <View style={styles.harvestDisplay}>
              <View style={styles.harvestInfo}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={COLORS.light.primary}
                />
                <Text style={styles.harvestText}>
                  {formatDateForDisplay(harvestedAt)}
                </Text>
              </View>
              <View style={styles.harvestInfo}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={COLORS.light.primary}
                />
                <Text style={styles.harvestText}>
                  {formatTimeForDisplay(harvestedAt)}
                </Text>
              </View>
            </View>
            <View style={styles.nonEditableNotice}>
              <Ionicons name="information-circle" size={16} color="#f59e0b" />
              <Text style={styles.nonEditableText}>
                Harvest date and time cannot be edited. If incorrect, delete and
                recreate the product.
              </Text>
            </View>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Category *</Text>
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

        {/* Images */}
        <View style={styles.card}>
          <View style={styles.imagesHeader}>
            <Text style={styles.cardTitle}>Product Images</Text>
            <Text style={styles.imageCount}>{allImages.length} / 10</Text>
          </View>

          <Text style={styles.helperText}>
            Add clear photos from different angles
          </Text>

          {allImages.length < 10 && (
            <TouchableOpacity
              onPress={() => setShowImageSource(true)}
              style={styles.addImageButton}
            >
              <Ionicons name="camera" size={24} color={COLORS.light.primary} />
              <Text style={styles.addImageText}>Add Photos</Text>
            </TouchableOpacity>
          )}

          {allImages.length > 0 && (
            <View style={styles.imagesContainer}>
              <FlatList
                data={allImages}
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
            </View>
          )}

          {allImages.length >= 10 && (
            <View style={styles.maxImagesAlert}>
              <Ionicons name="alert-circle-outline" size={16} color="#f59e0b" />
              <Text style={styles.maxImagesText}>
                Maximum 10 images reached
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
            (saving || uploading) && styles.saveButtonDisabled,
          ]}
        >
          {saving || uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Delete/Reactivate Button */}
        {isActive ? (
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleting}
            style={[
              styles.deleteButton,
              deleting && styles.deleteButtonDisabled,
            ]}
          >
            {deleting ? (
              <ActivityIndicator color="#991b1b" size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#991b1b" />
                <Text style={styles.deleteButtonText}>Delete Product</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleReactivate}
            disabled={deleting}
            style={[
              styles.reactivateButton,
              deleting && styles.reactivateButtonDisabled,
            ]}
          >
            {deleting ? (
              <ActivityIndicator color="#065f46" size="small" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={20} color="#065f46" />
                <Text style={styles.reactivateButtonText}>
                  Reactivate Product
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.requiredHint}>* Required fields</Text>
      </ScrollView>

      {/* Image Source Modal */}
      {showImageSource && (
        <Modal
          transparent={true}
          visible={showImageSource}
          animationType="slide"
          onRequestClose={() => setShowImageSource(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Photos</Text>
                <TouchableOpacity
                  onPress={() => setShowImageSource(false)}
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
                  <Text style={styles.modalOptionTitle}>
                    Choose from Gallery
                  </Text>
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
                  Maximum 10 images allowed. Currently have {allImages.length}{" "}
                  of 10.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowImageSource(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.common.white,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f2ed",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.light.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.light.primary,
  },
  inactiveBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  inactiveBannerText: {
    fontSize: 13,
    color: "#92400e",
    fontWeight: "500",
    flex: 1,
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
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
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
  harvestDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#cce3de",
    marginBottom: 8,
  },
  harvestInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  harvestText: {
    fontSize: 15,
    color: COLORS.light.primary,
    fontWeight: "500",
  },
  nonEditableNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fffbeb",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fef3c7",
    gap: 8,
  },
  nonEditableText: {
    fontSize: 12,
    color: "#92400e",
    flex: 1,
    lineHeight: 16,
  },
  categoryList: {
    paddingVertical: 4,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
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
  imagesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  imageCount: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.light.primary,
    backgroundColor: "#e0f2ed",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  helperText: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 12,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#cce3de",
    borderStyle: "dashed",
    gap: 8,
    marginBottom: 16,
  },
  addImageText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  imagesContainer: {
    marginBottom: 8,
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
  maxImagesAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  maxImagesText: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "500",
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
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: "#991b1b",
    fontSize: 16,
    fontWeight: "600",
  },
  reactivateButton: {
    backgroundColor: "#d1fae5",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  reactivateButtonDisabled: {
    opacity: 0.7,
  },
  reactivateButtonText: {
    color: "#065f46",
    fontSize: 16,
    fontWeight: "600",
  },
  requiredHint: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
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
});
