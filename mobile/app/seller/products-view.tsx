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
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../constants";
import { supabase } from "../../lib/supabase";
import { computeFreshness } from "../../utils/freshness";
import { formatHoursAgo } from "../../utils/time";
import { fetchProductRating } from "../../utils/productRatings";
import { ProductDiscount } from "../../utils/ProductDiscount";

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

export default function ProductView() {
  const params = useLocalSearchParams();
  const productId =
    typeof params?.product_id === "string" ? params.product_id : undefined;

  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [rating, setRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(
          "product_id, product_name, description, price, discount_percent, stock, unit, harvested_at, images, category_id, is_active, sold_quantity, categories!inner(category_name)",
        )
        .eq("product_id", productId)
        .single();

      if (error) {
        console.warn(error);
        Alert.alert("Error", "Failed to load product.");
        return;
      }

      setProduct(data);

      // Fetch rating
      const ratingData = await fetchProductRating(productId);
      setRating(ratingData.rating);
      setTotalReviews(ratingData.totalReviews);
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
  const onEdit = useCallback(() => {
    if (product?.product_id)
      router.push(
        `/seller/products-edit?product_id=${encodeURIComponent(String(product.product_id))}` as any,
      );
  }, [product]);

  // Properly typed renderImageItem function
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

  // Render image indicators
  const renderImageIndicator = () => {
    const images = product?.images || [];
    if (images.length <= 1) return null;

    return (
      <View style={styles.imageIndicators}>
        {images.map((_: any, index: number) => (
          <View
            key={index}
            style={[
              styles.indicatorDot,
              activeImageIndex === index && styles.indicatorDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  if (!productId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mainContent}>
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={goBack}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Product</Text>
            <View style={{ width: 80 }} />
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#cbd5e1" />
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
            <TouchableOpacity onPress={goBack}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Product</Text>
            <View style={{ width: 80 }} />
          </View>
          <View style={styles.loadingContainer}>
            <Ionicons name="refresh" size={32} color={COLORS.light.primary} />
            <Text style={styles.loadingText}>Loading product details...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const freshness = computeFreshness(product?.harvested_at);
  const images = product?.images || [];
  const categoryName = product?.categories?.category_name ?? null;
  const harvestDate = formatDateForDisplay(product?.harvested_at);
  const harvestTime = formatTimeForDisplay(product?.harvested_at);
  const price = Number(product?.price) || 0;
  const discountPercent = Number(product?.discount_percent) || 0;
  const soldQuantity = Number(product?.sold_quantity) || 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Ionicons
              name="create-outline"
              size={20}
              color={COLORS.light.primary}
            />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Carousel with Discount Badge */}
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
                {renderImageIndicator()}

                {/* Discount Badge */}
                {discountPercent > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>
                      -{discountPercent}%
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noImageContainer}>
                <Ionicons name="image-outline" size={64} color="#cbd5e1" />
                <Text style={styles.noImageText}>No images available</Text>
              </View>
            )}
          </View>

          {/* Price & Title Section */}
          <View style={styles.priceSection}>
            {/* Use ProductDiscount component for price display */}
            <ProductDiscount
              price={price}
              discountPercent={discountPercent}
              showBadge={false}
              textSize="large"
            />

            <Text style={styles.productTitle}>{product.product_name}</Text>

            {/* Stats Row - Now includes Sold and Rating */}
            <View style={styles.statsRow}>
              {/* Stock */}
              <View style={styles.statItem}>
                <Ionicons name="cube-outline" size={14} color="#757575" />
                <Text style={styles.statText}>
                  {product.stock} {product.unit} left
                </Text>
              </View>

              <View style={styles.statDivider} />

              {/* Freshness */}
              <View style={styles.statItem}>
                <View
                  style={[
                    styles.freshnessDot,
                    { backgroundColor: freshness.color },
                  ]}
                />
                <Text style={[styles.statText, { color: freshness.color }]}>
                  {freshness.label}
                </Text>
              </View>

              <View style={styles.statDivider} />

              {/* Sold Quantity */}
              <View style={styles.statItem}>
                <Ionicons name="bag-check-outline" size={14} color="#757575" />
                <Text style={styles.statText}>
                  Sold: {soldQuantity} {product.unit}
                </Text>
              </View>

              <View style={styles.statDivider} />

              {/* Rating */}
              <View style={styles.statItem}>
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text style={styles.statText}>
                  {rating > 0 ? rating.toFixed(1) : "0.0"} ({totalReviews})
                </Text>
              </View>
            </View>
          </View>

          {/* Category & Status Section */}
          <View style={styles.categorySection}>
            {categoryName && (
              <>
                <View style={styles.categoryItem}>
                  <Text style={styles.categoryLabel}>Category</Text>
                  <View style={styles.categoryValueRow}>
                    <Text style={styles.categoryValue}>{categoryName}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </View>
                </View>
                <View style={styles.categoryDivider} />
              </>
            )}

            <View style={styles.categoryItem}>
              <Text style={styles.categoryLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    product.is_active
                      ? styles.statusDotActive
                      : styles.statusDotInactive,
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    product.is_active
                      ? styles.statusTextActive
                      : styles.statusTextInactive,
                  ]}
                >
                  {product.is_active ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
          </View>

          {/* Harvest Information Section */}
          <View style={styles.harvestSection}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="leaf-outline"
                size={20}
                color={COLORS.light.primary}
              />
              <Text style={styles.sectionTitle}>Harvest Information</Text>
            </View>

            <View style={styles.harvestGrid}>
              <View style={styles.harvestCard}>
                <Ionicons
                  name="calendar"
                  size={24}
                  color={COLORS.light.primary}
                />
                <Text style={styles.harvestCardLabel}>Harvest Date</Text>
                <Text style={styles.harvestCardValue}>{harvestDate}</Text>
              </View>

              {harvestTime && (
                <View style={styles.harvestCard}>
                  <Ionicons
                    name="time"
                    size={24}
                    color={COLORS.light.primary}
                  />
                  <Text style={styles.harvestCardLabel}>Harvest Time</Text>
                  <Text style={styles.harvestCardValue}>{harvestTime}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Product Description Section */}
          <View style={styles.descriptionSection}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={COLORS.light.primary}
              />
              <Text style={styles.sectionTitle}>Product Description</Text>
            </View>
            <Text style={styles.descriptionText}>
              {product.description || "No description provided."}
            </Text>
          </View>

          {/* Product Information Section */}
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={COLORS.light.primary}
              />
              <Text style={styles.sectionTitle}>Product Information</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Product ID</Text>
              <Text style={styles.infoValue}>{product.product_id}</Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Freshness</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: freshness.color, marginRight: 6 },
                  ]}
                />
                <Text style={[styles.infoValue, { color: freshness.color }]}>
                  {freshness.label}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Harvested</Text>
              <Text style={styles.infoValue}>
                {formatHoursAgo(freshness.hoursElapsed)}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Stock Available</Text>
              <Text style={styles.infoValue}>
                {product.stock} {product.unit}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sold Quantity</Text>
              <Text style={styles.infoValue}>
                {soldQuantity} {product.unit}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rating</Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Ionicons name="star" size={16} color="#FFB800" />
                <Text style={styles.infoValue}>
                  {rating > 0 ? rating.toFixed(1) : "0.0"} ({totalReviews}{" "}
                  {totalReviews === 1 ? "review" : "reviews"})
                </Text>
              </View>
            </View>

            {discountPercent > 0 && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Discount</Text>
                  <View style={styles.discountInfoBadge}>
                    <Text style={styles.discountInfoText}>
                      {discountPercent}% OFF
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </ScrollView>
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
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  editButtonText: {
    color: COLORS.light.primary,
    fontSize: 14,
    fontWeight: "600",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.light.primary,
  },
  scrollContent: {
    paddingBottom: 32,
  },
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
  imageIndicators: {
    flexDirection: "row",
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  indicatorDotActive: {
    backgroundColor: "#fff",
    width: 18,
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
  discountBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  discountBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  priceSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#212121",
    lineHeight: 26,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
  },
  statText: {
    fontSize: 12,
    color: "#757575",
  },
  freshnessDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
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
  categoryValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  harvestGrid: {
    flexDirection: "row",
    gap: 12,
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
  descriptionSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#424242",
  },
  infoSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: "#757575",
  },
  infoValue: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "500",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#f5f5f5",
  },
  discountInfoBadge: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountInfoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
