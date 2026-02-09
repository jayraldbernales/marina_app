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
  Modal,
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
  const [vendorAddress, setVendorAddress] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [soldCount, setSoldCount] = useState<number>(0);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

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
          sold_quantity,
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
      setSoldCount(productData.sold_quantity || 0);

      // Reset quantity to 1 when product changes
      setSelectedQuantity(1);

      // Fetch vendor information
      if (productData.vendor_user_id) {
        // Fetch vendor profile
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

        // Fetch vendor's business address
        const { data: addressData, error: addressError } = await supabase
          .from("addresses")
          .select("full_address")
          .eq("user_id", productData.vendor_user_id)
          .eq("address_type", "business")
          .maybeSingle();

        if (!addressError && addressData) {
          setVendorAddress(addressData);
        }
      }

      // Fetch product rating (you'll need to implement this based on your rating system)
      // For now, we'll use a placeholder or fetch from a ratings table if you have one
      fetchProductRating();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unexpected error loading product.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Fetch product rating from database
  const fetchProductRating = async () => {
    try {
      // Example: If you have a ratings/reviews table
      // const { data: ratingsData, error } = await supabase
      //   .from("reviews")
      //   .select("rating")
      //   .eq("product_id", productId);

      // if (!error && ratingsData && ratingsData.length > 0) {
      //   const totalRating = ratingsData.reduce((sum, review) => sum + review.rating, 0);
      //   const averageRating = totalRating / ratingsData.length;
      //   setRating(averageRating);
      // } else {
      //   setRating(null);
      // }

      // For now, using a placeholder rating
      setRating(4.5); // Replace with actual rating logic
    } catch (error) {
      console.error("Error fetching rating:", error);
      setRating(null);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const goBack = useCallback(() => router.back(), []);

  // Format vendor address for display
  const formatVendorAddress = () => {
    if (!vendorAddress || !vendorAddress.full_address) {
      return "Address not specified";
    }
    return vendorAddress.full_address;
  };

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

  // Handlers for quantity selector
  const increaseQuantity = () => {
    if (selectedQuantity < stockAvailable) {
      setSelectedQuantity(selectedQuantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (selectedQuantity > 1) {
      setSelectedQuantity(selectedQuantity - 1);
    }
  };

  // Show quantity modal when clicking Add to Cart
  const handleAddToCartClick = () => {
    if (!product || stockAvailable <= 0) {
      Alert.alert("Error", "Product is out of stock or unavailable.");
      return;
    }
    setShowQuantityModal(true);
  };

  // Confirm and add to cart with selected quantity
  const handleAddToCart = async () => {
    if (!product || stockAvailable <= 0) {
      Alert.alert("Error", "Product is out of stock or unavailable.");
      return;
    }

    setAddingToCart(true);
    setShowQuantityModal(false);

    try {
      // Step 1: Get the current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Error", "You must be logged in to add items to cart.");
        return;
      }
      const userId = user.id;

      // Step 2: Check if a cart exists for this user and vendor
      const { data: existingCart, error: cartError } = await supabase
        .from("carts")
        .select("cart_id")
        .eq("user_id", userId)
        .eq("vendor_user_id", product.vendor_user_id)
        .single();

      let cartId;
      if (cartError && cartError.code !== "PGRST116") {
        console.error("Error fetching cart:", cartError);
        Alert.alert("Error", "Failed to check cart. Please try again.");
        return;
      }

      if (!existingCart) {
        // Create a new cart
        const { data: newCart, error: insertCartError } = await supabase
          .from("carts")
          .insert({
            user_id: userId,
            vendor_user_id: product.vendor_user_id,
          })
          .select("cart_id")
          .single();

        if (insertCartError) {
          console.error("Error creating cart:", insertCartError);
          Alert.alert("Error", "Failed to create cart. Please try again.");
          return;
        }
        cartId = newCart.cart_id;
      } else {
        cartId = existingCart.cart_id;
      }

      // Step 3: Check if the product is already in the cart
      const { data: existingCartItem, error: itemError } = await supabase
        .from("cart_items")
        .select("cart_item_id, quantity")
        .eq("cart_id", cartId)
        .eq("product_id", product.product_id)
        .single();

      if (itemError && itemError.code !== "PGRST116") {
        console.error("Error fetching cart item:", itemError);
        Alert.alert("Error", "Failed to check cart item. Please try again.");
        return;
      }

      // Use selectedQuantity instead of 1
      const newQuantity = existingCartItem
        ? existingCartItem.quantity + selectedQuantity
        : selectedQuantity;

      // Step 4: Ensure we don't exceed stock
      if (newQuantity > stockAvailable) {
        Alert.alert(
          "Error",
          `Cannot add more than ${stockAvailable} units in stock.`,
        );
        return;
      }

      if (existingCartItem) {
        // Update existing cart item
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("cart_item_id", existingCartItem.cart_item_id);

        if (updateError) {
          console.error("Error updating cart item:", updateError);
          Alert.alert("Error", "Failed to update cart. Please try again.");
          return;
        }
      } else {
        // Insert new cart item
        const { error: insertItemError } = await supabase
          .from("cart_items")
          .insert({
            cart_id: cartId,
            product_id: product.product_id,
            quantity: selectedQuantity,
          });

        if (insertItemError) {
          console.error("Error adding to cart:", insertItemError);
          Alert.alert("Error", "Failed to add to cart. Please try again.");
          return;
        }
      }

      // Step 5: Success - Show alert and optionally navigate
      Alert.alert("Success", `${selectedQuantity} item(s) added to cart!`);
      // Reset quantity after successful add
      setSelectedQuantity(1);
    } catch (err) {
      console.error("Unexpected error in handleAddToCart:", err);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  // Direct order function
  const handleDirectOrder = () => {
    if (!productId || stockAvailable === 0) {
      Alert.alert("Error", "Product is out of stock or unavailable.");
      return;
    }

    // Navigate to the direct order screen with product data
    router.push({
      pathname: "/buyer/direct-order",
      params: {
        product_id: productId,
        quantity: selectedQuantity.toString(), // Pass the selected quantity
      },
    });
  };

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

          {/* Vendor Address Section */}
          {vendorAddress && vendorAddress.full_address && (
            <View style={styles.vendorAddressSection}>
              <View style={styles.vendorAddressHeader}>
                <Text style={styles.vendorAddressTitle}>Seller Address</Text>
              </View>
              <Text style={styles.vendorAddressText}>
                {vendorAddress.full_address}
              </Text>
            </View>
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

        {/* Fixed Bottom Action Bar with Quantity Selector */}
        <View style={styles.actionBar}>
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.addToCartButton,
                (stockAvailable === 0 || addingToCart) && styles.buttonDisabled,
              ]}
              onPress={handleAddToCartClick}
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

      {/* Quantity Selection Modal */}
      <Modal
        visible={showQuantityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuantityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Quantity</Text>
              <TouchableOpacity
                onPress={() => setShowQuantityModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {/* Price and Stock displayed side by side */}
              <View style={styles.priceStockRow}>
                <Text style={styles.priceText}>
                  ₱{price.toLocaleString()}/{product?.unit}
                </Text>
                <Text style={styles.stockText}>
                  Stock: {stockAvailable} {product?.unit}
                </Text>
              </View>

              {/* Improved Quantity Selection */}
              <View style={styles.quantitySection}>
                <View style={styles.quantityLabelRow}>
                  <Text style={styles.quantityLabel}>Quantity:</Text>
                  <View style={styles.quantitySelector}>
                    <TouchableOpacity
                      style={[
                        styles.quantityButton,
                        selectedQuantity <= 1 && styles.quantityButtonDisabled,
                      ]}
                      onPress={decreaseQuantity}
                      disabled={selectedQuantity <= 1}
                    >
                      <Ionicons
                        name="remove"
                        size={16}
                        color={
                          selectedQuantity <= 1 ? "#ccc" : COLORS.light.primary
                        }
                      />
                    </TouchableOpacity>

                    <View style={styles.quantityDisplay}>
                      <Text style={styles.quantityValue}>
                        {selectedQuantity}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.quantityButton,
                        selectedQuantity >= stockAvailable &&
                          styles.quantityButtonDisabled,
                      ]}
                      onPress={increaseQuantity}
                      disabled={selectedQuantity >= stockAvailable}
                    >
                      <Ionicons
                        name="add"
                        size={16}
                        color={
                          selectedQuantity >= stockAvailable
                            ? "#ccc"
                            : COLORS.light.primary
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddToCart}
              >
                <Text style={styles.confirmButtonText}>
                  Add {selectedQuantity} to Cart
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // NEW: Vendor Address Section
  vendorAddressSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 8,
  },
  vendorAddressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  vendorAddressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  vendorAddressText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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

  // Action Bar (Fixed at Bottom) - IMPROVED LAYOUT with Quantity Selector
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

  // UPDATED: Action Buttons
  actionButtons: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  // Add to Cart Button
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: COLORS.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    paddingVertical: 16,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },

  // Price and Stock row
  priceStockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.light.coral,
  },
  stockText: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  // Quantity Section
  quantitySection: {
    marginBottom: 12,
  },
  quantityLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 8,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.light.primary,
  },
  quantityButtonDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#ddd",
  },
  quantityDisplay: {
    alignItems: "center",
    minWidth: 45,
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212121",
  },

  // Confirm Button
  confirmButton: {
    backgroundColor: COLORS.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
