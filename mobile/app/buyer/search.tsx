// app/buyer/search.tsx - Search results screen for buyers
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../constants";
import { buyerDashboardStyles } from "../../components/styles/buyerDashboardStyles";
import { supabase } from "../../lib/supabase";
import { computeFreshness, FreshnessStatus } from "../../utils/freshness";
import { useDebounce } from "../../hooks/useDebounce";

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
  type: "product";
}

interface Vendor {
  id: string;
  shop_name: string;
  avatar_url?: string | null;
  description?: string | null;
  location?: string | null;
  product_count?: number;
  rating?: number;
  type: "vendor";
}

type SearchResult = Product | Vendor;

// Filter types
type FreshnessFilter = "all" | FreshnessStatus;
type PriceRangeFilter =
  | "all"
  | "under_200"
  | "200_to_500"
  | "500_to_1000"
  | "over_1000";

interface PriceRange {
  label: string;
  value: PriceRangeFilter;
  min?: number;
  max?: number;
}

// For useLocalSearchParams
type SearchParams = Record<string, string | string[]> & {
  q?: string;
};

// Freshness result type
interface FreshnessResult {
  status: FreshnessStatus;
  label: string;
  color: string;
}

// -------------------- CONSTANTS --------------------

const FRESHNESS_FILTERS: Array<{
  label: string;
  value: FreshnessFilter;
  color: string;
}> = [
  { label: "All Freshness", value: "all", color: "#10b981" },
  {
    label: "Today's Catch",
    value: FreshnessStatus.ULTRA_FRESH,
    color: "#10b981",
  },
  { label: "Fresh (Iced)", value: FreshnessStatus.FRESH, color: "#06b6d4" },
  { label: "Still Fresh", value: FreshnessStatus.GOOD, color: "#f59e0b" },
  { label: "Use Soon", value: FreshnessStatus.FAIR, color: "#d97706" },
];

const PRICE_RANGES: PriceRange[] = [
  { label: "All Prices", value: "all" },
  { label: "Under ₱200", value: "under_200", max: 200 },
  { label: "₱200 - ₱500", value: "200_to_500", min: 200, max: 500 },
  { label: "₱500 - ₱1000", value: "500_to_1000", min: 500, max: 1000 },
  { label: "Over ₱1000", value: "over_1000", min: 1000 },
];

// -------------------- HELPER FUNCTIONS --------------------

const formatPrice = (price: number) => {
  return `₱${Number(price).toLocaleString()}`;
};

const getFreshnessScore = (harvestedAt: string): number => {
  const freshness = computeFreshness(harvestedAt);
  switch (freshness.status) {
    case FreshnessStatus.ULTRA_FRESH:
      return 4;
    case FreshnessStatus.FRESH:
      return 3;
    case FreshnessStatus.GOOD:
      return 2;
    case FreshnessStatus.FAIR:
      return 1;
    default:
      return 0;
  }
};

// Type guards
const isProduct = (item: SearchResult): item is Product => {
  return item.type === "product";
};

const isVendor = (item: SearchResult): item is Vendor => {
  return item.type === "vendor";
};

// -------------------- COMPONENT --------------------

