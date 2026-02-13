import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
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
import LoadingSpinner from "../../components/Loading";
import { chatService } from "../../lib/chat";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PRODUCT_CARD_WIDTH = (SCREEN_WIDTH - 24) / 2;

type VendorProduct = {
  product_id: string;
  product_name: string;
  price: number;
  stock: number;
  unit: string;
  images: string[] | null;
  harvested_at: string | null;
};

const formatPrice = (price: number) => {
  return `₱${Number(price).toLocaleString()}`;
};

export default function ViewVendorScreen() {
  const params = useLocalSearchParams();
  const vendorUserId = params?.vendor_user_id as string;

  const [vendor, setVendor] = useState<any | null>(null);
  const [vendorAddress, setVendorAddress] = useState<any | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [vendorRating, setVendorRating] = useState(4.7); // Temporary rating
  const PRODUCTS_PER_PAGE = 6;

  const loadVendorProfile = useCallback(async () => {
    if (!vendorUserId) return;
    try {
      // Fetch vendor profile
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendor_profiles")
        .select(
          `
          user_id,
          shop_name,
          avatar_url,
          gcash_number,
          created_at,
          approval_status
        `,
        )
        .eq("user_id", vendorUserId)
        .single();

      if (vendorError) {
        console.error("Error fetching vendor:", vendorError);
        Alert.alert("Error", "Failed to load vendor profile.");
        return;
      }

      setVendor(vendorData);

      // Fetch vendor's business address
      const { data: addressData, error: addressError } = await supabase
        .from("addresses")
        .select("full_address, barangay, municipality")
        .eq("user_id", vendorUserId)
        .eq("address_type", "business")
        .maybeSingle();

      if (!addressError && addressData) {
        setVendorAddress(addressData);
      }
    } catch (err) {
      console.error("Error loading vendor profile:", err);
    }
  }, [vendorUserId]);

  const loadVendorProducts = useCallback(
    async (pageNum = 1, reset = false) => {
      if (!vendorUserId) return;

      try {
        if (pageNum === 1) {
          setLoadingProducts(true);
        }

        const from = (pageNum - 1) * PRODUCTS_PER_PAGE;
        const to = from + PRODUCTS_PER_PAGE - 1;

        // Fetch products for this vendor - removed sold_quantity
        const {
          data: productsData,
          error: productsError,
          count,
        } = await supabase
          .from("products")
          .select(
            `
          product_id,
          product_name,
          price,
          stock,
          unit,
          images,
          harvested_at
        `,
            { count: "exact" },
          )
          .eq("vendor_user_id", vendorUserId)
          .eq("is_active", true)
          .gt("stock", 0)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (productsError) {
          console.error("Error fetching products:", productsError);
          return;
        }

        setTotalProducts(count || 0);

        if (reset) {
          setProducts(productsData || []);
        } else {
          setProducts((prev) => [...prev, ...(productsData || [])]);
        }

        setHasMore(productsData?.length === PRODUCTS_PER_PAGE);
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoadingProducts(false);
        setLoading(false);
      }
    },
    [vendorUserId],
  );

  const loadMoreProducts = () => {
    if (hasMore && !loadingProducts) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadVendorProducts(nextPage, false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await loadVendorProfile();
      await loadVendorProducts(1, true);
    };
    loadInitialData();
  }, [vendorUserId]);

  const goBack = useCallback(() => router.back(), []);

  const handleViewProduct = (productId: string) => {
    router.push({
      pathname: "./product-details",
      params: { product_id: productId },
    });
  };

  // app/buyer/view-vendor.tsx (add this function)

  const handleChatWithVendor = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "Please login to chat with vendors");
        return;
      }

      // Get or create conversation - now using object parameter
      const { data: conversation, error } =
        await chatService.getOrCreateConversation({
          buyerId: user.id,
          vendorId: vendorUserId,
        });

      if (error) {
        console.error("Error creating conversation:", error);
        Alert.alert("Error", "Failed to start chat");
        return;
      }

      // Navigate to chat screen with conversation details
      router.push({
        pathname: "./chat",
        params: {
          conversationId: conversation.id,
          otherPartyName: vendor?.shop_name || "Vendor",
          otherPartyId: vendorUserId,
          otherPartyType: "vendor",
          otherPartyAvatar: vendor?.avatar_url,
        },
      });
    } catch (err) {
      console.error("Error in chat:", err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const formatJoinDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    } catch {
      return "N/A";
    }
  };

  const renderProductCard = ({ item }: { item: VendorProduct }) => {
    const freshness = computeFreshness(item.harvested_at);
    const imageUrl =
      item.images && item.images.length > 0 ? item.images[0] : null;
    const price = Number(item.price) || 0;
    const productRating = 4.5 + Math.random() * 0.5; // Temporary random rating

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleViewProduct(item.product_id)}
        activeOpacity={0.7}
      >
        <View style={{ position: "relative" }}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.productImage,
                {
                  backgroundColor: "#f3f4f6",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Ionicons name="image" size={28} color="#9ca3af" />
            </View>
          )}
          <View
            style={[
              styles.freshnessOverlay,
              { backgroundColor: freshness.color },
            ]}
          >
            <Text style={styles.freshnessOverlayText}>{freshness.label}</Text>
          </View>
        </View>

        <View style={{ flex: 1, padding: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <Text style={styles.productName} numberOfLines={2}>
              {item.product_name}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.productPrice}>{formatPrice(price)}</Text>
              <Text style={styles.productUnit}>/{item.unit}</Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <Text style={styles.productVendor} numberOfLines={1}>
              {vendor?.shop_name || "Vendor"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="star" size={11} color="#FFD700" />
              <Text style={styles.productRating}>
                {productRating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeaderComponent = () => (
    <>
      {/* Vendor Profile Header */}
      <View style={styles.vendorHeader}>
        <View style={styles.vendorProfileSection}>
          {vendor?.avatar_url ? (
            <Image
              source={{ uri: vendor.avatar_url }}
              style={styles.vendorAvatar}
            />
          ) : (
            <View style={styles.vendorAvatarPlaceholder}>
              <MaterialCommunityIcons name="store" size={32} color="#fff" />
            </View>
          )}

          <View style={styles.vendorInfo}>
            <Text style={styles.vendorShopName}>
              {vendor?.shop_name || "Shop Name"}
            </Text>

            {/* Vendor Rating */}
            <View style={styles.vendorRatingContainer}>
              <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
              <Text style={styles.vendorRatingText}>
                {vendorRating.toFixed(1)} • Seller Rating
              </Text>
            </View>

            <View style={styles.vendorMetaRow}>
              <View style={styles.vendorMetaItem}>
                <Ionicons name="calendar-outline" size={14} color="#757575" />
                <Text style={styles.vendorMetaText}>
                  Joined {formatJoinDate(vendor?.created_at)}
                </Text>
              </View>
              <View style={styles.vendorMetaItem}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={14}
                  color="#757575"
                />
                <Text style={styles.vendorMetaText}>
                  {totalProducts} Products
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Chat Button */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={handleChatWithVendor}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>

        {/* Vendor Address */}
        {vendorAddress && (
          <View style={styles.vendorAddressContainer}>
            <View style={styles.addressHeader}>
              <Ionicons
                name="location-outline"
                size={16}
                color={COLORS.light.primary}
              />
              <Text style={styles.addressTitle}>Business Address</Text>
            </View>
            <Text style={styles.addressText}>
              {vendorAddress.full_address ||
                `${vendorAddress.barangay || ""}, ${vendorAddress.municipality || ""}`.trim() ||
                "Address not specified"}
            </Text>
          </View>
        )}

        {/* GCash Number (if available) */}
        {vendor?.gcash_number && (
          <View style={styles.gcashContainer}>
            <View style={styles.gcashHeader}>
              <FontAwesome name="mobile" size={16} color="#00b140" />
              <Text style={styles.gcashTitle}>GCash</Text>
            </View>
            <Text style={styles.gcashNumber}>{vendor.gcash_number}</Text>
          </View>
        )}

        {/* Products Header */}
        <View style={styles.productsHeader}>
          <Text style={styles.productsTitle}>All Products</Text>
          <Text style={styles.productsCount}>{totalProducts} items</Text>
        </View>
      </View>
    </>
  );

  const ListFooterComponent = () => (
    <>
      {loadingProducts && page > 1 && (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={COLORS.light.primary} />
        </View>
      )}
      {!hasMore && products.length > 0 && (
        <View style={styles.endMessage}>
          <Text style={styles.endMessageText}>No more products</Text>
        </View>
      )}
    </>
  );

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
            <Text style={styles.headerTitle}>Vendor Profile</Text>
            <View style={{ width: 40 }} />
          </View>
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  if (!vendor) {
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
            <Text style={styles.headerTitle}>Vendor Profile</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="store-off"
              size={64}
              color="#cbd5e1"
            />
            <Text style={styles.emptyStateText}>Vendor not found</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vendor Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Products Grid */}
        <FlatList
          data={products}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.product_id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productList}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
          ListEmptyComponent={
            !loadingProducts ? (
              <View style={styles.emptyProducts}>
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={48}
                  color="#cbd5e1"
                />
                <Text style={styles.emptyProductsText}>
                  No products available
                </Text>
              </View>
            ) : null
          }
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

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

  // Vendor Profile Section
  vendorHeader: {
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  vendorProfileSection: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  vendorAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.light.primary,
  },
  vendorAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.light.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  vendorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  vendorShopName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 4,
  },
  vendorRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  vendorRatingText: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 4,
    fontWeight: "500",
  },
  vendorMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vendorMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  vendorMetaText: {
    fontSize: 12,
    color: "#757575",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    gap: 8,
  },
  chatButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  vendorAddressContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginLeft: 22,
  },
  gcashContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
  },
  gcashHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 12,
  },
  gcashTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  gcashNumber: {
    fontSize: 14,
    color: "#00b140",
    fontWeight: "500",
  },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  productsCount: {
    fontSize: 14,
    color: "#757575",
  },

  // Products Grid - EXACTLY matching BuyerDashboard style
  productList: {
    paddingBottom: 16,
  },
  productRow: {
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  productImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  freshnessOverlay: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  freshnessOverlayText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  productName: {
    fontWeight: "bold",
    color: COLORS.light.primary,
    fontSize: 18,
    flex: 1,
    marginRight: 8,
  },
  productPrice: {
    fontWeight: "bold",
    color: COLORS.light.coral,
    fontSize: 14,
  },
  productUnit: {
    fontSize: 12,
    color: COLORS.light.oceanMedium,
  },
  productVendor: {
    fontSize: 11,
    color: COLORS.light.oceanMedium,
    marginBottom: 2,
    flex: 1,
  },
  productRating: {
    fontSize: 11,
    color: "#333",
    marginLeft: 4,
    marginRight: 8,
  },

  emptyProducts: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyProductsText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endMessage: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endMessageText: {
    fontSize: 14,
    color: "#999",
  },
});
