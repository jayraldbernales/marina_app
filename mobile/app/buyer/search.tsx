// app/buyer/search.tsx - Search results screen for buyers
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
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
    address?: string | null;
    barangay?: string | null;
    municipality?: string | null;
  };
  category?: string | null;
  type: "product";
  freshness_status: FreshnessStatus;
  discount_percent?: number | null;
}

interface Vendor {
  id: string;
  shop_name: string;
  avatar_url?: string | null;
  description?: string | null;
  address?: string | null;
  barangay?: string | null;
  municipality?: string | null;
  product_count?: number;
  rating: number;
  totalReviews: number;
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

// Review data type
interface ReviewData {
  vendor_rating: number;
  review_id: string;
  created_at: string;
}

// Address data type
interface AddressData {
  address_id: string;
  full_address: string | null;
  purok: string | null;
  barangay: string | null;
  municipality: string | null;
  address_type: string | null;
  is_default: boolean;
}

// -------------------- CONSTANTS --------------------

const FRESHNESS_FILTERS: Array<{
  label: string;
  value: FreshnessFilter;
  color: string;
}> = [
  { label: "All Catch Date", value: "all", color: "#10b981" },
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

// Filter out products that are not fresh (exclude OLD/NOT_FRESH)
const ALLOWED_FRESHNESS = [
  FreshnessStatus.PRE_ORDER,
  FreshnessStatus.ULTRA_FRESH,
  FreshnessStatus.FRESH,
  FreshnessStatus.GOOD,
  FreshnessStatus.FAIR,
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

const calculateDiscountedPrice = (
  price: number,
  discountPercent: number | null | undefined,
) => {
  if (!discountPercent || discountPercent <= 0) return price;
  return price * (1 - discountPercent / 100);
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

// Check if product is fresh enough to display
const isProductFresh = (harvestedAt: string): boolean => {
  const freshness = computeFreshness(harvestedAt);
  return ALLOWED_FRESHNESS.includes(freshness.status);
};

// Format address for display
const formatAddress = (vendor: {
  barangay?: string | null;
  municipality?: string | null;
}): string => {
  if (vendor.barangay && vendor.municipality) {
    return `${vendor.barangay}, ${vendor.municipality}`;
  } else if (vendor.barangay) {
    return vendor.barangay;
  } else if (vendor.municipality) {
    return vendor.municipality;
  }
  return "Location not set";
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
  const [locations, setLocations] = useState<string[]>([]); // Available barangays for filtering
  const [categories, setCategories] = useState<string[]>([]); // Available categories for filtering

  // Filter states
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [freshnessFilter, setFreshnessFilter] =
    useState<FreshnessFilter>("all");
  const [priceRangeFilter, setPriceRangeFilter] =
    useState<PriceRangeFilter>("all");

  // Modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
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

  // Fetch unique locations (barangays) from vendor addresses
  const fetchLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("barangay")
        .eq("address_type", "business")
        .not("barangay", "is", null);

      if (error) {
        console.error("Error fetching locations:", error);
        return;
      }

      // Get unique barangays and filter out null/empty values
      const uniqueLocations = Array.from(
        new Set(
          (data || [])
            .map((addr) => addr.barangay)
            .filter(
              (barangay): barangay is string =>
                barangay !== null && barangay.trim() !== "",
            ),
        ),
      ).sort();

      setLocations(uniqueLocations);
    } catch (error) {
      console.error("Error in fetchLocations:", error);
    }
  }, []);

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

  // Fetch vendor address
  const fetchVendorAddress = useCallback(async (vendorUserId: string) => {
    try {
      const { data, error } = await supabase
        .from("addresses")
        .select(
          "full_address, purok, barangay, municipality, address_type, is_default",
        )
        .eq("user_id", vendorUserId)
        .eq("address_type", "business")
        .maybeSingle();

      if (error) {
        console.error("Error fetching vendor address:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in fetchVendorAddress:", error);
      return null;
    }
  }, []);

  // Fetch vendor rating
  const fetchVendorRating = useCallback(async (vendorId: string) => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("vendor_rating")
        .eq("vendor_user_id", vendorId);

      if (reviewsError) {
        console.error("Error fetching vendor reviews:", reviewsError);
        return { rating: 0, totalReviews: 0 };
      }

      const reviews = (reviewsData as ReviewData[]) || [];

      if (reviews.length === 0) {
        return { rating: 0, totalReviews: 0 };
      }

      const sumRatings = reviews.reduce(
        (sum, review) => sum + review.vendor_rating,
        0,
      );
      const avgRating = Math.round((sumRatings / reviews.length) * 10) / 10;

      return {
        rating: avgRating,
        totalReviews: reviews.length,
      };
    } catch (error) {
      console.error("Error in fetchVendorRating:", error);
      return { rating: 0, totalReviews: 0 };
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

      if (!data || data.length === 0) {
        return [];
      }

      // Get unique vendor IDs
      const vendorIds = [...new Set(data.map((item) => item.vendor_user_id))];

      // Batch fetch all vendor addresses in one query
      const { data: addresses, error: addressesError } = await supabase
        .from("addresses")
        .select("user_id, full_address, purok, barangay, municipality")
        .in("user_id", vendorIds)
        .eq("address_type", "business");

      if (addressesError) {
        console.error("Error fetching vendor addresses:", addressesError);
      }

      // Create a map of vendor addresses for quick lookup
      const addressMap = new Map();
      addresses?.forEach((addr) => {
        addressMap.set(addr.user_id, addr);
      });

      // Process products
      const products = data.map((item: any) => {
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

        // Get address from map
        const address = addressMap.get(item.vendor_user_id);
        const freshness = computeFreshness(item.harvested_at);

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
            address: address?.full_address || null,
            barangay: address?.barangay || null,
            municipality: address?.municipality || null,
          },
          category: categoryName,
          type: "product" as const,
          freshness_status: freshness.status,
          discount_percent: item.discount_percent,
        };
      });

      // Filter out products that are not fresh
      return products.filter((product: Product) =>
        ALLOWED_FRESHNESS.includes(product.freshness_status),
      );
    } catch (error) {
      console.error("Error in searchProducts:", error);
      return [];
    }
  }, []);

  // Search vendors
  const searchVendors = useCallback(
    async (query: string) => {
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

        // If there's a search query, we need to filter vendors by shop name OR address
        if (query.trim()) {
          // First, get all approved vendors
          const { data: allVendors, error: vendorsError } = await dbQuery;

          if (vendorsError) {
            console.error("Error fetching vendors:", vendorsError);
            return [];
          }

          if (!allVendors || allVendors.length === 0) {
            return [];
          }

          // Fetch addresses for all vendors
          const vendorIds = allVendors.map((v) => v.user_id);
          const { data: addresses, error: addressesError } = await supabase
            .from("addresses")
            .select("user_id, full_address, purok, barangay, municipality")
            .in("user_id", vendorIds)
            .eq("address_type", "business");

          if (addressesError) {
            console.error("Error fetching addresses:", addressesError);
          }

          // Create a map of vendor addresses
          const addressMap = new Map();
          addresses?.forEach((addr) => {
            addressMap.set(addr.user_id, addr);
          });

          // Filter vendors that match the query in shop name or address
          const queryLower = query.toLowerCase().trim();
          const matchingVendors = allVendors.filter((vendor) => {
            // Check shop name
            if (vendor.shop_name?.toLowerCase().includes(queryLower)) {
              return true;
            }

            // Check address
            const address = addressMap.get(vendor.user_id);
            if (address) {
              const addressFields = [
                address.full_address,
                address.purok,
                address.barangay,
                address.municipality,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

              return addressFields.includes(queryLower);
            }

            return false;
          });

          // Now process only the matching vendors
          const vendorsWithDetails = await Promise.all(
            matchingVendors.map(async (vendor: any) => {
              const { count: productCount } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true })
                .eq("vendor_user_id", vendor.user_id)
                .eq("is_active", true)
                .gt("stock", 0);

              // Fetch vendor rating
              const { rating, totalReviews } = await fetchVendorRating(
                vendor.user_id,
              );

              // Fetch vendor address
              const address = await fetchVendorAddress(vendor.user_id);

              return {
                id: vendor.user_id,
                shop_name: vendor.shop_name || "Unnamed Shop",
                avatar_url: vendor.avatar_url,
                description: null,
                address: address?.full_address || null,
                barangay: address?.barangay || null,
                municipality: address?.municipality || null,
                product_count: productCount || 0,
                rating: rating,
                totalReviews: totalReviews,
                type: "vendor" as const,
              };
            }),
          );

          return vendorsWithDetails;
        } else {
          // No search query - return all vendors with their details
          const { data, error } = await dbQuery;

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

              // Fetch vendor rating
              const { rating, totalReviews } = await fetchVendorRating(
                vendor.user_id,
              );

              // Fetch vendor address
              const address = await fetchVendorAddress(vendor.user_id);

              return {
                id: vendor.user_id,
                shop_name: vendor.shop_name || "Unnamed Shop",
                avatar_url: vendor.avatar_url,
                description: null,
                address: address?.full_address || null,
                barangay: address?.barangay || null,
                municipality: address?.municipality || null,
                product_count: productCount || 0,
                rating: rating,
                totalReviews: totalReviews,
                type: "vendor" as const,
              };
            }),
          );

          return vendorsWithDetails;
        }
      } catch (error) {
        console.error("Error in searchVendors:", error);
        return [];
      }
    },
    [fetchVendorRating, fetchVendorAddress],
  );

  // Apply all filters
  const applyFilters = useCallback(
    (items: SearchResult[]) => {
      return items.filter((item) => {
        // Category filter (only for products)
        if (selectedCategory && isProduct(item)) {
          if (item.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
            return false;
          }
        }

        // Location filter (based on vendor's barangay)
        if (selectedLocation) {
          const itemBarangay = isProduct(item)
            ? item.vendor.barangay
            : item.barangay;

          if (itemBarangay?.toLowerCase() !== selectedLocation.toLowerCase()) {
            return false;
          }
        }

        // For products, apply price and freshness filters
        if (isProduct(item)) {
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
        }

        return true;
      });
    },
    [selectedLocation, selectedCategory, priceRangeFilter, freshnessFilter],
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

      // Sort vendors by rating (highest first) then alphabetically
      const sortedVendors = [...vendors] as Vendor[];
      sortedVendors.sort((a, b) => {
        if (a.rating !== b.rating) {
          return b.rating - a.rating; // Higher rating first
        }
        return a.shop_name.localeCompare(b.shop_name); // Then alphabetically
      });

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
    selectedLocation,
    selectedCategory,
    priceRangeFilter,
    freshnessFilter,
    sortBy,
    applyFilters,
    applySorting,
  ]);

  // Initial load
  useEffect(() => {
    fetchLocations();
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
    setSelectedLocation(null);
    setSelectedCategory(null);
    setFreshnessFilter("all");
    setPriceRangeFilter("all");
  }, []);

  // Get active filter count
  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (selectedLocation) count++;
    if (selectedCategory) count++;
    if (freshnessFilter !== "all") count++;
    if (priceRangeFilter !== "all") count++;
    return count;
  }, [selectedLocation, selectedCategory, freshnessFilter, priceRangeFilter]);

  // Get filter labels
  const getLocationLabel = () => selectedLocation || "Location";
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
    const originalPrice = item.price;
    const discountPercent = item.discount_percent || 0;
    const discountedPrice = calculateDiscountedPrice(
      originalPrice,
      discountPercent,
    );
    const hasDiscount = discountPercent > 0 && discountedPrice < originalPrice;

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
            position: "relative",
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

          {/* Discount Badge */}
          {hasDiscount && (
            <View
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                backgroundColor: "#FF6B6B",
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 4,
                zIndex: 1,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 8,
                  fontWeight: "bold",
                }}
              >
                -{discountPercent}%
              </Text>
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
                marginRight: 8,
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

          {/* Display vendor address */}
          {item.vendor.barangay && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 2,
              }}
            >
              <Ionicons name="location-outline" size={10} color="#999" />
              <Text
                style={{ fontSize: 11, color: "#999", marginLeft: 2 }}
                numberOfLines={1}
              >
                {formatAddress(item.vendor)}
              </Text>
            </View>
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
              {hasDiscount ? (
                <>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: COLORS.light.primary,
                      marginRight: 4,
                    }}
                  >
                    {formatPrice(discountedPrice)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#999",
                      textDecorationLine: "line-through",
                      marginRight: 2,
                    }}
                  >
                    {formatPrice(originalPrice)}
                  </Text>
                </>
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: COLORS.light.primary,
                  }}
                >
                  {formatPrice(originalPrice)}
                </Text>
              )}
              <Text style={{ fontSize: 12, color: "#666", marginLeft: 2 }}>
                /{item.unit}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                color: COLORS.light.oceanDeep,
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

          {/* Display vendor address */}
          {item.barangay && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <Ionicons name="location-outline" size={10} color="#999" />
              <Text
                style={{ fontSize: 11, color: "#999", marginLeft: 2 }}
                numberOfLines={1}
              >
                {formatAddress(item)}
              </Text>
            </View>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 11, color: "#666" }}>
                {item.product_count || 0} products
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="star" size={12} color="#FFB800" />
              <Text style={{ fontSize: 11, color: "#666", marginLeft: 2 }}>
                {item.rating > 0 ? item.rating.toFixed(1) : "0.0"}
              </Text>
              {item.totalReviews > 0 && (
                <Text style={{ fontSize: 10, color: "#999", marginLeft: 2 }}>
                  ({item.totalReviews})
                </Text>
              )}
            </View>
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
            : "Try searching for fresh seafood, shop names, or locations"}
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
            {/* Location Filter */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: selectedLocation
                  ? COLORS.light.primary
                  : "#f0f0f0",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                marginRight: 8,
              }}
              onPress={() => setShowLocationModal(true)}
            >
              <Ionicons
                name="location-outline"
                size={14}
                color={selectedLocation ? "#fff" : "#666"}
              />
              <Text
                style={{
                  color: selectedLocation ? "#fff" : "#666",
                  fontSize: 13,
                  marginLeft: 4,
                  fontWeight: "500",
                }}
              >
                {getLocationLabel()}
              </Text>
              {selectedLocation && (
                <TouchableOpacity
                  onPress={() => setSelectedLocation(null)}
                  style={{ marginLeft: 4 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Category Filter (ADDED BACK) */}
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

        {/* Location Filter Modal */}
        <Modal
          visible={showLocationModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLocationModal(false)}
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
                  Filter by Location
                </Text>
                <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* "All Locations" option */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f0f0f0",
                }}
                onPress={() => {
                  setSelectedLocation(null);
                  setShowLocationModal(false);
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: !selectedLocation ? COLORS.light.primary : "#333",
                    flex: 1,
                  }}
                >
                  All Locations
                </Text>
                {!selectedLocation && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={COLORS.light.primary}
                  />
                )}
              </TouchableOpacity>

              <FlatList
                data={locations}
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
                      setSelectedLocation(item);
                      setShowLocationModal(false);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color:
                          selectedLocation === item
                            ? COLORS.light.primary
                            : "#333",
                        flex: 1,
                      }}
                    >
                      {item}
                    </Text>
                    {selectedLocation === item && (
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

        {/* Category Filter Modal (ADDED BACK) */}
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

              {/* "All Categories" option */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f0f0f0",
                }}
                onPress={() => {
                  setSelectedCategory(null);
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: !selectedCategory ? COLORS.light.primary : "#333",
                    flex: 1,
                  }}
                >
                  All Categories
                </Text>
                {!selectedCategory && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={COLORS.light.primary}
                  />
                )}
              </TouchableOpacity>

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
