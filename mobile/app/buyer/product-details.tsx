import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../constants";
import { supabase } from "../../lib/supabase";
import { computeFreshness } from "../../utils/freshness";
import { formatHoursAgo } from "../../utils/time";
import LoadingSpinner from "../../components/Loading";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = 375;

// Helper function to format date for display
const formatDateForDisplay = (dateString?: string | null) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    return "Invalid Date";
  }
};

// Helper function to format time for display
const formatTimeForDisplay = (dateString?: string | null) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    return "";
  }
};

export default function BuyerProductDetail() {
  const params = useLocalSearchParams();
  const productId =
    typeof params?.product_id === "string" ? params.product_id : undefined;

  const [product, setProduct] = useState<any | null>(null);
  const [vendor, setVendor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [soldCount, setSoldCount] = useState<number>(0);

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);

      // Fetch product with vendor info
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(
          `
          product_id,
          product_name,
          description,
          price,
          stock,
          unit,
          harvested_at,
          images,
          category_id,
          is_active,
          vendor_user_id,
          categories!inner(category_name)
        `,
        )
        .eq("product_id", productId)
        .single();

      if (productError) {
        console.warn(productError);
        Alert.alert("Error", "Failed to load product.");
        return;
      }

      setProduct(productData);

      // Fetch vendor information
      if (productData.vendor_user_id) {
        const { data: vendorData, error: vendorError } = await supabase
          .from("vendor_profiles")
          .select(
            `
            user_id,
            shop_name,
            avatar_url,
            gcash_number
          `,
          )
          .eq("user_id", productData.vendor_user_id)
          .single();

        if (!vendorError) {
          setVendor(vendorData);
        }
      }

      // Fetch product rating and sold count
      // Assuming you have a way to get these from your database
      // For now, we'll use mock data
      setRating(4.5); // Mock rating - replace with actual data fetch
      setSoldCount(42); // Mock sold count - replace with actual data fetch
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

  const goBack = useCallback(() => router.back(), []);

  // Render image item
  const renderImageItem = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => (
    <View style={styles.imageSlide}>
      <Image
        source={{ uri: item }}
        style={styles.productImage}
        resizeMode="cover"
      />
    </View>
  );

  // Add to cart function
  const handleAddToCart = async () => {};

  // Direct order function
  const handleDirectOrder = () => {};

  // View vendor profile
  const handleViewVendor = () => {};

  if (!productId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mainContent}>
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Product Details</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="fish-off" size={64} color="#cbd5e1" />
            <Text style={styles.emptyStateText}>No product selected</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mainContent}>
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Product Details</Text>
            <View style={{ width: 40 }} />
          </View>
          {/* Use the reusable loading component */}
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  // Calculate values
  const freshness = computeFreshness(product?.harvested_at);
  const images = product?.images || [];
  const categoryName = product?.categories?.category_name ?? null;
  const harvestDate = formatDateForDisplay(product?.harvested_at);
  const harvestTime = formatTimeForDisplay(product?.harvested_at);
  const price = Number(product?.price) || 0;
  const stockAvailable = product?.stock || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {/* Header - Centered */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Carousel */}
          <View style={styles.imageCarouselContainer}>
            {images.length > 0 ? (
              <>
                <FlatList
                  data={images}
                  renderItem={renderImageItem}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={SCREEN_WIDTH}
                  decelerationRate="fast"
                  onMomentumScrollEnd={(event) => {
                    const newIndex = Math.floor(
                      event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                    );
                    setActiveImageIndex(newIndex);
                  }}
                  keyExtractor={(item, index) => `${item}-${index}`}
                />
                {/* Image indicator as numbers instead of dots */}
                {images.length > 1 && (
                  <View style={styles.imageIndicatorNumber}>
                    <View style={styles.indicatorNumberContainer}>
                      <Text style={styles.indicatorNumberText}>
                        {activeImageIndex + 1}/{images.length}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noImageContainer}>
                <MaterialCommunityIcons
                  name="image-off"
                  size={64}
                  color="#cbd5e1"
                />
                <Text style={styles.noImageText}>No images available</Text>
              </View>
            )}
          </View>

          {/* Price & Title Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <View style={styles.priceLeftColumn}>
                <View style={styles.priceRow}>
                  <Text style={styles.currencySymbol}>₱</Text>
                  <Text style={styles.priceAmount}>
                    {price.toLocaleString()}
                  </Text>
                  <Text style={styles.priceUnit}>/{product.unit}</Text>
                </View>
                <Text style={styles.productTitle}>{product.product_name}</Text>
              </View>

              {/* Sold and Rating on the right side */}
              <View style={styles.priceRightColumn}>
                <View style={styles.soldRatingContainer}>
                  <View style={styles.soldContainer}>
                    <Text style={styles.soldRatingText}>{soldCount} sold</Text>
                  </View>
                  <View style={styles.ratingContainer}>
                    <FontAwesome name="star" size={14} color="#FFD700" />
                    <Text style={styles.soldRatingText}>
                      {rating ? rating.toFixed(1) : "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={14}
                  color="#757575"
                />
                <Text style={styles.statText}>
                  {stockAvailable} {product.unit} left
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View
                  style={[
                    styles.freshnessDot,
                    { backgroundColor: freshness.color },
                  ]}
                />
                <Text style={[styles.statText, { color: freshness.color }]}>
                  {freshness.label} • {formatHoursAgo(freshness.hoursElapsed)}
                </Text>
              </View>
            </View>
          </View>

          {/* Vendor Information */}
          {vendor && (
            <TouchableOpacity
              style={styles.vendorSection}
              onPress={handleViewVendor}
              activeOpacity={0.7}
            >
              <View style={styles.vendorInfo}>
                {vendor.avatar_url ? (
                  <Image
                    source={{ uri: vendor.avatar_url }}
                    style={styles.vendorAvatar}
                  />
                ) : (
                  <View style={styles.vendorAvatarPlaceholder}>
                    <MaterialCommunityIcons
                      name="store"
                      size={24}
                      color="#fff"
                    />
                  </View>
                )}
                <View style={styles.vendorText}>
                  <Text style={styles.vendorName}>{vendor.shop_name}</Text>
                  <Text style={styles.vendorLabel}>Seller</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}

          {/* Category & Stock Section */}
          <View style={styles.categorySection}>
            {categoryName && (
              <>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryLabel}>Category</Text>
                  <Text style={styles.categoryValue}>{categoryName}</Text>
                </View>
                <View style={styles.categoryDivider} />
              </>
            )}

            <View style={styles.categoryItem}>
              <Text style={styles.categoryLabel}>Availability</Text>
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    product.is_active && stockAvailable > 0
                      ? styles.statusDotActive
                      : styles.statusDotInactive,
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    product.is_active && stockAvailable > 0
                      ? styles.statusTextActive
                      : styles.statusTextInactive,
                  ]}
                >
                  {product.is_active && stockAvailable > 0
                    ? "Available"
                    : "Out of Stock"}
                </Text>
              </View>
            </View>
          </View>

          {/* Product Description Section */}
          <View style={styles.descriptionSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.descriptionText}>
              {product.description || "No description provided."}
            </Text>
          </View>

          {/* Harvest Information Section */}
          <View style={styles.harvestSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="fish"
                size={20}
                color={COLORS.light.primary}
              />
              <Text style={styles.sectionTitle}>Freshness Information</Text>
            </View>

            <View style={styles.harvestGrid}>
              <View style={styles.harvestCard}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={24}
                  color={COLORS.light.primary}
                />
                <Text style={styles.harvestCardLabel}>Harvest Date</Text>
                <Text style={styles.harvestCardValue}>{harvestDate}</Text>
              </View>

              {harvestTime && (
                <View style={styles.harvestCard}>
                  <MaterialCommunityIcons
                    name="clock"
                    size={24}
                    color={COLORS.light.primary}
                  />
                  <Text style={styles.harvestCardLabel}>Harvest Time</Text>
                  <Text style={styles.harvestCardValue}>{harvestTime}</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Action Bar */}
        <View style={styles.actionBar}>
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.addToCartButton,
                (stockAvailable === 0 || addingToCart) && styles.buttonDisabled,
              ]}
              onPress={handleAddToCart}
              disabled={stockAvailable === 0 || addingToCart}
            >
              <Ionicons
                name="cart"
                size={20}
                color={
                  stockAvailable === 0 || addingToCart
                    ? "#ccc"
                    : COLORS.light.primary
                }
              />
              <Text
                style={[
                  styles.addToCartText,
                  (stockAvailable === 0 || addingToCart) && styles.disabledText,
                ]}
              >
                {addingToCart ? "Adding..." : "Add to Cart"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.orderButton,
                stockAvailable === 0 && styles.buttonDisabled,
              ]}
              onPress={handleDirectOrder}
              disabled={stockAvailable === 0}
            >
              <Text
                style={[
                  styles.orderButtonText,
                  stockAvailable === 0 && styles.disabledText,
                ]}
              >
                Order Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------------------- STYLES ---------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  mainContent: {
    flex: 1,
  },
  // Header Styles - Centered
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.light.primary,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
  scrollContent: {
    paddingBottom: 120, // More space for improved action bar
  },

  // Image Carousel
  imageCarouselContainer: {
    height: IMAGE_HEIGHT,
    backgroundColor: "#fff",
    position: "relative",
    marginBottom: 8,
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  productImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  // Number-based image indicator
  imageIndicatorNumber: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
  },
  indicatorNumberContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  indicatorNumberText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  noImageContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  noImageText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
  },

  // Price Section - Updated for sold and rating on right
  priceSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  priceLeftColumn: {
    flex: 1,
    marginRight: 16,
  },
  priceRightColumn: {
    alignItems: "flex-end",
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.light.coral,
    marginTop: 4,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.light.coral,
    marginLeft: 4,
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: "500",
    color: "#757575",
    marginTop: 12,
    marginLeft: 4,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#212121",
    lineHeight: 26,
    marginTop: 4,
  },
  // Sold and Rating Styles
  soldRatingContainer: {
    alignItems: "flex-end",
  },
  soldContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  soldRatingText: {
    fontSize: 13,
    color: "#757575",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 12,
  },
  statText: {
    fontSize: 13,
    color: "#757575",
  },
  freshnessDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Vendor Section
  vendorSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vendorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vendorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  vendorAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  vendorText: {
    flexDirection: "column",
  },
  vendorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  vendorLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },

  // Category & Status Section
  categorySection: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryLabel: {
    fontSize: 14,
    color: "#757575",
  },
  categoryValue: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
  },
  categoryDivider: {
    height: 1,
    backgroundColor: "#f5f5f5",
    marginHorizontal: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: "#10b981",
  },
  statusDotInactive: {
    backgroundColor: "#ef4444",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statusTextActive: {
    color: "#10b981",
  },
  statusTextInactive: {
    color: "#ef4444",
  },

  // Harvest Section
  harvestSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  harvestGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  harvestCard: {
    flex: 1,
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0f2fe",
    alignItems: "center",
  },
  harvestCardLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 8,
    marginBottom: 4,
  },
  harvestCardValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    textAlign: "center",
  },
  // Description Section
  descriptionSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#757575",
  },

  // Action Bar (Fixed at Bottom) - IMPROVED LAYOUT
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 48,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Action Buttons
  actionButtons: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  // Add to Cart Button (White with primary border)
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: COLORS.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  addToCartText: {
    color: COLORS.light.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  // Order Now Button
  orderButton: {
    backgroundColor: COLORS.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  orderButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  buttonDisabled: {
    backgroundColor: "#e5e7eb",
    borderColor: "#d1d5db",
  },
  disabledText: {
    color: "#9ca3af",
  },
});