const BuyerSearch = () => {
  const params = useLocalSearchParams<SearchParams>();
  const initialQuery = typeof params.q === "string" ? params.q : "";

  // State
  const [searchQuery, setSearchQuery] = useState(initialQuery || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [freshnessFilter, setFreshnessFilter] =
    useState<FreshnessFilter>("all");
  const [priceRangeFilter, setPriceRangeFilter] =
    useState<PriceRangeFilter>("all");

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showFreshnessModal, setShowFreshnessModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Sort state
  const [sortBy, setSortBy] = useState<
    "relevance" | "price_asc" | "price_desc" | "freshness"
  >("relevance");

  const debouncedSearch = useDebounce(searchQuery, 500);
  const ITEMS_PER_PAGE = 20;

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("category_name")
        .order("category_name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        return;
      }

      setCategories((data || []).map((cat) => cat.category_name));
    } catch (error) {
      console.error("Error in fetchCategories:", error);
    }
  }, []);

  // Search products
  const searchProducts = useCallback(async (query: string) => {
    try {
      let dbQuery = supabase
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
            categories:category_id(category_name),
            vendor_profiles!vendor_user_id(
              user_id,
              shop_name,
              avatar_url
            )
          `,
        )
        .eq("is_active", true)
        .gt("stock", 0);

      if (query.trim()) {
        dbQuery = dbQuery.ilike("product_name", `%${query}%`);
      }

      const { data, error } = await dbQuery.order("created_at", {
        ascending: false,
      });

      if (error) {
        console.error("Error searching products:", error);
        return [];
      }

      return (data || []).map((item: any) => {
        let categoryName: string | null = null;
        if (item.categories) {
          if (Array.isArray(item.categories) && item.categories.length > 0) {
            categoryName = item.categories[0]?.category_name || null;
          } else if (
            !Array.isArray(item.categories) &&
            item.categories?.category_name
          ) {
            categoryName = item.categories.category_name;
          }
        }

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
          type: "product" as const,
        };
      });
    } catch (error) {
      console.error("Error in searchProducts:", error);
      return [];
    }
  }, []);

  // Search vendors
  const searchVendors = useCallback(async (query: string) => {
    try {
      let dbQuery = supabase
        .from("vendor_profiles")
        .select(
          `
            user_id,
            shop_name,
            avatar_url,
            gcash_name,
            approval_status
          `,
        )
        .eq("approval_status", "approved");

      if (query.trim()) {
        dbQuery = dbQuery.ilike("shop_name", `%${query}%`);
      }

      const { data, error } = await dbQuery.order("shop_name", {
        ascending: true,
      });

      if (error) {
        console.error("Error searching vendors:", error);
        return [];
      }

      const vendorsWithDetails = await Promise.all(
        (data || []).map(async (vendor: any) => {
          const { count: productCount } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("vendor_user_id", vendor.user_id)
            .eq("is_active", true)
            .gt("stock", 0);

          return {
            id: vendor.user_id,
            shop_name: vendor.shop_name || "Unnamed Shop",
            avatar_url: vendor.avatar_url,
            description: null,
            location: null,
            product_count: productCount || 0,
            rating: 4.5,
            type: "vendor" as const,
          };
        }),
      );

      return vendorsWithDetails;
    } catch (error) {
      console.error("Error in searchVendors:", error);
      return [];
    }
  }, []);

  // Apply all filters
  const applyFilters = useCallback(
    (items: SearchResult[]) => {
      return items.filter((item) => {
        // For vendors, only show if they match the search query (no other filters apply)
        if (isVendor(item)) {
          return true;
        }

        // For products, apply all filters
        if (isProduct(item)) {
          // Category filter
          if (
            selectedCategory &&
            item.category?.toLowerCase() !== selectedCategory.toLowerCase()
          ) {
            return false;
          }

          // Price filter
          if (priceRangeFilter !== "all") {
            const range = PRICE_RANGES.find(
              (r) => r.value === priceRangeFilter,
            );
            if (range) {
              if (range.min !== undefined && item.price < range.min)
                return false;
              if (range.max !== undefined && item.price > range.max)
                return false;
            }
          }

          // Freshness filter
          if (freshnessFilter !== "all") {
            const freshness = computeFreshness(item.harvested_at);
            if (freshness.status !== freshnessFilter) return false;
          }

          return true;
        }

        return true;
      });
    },
    [selectedCategory, priceRangeFilter, freshnessFilter],
  );

  // Apply sorting
  const applySorting = useCallback(
    (items: SearchResult[]) => {
      const sorted = [...items];

      // Separate products and vendors
      const products = sorted.filter(isProduct);
      const vendors = sorted.filter(isVendor);

      // Sort products
      const sortedProducts = [...products] as Product[];
      switch (sortBy) {
        case "price_asc":
          sortedProducts.sort((a, b) => a.price - b.price);
          break;
        case "price_desc":
          sortedProducts.sort((a, b) => b.price - a.price);
          break;
        case "freshness":
          sortedProducts.sort((a, b) => {
            const scoreA = getFreshnessScore(a.harvested_at);
            const scoreB = getFreshnessScore(b.harvested_at);
            return scoreB - scoreA;
          });
          break;
        case "relevance":
        default:
          // Keep original order
          break;
      }

      // Sort vendors alphabetically
      const sortedVendors = [...vendors] as Vendor[];
      sortedVendors.sort((a, b) => a.shop_name.localeCompare(b.shop_name));

      // Return vendors first, then products
      return [...sortedVendors, ...sortedProducts];
    },
    [sortBy],
  );

  // Handle search
  const performSearch = useCallback(async () => {
    if (debouncedSearch === undefined) return;

    setLoading(true);
    setPage(1);

    try {
      // Search both products and vendors in parallel
      const [productResults, vendorResults] = await Promise.all([
        searchProducts(debouncedSearch),
        searchVendors(debouncedSearch),
      ]);

      // Combine results
      const combined = [...vendorResults, ...productResults] as SearchResult[];
      setResults(combined);
      setTotalCount(combined.length);
      setHasMore(false); // Since we're not paginating for now
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, searchProducts, searchVendors]);

  // Update filtered results when filters or sort change
  useEffect(() => {
    if (results.length > 0) {
      const filtered = applyFilters(results);
      const sorted = applySorting(filtered);
      setFilteredResults(sorted);
    } else {
      setFilteredResults([]);
    }
  }, [
    results,
    selectedCategory,
    priceRangeFilter,
    freshnessFilter,
    sortBy,
    applyFilters,
    applySorting,
  ]);

  // Initial load
  useEffect(() => {
    fetchCategories();
    performSearch();
  }, []);

  // Handle search input changes
  useEffect(() => {
    performSearch();
  }, [debouncedSearch]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    performSearch();
  }, [performSearch]);

  // Handlers
  const handleProductPress = useCallback((product: Product) => {
    router.push(`/buyer/product-details?product_id=${product.id}`);
  }, []);

  const handleVendorPress = useCallback((vendor: Vendor) => {
    router.push(`/buyer/view-vendor?vendor_user_id=${vendor.id}`);
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCategory(null);
    setFreshnessFilter("all");
    setPriceRangeFilter("all");
  }, []);

  // Get active filter count
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (freshnessFilter !== "all") count++;
    if (priceRangeFilter !== "all") count++;
    return count;
  }, [selectedCategory, freshnessFilter, priceRangeFilter]);

  // Get filter labels
  const getCategoryLabel = () => selectedCategory || "Category";
  const getFreshnessLabel = () => {
    const filter = FRESHNESS_FILTERS.find((f) => f.value === freshnessFilter);
    return filter ? filter.label : "Freshness";
  };
  const getPriceLabel = () => {
    const range = PRICE_RANGES.find((r) => r.value === priceRangeFilter);
    return range ? range.label : "Price";
  };
  const getSortLabel = () => {
    switch (sortBy) {
      case "price_asc":
        return "Price: Low to High";
      case "price_desc":
        return "Price: High to Low";
      case "freshness":
        return "Freshness";
      default:
        return "Relevance";
    }
  };

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => {
    const freshness = computeFreshness(item.harvested_at);

    return (
      <TouchableOpacity
        style={{
          flexDirection: "row",
          padding: 12,
          backgroundColor: "#fff",
          borderRadius: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: "#f0f0f0",
        }}
        onPress={() => handleProductPress(item)}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 8,
            overflow: "hidden",
            marginRight: 12,
          }}
        >
          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#f3f4f6",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="image" size={28} color="#9ca3af" />
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#333",
                flex: 1,
              }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View
              style={{
                backgroundColor: freshness.color,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                marginLeft: 8,
              }}
            >
              <Text style={{ fontSize: 10, color: "#fff", fontWeight: "500" }}>
                {freshness.label}
              </Text>
            </View>
          </View>

          <Text
            style={{ fontSize: 13, color: "#666", marginTop: 2 }}
            numberOfLines={1}
          >
            {item.vendor.shop_name}
          </Text>

          {item.category && (
            <Text style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
              {item.category}
            </Text>
          )}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: COLORS.light.primary,
                }}
              >
                {formatPrice(item.price)}
              </Text>
              <Text style={{ fontSize: 12, color: "#666", marginLeft: 2 }}>
                /{item.unit}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                color: item.stock > 10 ? "#10b981" : "#f59e0b",
              }}
            >
              {item.stock > 0 ? `${item.stock} left` : "Out of stock"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render vendor item
  const renderVendorItem = ({ item }: { item: Vendor }) => {
    return (
      <TouchableOpacity
        style={{
          flexDirection: "row",
          padding: 12,
          backgroundColor: "#fff",
          borderRadius: 12,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: "#f0f0f0",
        }}
        onPress={() => handleVendorPress(item)}
      >
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            overflow: "hidden",
            marginRight: 12,
            backgroundColor: "#f3f4f6",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {item.avatar_url ? (
            <Image
              source={{ uri: item.avatar_url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="storefront-outline" size={30} color="#9ca3af" />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#333",
              marginBottom: 4,
            }}
            numberOfLines={1}
          >
            {item.shop_name}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 11, color: "#666", marginLeft: 2 }}>
                {item.product_count || 0} products
              </Text>
            </View>

            {item.rating && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="star" size={12} color="#FFB800" />
                <Text style={{ fontSize: 11, color: "#666", marginLeft: 2 }}>
                  {item.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#ccc"
          style={{ alignSelf: "center" }}
        />
      </TouchableOpacity>
    );
  };

  // Render search result item
  const renderItem = ({ item }: { item: SearchResult }) => {
    if (isProduct(item)) {
      return renderProductItem({ item });
    } else {
      return renderVendorItem({ item });
    }
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={{ alignItems: "center", padding: 40 }}>
        <Ionicons name="search-outline" size={64} color="#ccc" />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#333",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          {searchQuery.trim()
            ? "No results found"
            : "Search for products or vendors"}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#666",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {searchQuery.trim()
            ? `We couldn't find any matches for "${searchQuery}"`
            : "Try searching for fresh seafood, shop names, or categories"}
        </Text>
        {getActiveFilterCount() > 0 && (
          <TouchableOpacity
            style={{
              marginTop: 16,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: COLORS.light.primary,
              borderRadius: 20,
            }}
            onPress={handleClearFilters}
          >
            <Text style={{ color: "#fff", fontSize: 14 }}>
              Clear All Filters
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.primary }}>
      <View style={buyerDashboardStyles.container}>
        {/* Header */}
        <View style={buyerDashboardStyles.headerSearch}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={handleBack}
              style={{ marginRight: 12 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View
              style={[buyerDashboardStyles.searchBarContainer, { flex: 1 }]}
            >
              <Feather
                name="search"
                size={20}
                color={COLORS.light.primary}
                style={buyerDashboardStyles.searchIcon}
              />
              <TextInput
                style={buyerDashboardStyles.searchInput}
                placeholder="Search products or vendors..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.light.mutedForeground}
                autoFocus={true}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  style={{ padding: 8 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={COLORS.light.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View
          style={{
            backgroundColor: "#fff",
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#f0f0f0",
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {/* Category Filter */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: selectedCategory
                  ? COLORS.light.primary
                  : "#f0f0f0",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                marginRight: 8,
              }}
              onPress={() => setShowCategoryModal(true)}
            >
              <Ionicons
                name="grid-outline"
                size={14}
                color={selectedCategory ? "#fff" : "#666"}
              />
              <Text
                style={{
                  color: selectedCategory ? "#fff" : "#666",
                  fontSize: 13,
                  marginLeft: 4,
                  fontWeight: "500",
                }}
              >
                {getCategoryLabel()}
              </Text>
              {selectedCategory && (
                <TouchableOpacity
                  onPress={() => setSelectedCategory(null)}
                  style={{ marginLeft: 4 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Price Range Filter */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor:
                  priceRangeFilter !== "all" ? COLORS.light.primary : "#f0f0f0",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                marginRight: 8,
              }}
              onPress={() => setShowPriceModal(true)}
            >
              <Ionicons
                name="pricetag-outline"
                size={14}
                color={priceRangeFilter !== "all" ? "#fff" : "#666"}
              />
              <Text
                style={{
                  color: priceRangeFilter !== "all" ? "#fff" : "#666",
                  fontSize: 13,
                  marginLeft: 4,
                  fontWeight: "500",
                }}
              >
                {getPriceLabel()}
              </Text>
              {priceRangeFilter !== "all" && (
                <TouchableOpacity
                  onPress={() => setPriceRangeFilter("all")}
                  style={{ marginLeft: 4 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Freshness Filter */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor:
                  freshnessFilter !== "all" ? COLORS.light.primary : "#f0f0f0",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                marginRight: 8,
              }}
              onPress={() => setShowFreshnessModal(true)}
            >
              <Ionicons
                name="water-outline"
                size={14}
                color={freshnessFilter !== "all" ? "#fff" : "#666"}
              />
              <Text
                style={{
                  color: freshnessFilter !== "all" ? "#fff" : "#666",
                  fontSize: 13,
                  marginLeft: 4,
                  fontWeight: "500",
                }}
              >
                {getFreshnessLabel()}
              </Text>
              {freshnessFilter !== "all" && (
                <TouchableOpacity
                  onPress={() => setFreshnessFilter("all")}
                  style={{ marginLeft: 4 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Sort Button */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f0f0f0",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
              onPress={() => setShowSortModal(true)}
            >
              <Feather name="sliders" size={14} color="#666" />
              <Text
                style={{
                  color: "#666",
                  fontSize: 13,
                  marginLeft: 4,
                  fontWeight: "500",
                }}
              >
                Sort: {getSortLabel()}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Active Filters Summary */}
          {getActiveFilterCount() > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingTop: 8,
              }}
            >
              <Text style={{ fontSize: 11, color: "#666", marginRight: 8 }}>
                {getActiveFilterCount()} active{" "}
                {getActiveFilterCount() === 1 ? "filter" : "filters"}
              </Text>
              <TouchableOpacity onPress={handleClearFilters}>
                <Text
                  style={{
                    fontSize: 11,
                    color: COLORS.light.primary,
                    fontWeight: "500",
                  }}
                >
                  Clear all
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Results Count */}
        {!loading && filteredResults.length > 0 && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: "#f8f9fa",
            }}
          >
            <Text style={{ fontSize: 13, color: "#666" }}>
              Found {filteredResults.length}{" "}
              {filteredResults.length === 1 ? "result" : "results"}
              {searchQuery.trim() ? ` for "${searchQuery}"` : ""}
            </Text>
          </View>
        )}

        {/* Results List */}
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.light.primary]}
            />
          }
        />

        {/* Category Filter Modal */}
        <Modal
          visible={showCategoryModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCategoryModal(false)}
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
                maxHeight: "70%",
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
                  Filter by Category
                </Text>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={categories}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f0f0f0",
                    }}
                    onPress={() => {
                      setSelectedCategory(item);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color:
                          selectedCategory === item
                            ? COLORS.light.primary
                            : "#333",
                        flex: 1,
                      }}
                    >
                      {item}
                    </Text>
                    {selectedCategory === item && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={COLORS.light.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Price Range Filter Modal */}
        <Modal
          visible={showPriceModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPriceModal(false)}
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
                  Filter by Price
                </Text>
                <TouchableOpacity onPress={() => setShowPriceModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {PRICE_RANGES.map((range) => (
                <TouchableOpacity
                  key={range.value}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f0f0f0",
                  }}
                  onPress={() => {
                    setPriceRangeFilter(range.value);
                    setShowPriceModal(false);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color:
                        priceRangeFilter === range.value
                          ? COLORS.light.primary
                          : "#333",
                      flex: 1,
                    }}
                  >
                    {range.label}
                  </Text>
                  {priceRangeFilter === range.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={COLORS.light.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Freshness Filter Modal */}
        <Modal
          visible={showFreshnessModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFreshnessModal(false)}
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
                <TouchableOpacity onPress={() => setShowFreshnessModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {FRESHNESS_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f0f0f0",
                  }}
                  onPress={() => {
                    setFreshnessFilter(filter.value);
                    setShowFreshnessModal(false);
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: filter.color,
                      marginRight: 12,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color:
                        freshnessFilter === filter.value
                          ? COLORS.light.primary
                          : "#333",
                      flex: 1,
                    }}
                  >
                    {filter.label}
                  </Text>
                  {freshnessFilter === filter.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={COLORS.light.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Sort Modal */}
        <Modal
          visible={showSortModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSortModal(false)}
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
                  Sort By
                </Text>
                <TouchableOpacity onPress={() => setShowSortModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {[
                { value: "relevance", label: "Relevance" },
                { value: "price_asc", label: "Price: Low to High" },
                { value: "price_desc", label: "Price: High to Low" },
                { value: "freshness", label: "Freshness" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f0f0f0",
                  }}
                  onPress={() => {
                    setSortBy(option.value as typeof sortBy);
                    setShowSortModal(false);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color:
                        sortBy === option.value ? COLORS.light.primary : "#333",
                      flex: 1,
                    }}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={COLORS.light.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default BuyerSearch;
