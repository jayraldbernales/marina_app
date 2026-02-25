// app/buyer/dashboard.tsx - Using product ratings from reviews table
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
  Alert,
  RefreshControl,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { COLORS } from "../constants";
import { buyerDashboardStyles } from "../components/styles/buyerDashboardStyles";
import BuyerDashboardSkeleton from "../components/skeleton/BuyerDashboardSkeleton";
import { supabase } from "../lib/supabase";
import { computeFreshness, FreshnessStatus } from "../utils/freshness";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  fetchMultipleProductRatings,
  clearProductRatingCache,
} from "../utils/productRatings";

// -------------------- TYPES --------------------

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  thumbnail?: string | null;
  harvested_at: string;
  unit: string;
  vendor: {
    id: string;
    shop_name: string;
    avatar_url?: string | null;
  };
  category?: string | null;
  rating: number; // Product rating from reviews table
  totalReviews: number; // Total number of reviews for this product
  discount_percent?: number | null; // Added discount_percent field
}

interface RawProductRow {
  product_id: string;
  product_name: string;
  price: number;
  stock: number;
  unit: string;
  harvested_at: string;
  images: string[] | null;
  vendor_user_id: string;
  discount_percent?: number | null; // Added discount_percent field
  categories: { category_name: string } | { category_name: string }[] | null;
  vendor_profiles:
    | Array<{
        user_id: string;
        shop_name: string;
        avatar_url: string | null;
      }>
    | {
        user_id: string;
        shop_name: string;
        avatar_url: string | null;
      }
    | null;
}

interface RawCategoryRow {
  category_name: string;
}

interface RawConversationRow {
  id: string;
}

// Freshness filter options
type FreshnessFilter = "all" | FreshnessStatus;

// -------------------- HELPERS --------------------

const getGreeting = (fullName?: string) => {
  const hour = new Date().getHours();
  let greeting = "";

  if (hour >= 5 && hour < 12) {
    greeting = "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    greeting = "Good Afternoon";
  } else if (hour >= 17 && hour < 22) {
    greeting = "Good Evening";
  } else {
    greeting = "Good Night";
  }

  if (fullName && fullName.trim()) {
    const firstName = fullName.trim().split(" ")[0];
    return `${greeting}, ${firstName}!`;
  }

  return `${greeting}!`;
};

const formatPrice = (price: number) => {
  return `₱${Number(price).toLocaleString()}`;
};

const calculateDiscountedPrice = (
  price: number,
  discountPercent: number | null | undefined,
) => {
  if (!discountPercent || discountPercent <= 0) return price;
  return price * (1 - discountPercent / 100);
};

// Freshness filter labels
const FRESHNESS_FILTERS: Array<{
  label: string;
  value: FreshnessFilter;
  color: string;
}> = [
  { label: "All Products", value: "all", color: "#10b981" },
  {
    label: "Today's Catch",
    value: FreshnessStatus.ULTRA_FRESH,
    color: "#10b981",
  },
  {
    label: "Yesterday's Catch",
    value: FreshnessStatus.FRESH,
    color: "#06b6d4",
  },
  { label: "2 Days Ago", value: FreshnessStatus.GOOD, color: "#f59e0b" },
  { label: "3 Days Ago", value: FreshnessStatus.FAIR, color: "#d97706" },
];

// -------------------- COMPONENT --------------------

const BuyerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullName, setFullName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [freshnessFilter, setFreshnessFilter] =
    useState<FreshnessFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // State for unread messages count
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Store conversation IDs for subscription filtering
  const [userConversationIds, setUserConversationIds] = useState<string[]>([]);

  // Refs to manage subscriptions and prevent race conditions
  const subscriptionsRef = useRef<RealtimeChannel[]>([]);
  const isLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup all subscriptions
  const cleanupSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach((sub) => {
      if (sub) {
        supabase.removeChannel(sub);
      }
    });
    subscriptionsRef.current = [];
  }, []);

  // Fetch current user - returns ID instead of relying on state timing
  const fetchCurrentUser = useCallback(async (): Promise<string | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user?.id ?? null;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }, []);

  // Fetch user's conversation IDs for subscription filtering
  const fetchUserConversationIds = useCallback(
    async (userId: string): Promise<string[]> => {
      try {
        const { data, error } = await supabase
          .from("conversations")
          .select("id")
          .eq("buyer_id", userId);

        if (error) {
          console.error("Error fetching conversation IDs:", error);
          return [];
        }

        return ((data as RawConversationRow[]) || []).map((conv) => conv.id);
      } catch (error) {
        console.error("Error in fetchUserConversationIds:", error);
        return [];
      }
    },
    [],
  );

  // Fetch unread messages count - now accepts userId parameter
  const fetchUnreadMessagesCount = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("buyer_unread_count")
        .eq("buyer_id", userId);

      if (error) {
        console.error("Error fetching unread count:", error);
        return;
      }

      const totalUnread = (data || []).reduce(
        (sum, conv) => sum + (conv.buyer_unread_count || 0),
        0,
      );
      setUnreadMessagesCount(totalUnread);
    } catch (error) {
      console.error("Error in fetchUnreadMessagesCount:", error);
    }
  }, []);

  // Set up real-time subscription for unread messages with proper filtering
  const setupUnreadSubscription = useCallback(
    (userId: string, conversationIds: string[]) => {
      // Clean up existing subscriptions first
      cleanupSubscriptions();

      // Unique channel name per user
      const channel = supabase.channel(`unread-messages-${userId}`);

      // Subscribe to conversation updates
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `buyer_id=eq.${userId}`,
        },
        () => {
          fetchUnreadMessagesCount(userId);
        },
      );

      // Subscribe to new messages in existing conversations
      if (conversationIds.length > 0) {
        channel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=in.(${conversationIds.join(",")})`,
          },
          () => {
            fetchUnreadMessagesCount(userId);
          },
        );
      }

      // Subscribe to new conversations being created
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `buyer_id=eq.${userId}`,
        },
        async (payload) => {
          // New conversation created, add its ID to the list
          const newConvId = (payload.new as { id: string }).id;
          setUserConversationIds((prev) => {
            if (!prev.includes(newConvId)) {
              const updatedIds = [...prev, newConvId];

              // Re-setup subscription with new IDs
              setTimeout(() => {
                cleanupSubscriptions();
                const newSub = setupUnreadSubscription(userId, updatedIds);
                if (newSub) {
                  subscriptionsRef.current = [newSub];
                }
              }, 100);

              return updatedIds;
            }
            return prev;
          });

          fetchUnreadMessagesCount(userId);
        },
      );

      channel.subscribe();
      return channel;
    },
    [fetchUnreadMessagesCount, cleanupSubscriptions],
  );

  // Fetch user profile
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setFullName("");
      } else {
        setFullName(data?.full_name || "");
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      setFullName("");
    }
  }, []);

  // Fetch products with product ratings from reviews table
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          product_id,
          product_name,
          price,
          stock,
          unit,
          harvested_at,
          images,
          vendor_user_id,
          discount_percent,
          categories:category_id(category_name),
          vendor_profiles!vendor_user_id(
            user_id,
            shop_name,
            avatar_url
          )
        `,
        )
        .eq("is_active", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.error("Error fetching products:", error);
        Alert.alert("Error", "Failed to load products");
        return [];
      }

      // Get unique product IDs to fetch ratings
      const productIds = (data || []).map((item: any) => item.product_id);

      // Fetch all product ratings at once using the shared function
      const productRatingsMap = await fetchMultipleProductRatings(productIds);

      // Type-safe mapping with proper null checks
      const mappedProducts: Product[] = (data || []).map((item: any) => {
        // Handle categories (could be array or single object)
        let categoryName: string | null = null;
        if (item.categories) {
          if (Array.isArray(item.categories) && item.categories.length > 0) {
            categoryName = item.categories[0]?.category_name || null;
          } else if (
            !Array.isArray(item.categories) &&
            item.categories.category_name
          ) {
            categoryName = item.categories.category_name;
          }
        }

        // Handle vendor_profiles (could be array or single object)
        let vendorData = item.vendor_profiles;
        let shopName = "Seafood Vendor";
        let avatarUrl: string | null = null;

        if (vendorData) {
          if (Array.isArray(vendorData) && vendorData.length > 0) {
            shopName = vendorData[0]?.shop_name || "Seafood Vendor";
            avatarUrl = vendorData[0]?.avatar_url || null;
          } else if (!Array.isArray(vendorData) && vendorData?.shop_name) {
            shopName = vendorData.shop_name;
            avatarUrl = vendorData.avatar_url || null;
          }
        }

        // Get product rating from map
        const productRating = productRatingsMap[item.product_id] || {
          rating: 0,
          totalReviews: 0,
        };

        return {
          id: item.product_id,
          name: item.product_name,
          price: Number(item.price ?? 0),
          stock: Number(item.stock ?? 0),
          thumbnail: item.images?.[0] ?? null,
          harvested_at: item.harvested_at,
          unit: item.unit,
          vendor: {
            id: item.vendor_user_id,
            shop_name: shopName,
            avatar_url: avatarUrl,
          },
          category: categoryName,
          rating: productRating.rating,
          totalReviews: productRating.totalReviews,
          discount_percent: item.discount_percent,
        };
      });

      return mappedProducts;
    } catch (error) {
      console.error("Error in fetchProducts:", error);
      return [];
    }
  }, []);

  // Filter products based on freshness AND category (case-insensitive)
  const filterProducts = useCallback(
    (
      products: Product[],
      freshnessFilter: FreshnessFilter,
      category: string | null,
    ) => {
      return products.filter((product) => {
        const freshness = computeFreshness(product.harvested_at);

        // Filter out NOT_FRESH
        if (freshness.status === "not_fresh") {
          return false;
        }

        // Filter by category if selected (case-insensitive)
        if (
          category &&
          product.category?.toLowerCase() !== category.toLowerCase()
        ) {
          return false;
        }

        // Filter by freshness
        if (freshnessFilter !== "all" && freshness.status !== freshnessFilter) {
          return false;
        }

        return true;
      });
    },
    [],
  );

  // Apply filters whenever allProducts, freshnessFilter, or selectedCategory changes
  useEffect(() => {
    if (allProducts.length > 0) {
      const filtered = filterProducts(
        allProducts,
        freshnessFilter,
        selectedCategory,
      );
      setFilteredProducts(filtered);
    }
  }, [allProducts, freshnessFilter, selectedCategory, filterProducts]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("category_name")
        .order("category_name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        return [];
      }

      const categoryNames = ((data as RawCategoryRow[]) || []).map(
        (cat) => cat.category_name,
      );
      return categoryNames;
    } catch (error) {
      console.error("Error in fetchCategories:", error);
      return [];
    }
  }, []);

  // Load all data with proper sequencing and race condition protection
  const loadData = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) return;

    // Abort any ongoing operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    isLoadingRef.current = true;

    try {
      setLoading(true);

      // Step 1: Get user ID first
      const userId = await fetchCurrentUser();
      setCurrentUserId(userId);

      // Step 2: Fetch user profile (needs userId)
      if (userId) {
        await fetchUserProfile(userId);
      }

      // Step 3: Fetch products and categories (can run in parallel)
      const [productsData, categoriesData] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
      ]);

      setAllProducts(productsData);
      setCategories(categoriesData);

      // Step 4: Fetch unread count and conversation IDs (needs userId)
      if (userId) {
        await fetchUnreadMessagesCount(userId);
        const convIds = await fetchUserConversationIds(userId);
        setUserConversationIds(convIds);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingRef.current = false;
    }
  }, [
    fetchCurrentUser,
    fetchUserProfile,
    fetchProducts,
    fetchCategories,
    fetchUnreadMessagesCount,
    fetchUserConversationIds,
  ]);

  // Set up real-time subscription after user ID and conversation IDs are loaded
  useEffect(() => {
    if (currentUserId && userConversationIds.length > 0) {
      const subscription = setupUnreadSubscription(
        currentUserId,
        userConversationIds,
      );
      if (subscription) {
        subscriptionsRef.current.push(subscription);
      }
    }

    return cleanupSubscriptions;
  }, [
    currentUserId,
    userConversationIds,
    setupUnreadSubscription,
    cleanupSubscriptions,
  ]);

  //  useFocusEffect to clear cache and refresh data
  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        fetchUnreadMessagesCount(currentUserId);
      }

      clearProductRatingCache();
      loadData();
    }, [currentUserId, fetchUnreadMessagesCount, loadData]),
  );

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update greeting
  useEffect(() => {
    setGreeting(getGreeting(fullName));

    const interval = setInterval(() => {
      setGreeting(getGreeting(fullName));
    }, 60000);

    return () => clearInterval(interval);
  }, [fullName]);

  // Pull to refresh - now just call loadData once
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Handlers
  const handleProductPress = useCallback((product: Product) => {
    router.push(`./buyer/product-details?product_id=${product.id}`);
  }, []);

  const handleCategoryPress = useCallback(
    (category: string) => {
      if (selectedCategory === category) {
        setSelectedCategory(null);
      } else {
        setSelectedCategory(category);
      }
    },
    [selectedCategory],
  );

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      router.push(`./buyer/search?q=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery]);

  const handleFilterPress = (filterValue: FreshnessFilter) => {
    setFreshnessFilter(filterValue);
    setShowFilterModal(false);
  };

  const handleChatPress = () => {
    router.push("/buyer/conversation");
  };

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFreshnessFilter("all");
    setSelectedCategory(null);
  }, []);

  // Get current filter label
  const getCurrentFilterLabel = () => {
    const filter = FRESHNESS_FILTERS.find((f) => f.value === freshnessFilter);
    return filter ? filter.label : "All Products";
  };

  // Promos
  const promos = [
    {
      title: "Early Bird Special",
      description: "20% off orders before 10 AM",
      color: COLORS.light.coral,
      textColor: "#fff",
    },
    {
      title: "Free Delivery",
      description: "On orders above ₱1,500",
      color: COLORS.light.aquaBright,
      textColor: COLORS.light.primary,
    },
  ];

  // Check if any filter is active
  const isFilterActive = freshnessFilter !== "all" || selectedCategory !== null;

  if (loading) {
    return <BuyerDashboardSkeleton />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.primary }}>
      <View style={buyerDashboardStyles.container}>
        {/* Header */}
        <View style={buyerDashboardStyles.header}>
          <View style={buyerDashboardStyles.headerTop}>
            <View>
              <Text style={buyerDashboardStyles.headerTitle}>{greeting}</Text>
              <Text style={buyerDashboardStyles.headerSubtitle}>
                What's fresh today?
              </Text>
            </View>

            {/* Chat Button with Unread Badge */}
            <TouchableOpacity
              style={buyerDashboardStyles.chatButton}
              onPress={handleChatPress}
              accessibilityLabel="Open chat"
            >
              <Ionicons
                name="chatbox-ellipses-outline"
                size={25}
                color="#fff"
              />
              {unreadMessagesCount > 0 && (
                <View style={buyerDashboardStyles.unreadBadge}>
                  <Text style={buyerDashboardStyles.unreadBadgeText}>
                    {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={buyerDashboardStyles.searchBarContainer}>
            <Feather
              name="search"
              size={20}
              color="#005f73"
              style={buyerDashboardStyles.searchIcon}
            />
            <TextInput
              style={buyerDashboardStyles.searchInput}
              placeholder="Search fresh seafood..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              placeholderTextColor={COLORS.light.mutedForeground}
              accessibilityLabel="Search bar"
            />
          </View>
        </View>

        <ScrollView
          style={buyerDashboardStyles.scrollArea}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Promos */}
          <Text
            style={[buyerDashboardStyles.sectionTitle, { marginBottom: 12 }]}
          >
            Today's Offers
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            {promos.map((promo, idx) => (
              <View
                key={idx}
                style={[
                  buyerDashboardStyles.promoCard,
                  { backgroundColor: promo.color },
                ]}
              >
                <Text
                  style={[
                    buyerDashboardStyles.promoTitle,
                    { color: promo.textColor },
                  ]}
                >
                  {promo.title}
                </Text>
                <Text
                  style={[
                    buyerDashboardStyles.promoDesc,
                    { color: promo.textColor },
                  ]}
                >
                  {promo.description}
                </Text>
              </View>
            ))}
          </View>

          {/* Categories */}
          <Text
            style={[buyerDashboardStyles.sectionTitle, { marginBottom: 12 }]}
          >
            Categories
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 12 }}
            style={{ marginBottom: 12 }}
          >
            {categories.map((category, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  buyerDashboardStyles.categoryCard,
                  selectedCategory === category && {
                    backgroundColor: COLORS.light.primary,
                  },
                ]}
                onPress={() => handleCategoryPress(category)}
                accessibilityLabel={`Browse ${category}`}
              >
                <Text
                  style={[
                    buyerDashboardStyles.categoryName,
                    selectedCategory === category && {
                      color: "#fff",
                    },
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Active Filters */}
          {isFilterActive && (
            <View
              style={{
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Text style={{ color: "#666", fontSize: 12, marginRight: 8 }}>
                Active filters:
              </Text>
              {selectedCategory && (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: COLORS.light.seafoam,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginRight: 8,
                    marginBottom: 4,
                  }}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text style={{ color: COLORS.light.primary, fontSize: 12 }}>
                    {selectedCategory}
                  </Text>
                  <Ionicons
                    name="close"
                    size={14}
                    color={COLORS.light.primary}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              )}
              {freshnessFilter !== "all" && (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: COLORS.light.seafoam,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginRight: 8,
                    marginBottom: 4,
                  }}
                  onPress={() => setFreshnessFilter("all")}
                >
                  <Text style={{ color: COLORS.light.primary, fontSize: 12 }}>
                    {getCurrentFilterLabel()}
                  </Text>
                  <Ionicons
                    name="close"
                    size={14}
                    color={COLORS.light.primary}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Fresh Catch Header with Filter */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={buyerDashboardStyles.sectionTitle}>Fresh Catch</Text>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: COLORS.light.seafoam,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
              onPress={() => setShowFilterModal(true)}
            >
              <Feather name="filter" size={16} color={COLORS.light.primary} />
              <Text
                style={{
                  color: COLORS.light.primary,
                  fontSize: 14,
                  marginLeft: 4,
                  fontWeight: "500",
                }}
              >
                {getCurrentFilterLabel()}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={COLORS.light.primary}
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          </View>

          {filteredProducts.length === 0 ? (
            <View style={{ alignItems: "center", padding: 20 }}>
              <Ionicons name="fish-outline" size={48} color="#ccc" />
              <Text
                style={{ color: "#666", marginTop: 10, textAlign: "center" }}
              >
                {allProducts.length === 0
                  ? "No products available at the moment"
                  : isFilterActive
                    ? "No products match your filters"
                    : "No fresh products available"}
              </Text>
              {allProducts.length > 0 && isFilterActive && (
                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: COLORS.light.primary,
                    borderRadius: 20,
                  }}
                  onPress={clearAllFilters}
                >
                  <Text style={{ color: "#fff", fontSize: 12 }}>
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              {filteredProducts.map((product) => {
                const freshness = computeFreshness(product.harvested_at);
                const originalPrice = product.price;
                const discountPercent = product.discount_percent || 0;
                const discountedPrice = calculateDiscountedPrice(
                  originalPrice,
                  discountPercent,
                );
                const hasDiscount =
                  discountPercent > 0 && discountedPrice < originalPrice;

                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      buyerDashboardStyles.productCard,
                      {
                        width: "49%",
                        marginBottom: 12,
                      },
                    ]}
                    onPress={() => handleProductPress(product)}
                    accessibilityLabel={`${product.name}, ${product.price} per ${product.unit}`}
                  >
                    <View style={{ position: "relative" }}>
                      {product.thumbnail ? (
                        <Image
                          source={{ uri: product.thumbnail }}
                          style={buyerDashboardStyles.productImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            buyerDashboardStyles.productImage,
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

                      {/* Freshness Overlay */}
                      <View
                        style={[
                          buyerDashboardStyles.freshnessOverlay,
                          { backgroundColor: freshness.color },
                        ]}
                      >
                        <Text style={buyerDashboardStyles.freshnessOverlayText}>
                          {freshness.label}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flex: 1 }}>
                      {/* First row: Product name and price */}
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 2,
                        }}
                      >
                        <Text
                          style={buyerDashboardStyles.productName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {product.name}
                        </Text>

                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          {hasDiscount ? (
                            <>
                              <Text
                                style={buyerDashboardStyles.discountedPrice}
                              >
                                {formatPrice(discountedPrice)}
                              </Text>
                            </>
                          ) : (
                            <Text style={buyerDashboardStyles.productPrice}>
                              {formatPrice(originalPrice)}
                            </Text>
                          )}
                          <Text style={buyerDashboardStyles.productUnit}>
                            /{product.unit}
                          </Text>
                        </View>
                      </View>

                      {/* Second row: Vendor name on left, product rating on right */}
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={buyerDashboardStyles.productVendor}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {product.vendor.shop_name}
                        </Text>
                        {/* Discount Badge */}
                        {hasDiscount && (
                          <View style={buyerDashboardStyles.discountBadge}>
                            <Text style={buyerDashboardStyles.discountText}>
                              -{discountPercent}%
                            </Text>
                          </View>
                        )}
                        {/* Rating section - Using actual product rating from reviews table */}
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <MaterialCommunityIcons
                            name="star"
                            size={11}
                            color="#FFD700"
                          />
                          <Text style={buyerDashboardStyles.productRating}>
                            {product.rating > 0
                              ? product.rating.toFixed(1)
                              : "0.0"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "50%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: COLORS.light.primary,
                }}
              >
                Filter by Freshness
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={FRESHNESS_FILTERS}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f0f0f0",
                  }}
                  onPress={() => handleFilterPress(item.value)}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: item.color,
                      marginRight: 12,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color:
                        freshnessFilter === item.value
                          ? COLORS.light.primary
                          : "#333",
                      fontWeight:
                        freshnessFilter === item.value ? "600" : "400",
                    }}
                  >
                    {item.label}
                  </Text>
                  {freshnessFilter === item.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={COLORS.light.primary}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BuyerDashboard;
