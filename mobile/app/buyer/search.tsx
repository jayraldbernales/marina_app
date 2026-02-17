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
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  SectionList,
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
}

interface Vendor {
  id: string;
  shop_name: string;
  avatar_url?: string | null;
  description?: string | null;
  location?: string | null;
  product_count?: number;
  rating?: number;
}

// Union type for section items
type SectionItem = Product | Vendor;

// Section type with discriminated union
interface ProductSection {
  type: "product";
  title: string;
  data: Product[];
}

interface VendorSection {
  type: "vendor";
  title: string;
  data: Vendor[];
}

type SearchSection = ProductSection | VendorSection;

// For useLocalSearchParams, we need to extend Record<string, string | string[]>
type SearchParams = Record<string, string | string[]> & {
  q?: string;
};

// Freshness result type from your utility
interface FreshnessResult {
  status: FreshnessStatus;
  label: string;
  color: string;
}

// -------------------- HELPER FUNCTIONS --------------------

const formatPrice = (price: number) => {
  return `₱${Number(price).toLocaleString()}`;
};

// Function to get freshness score for sorting
const getFreshnessScore = (harvestedAt: string): number => {
  const freshness = computeFreshness(harvestedAt);
  // Map status to numeric score for sorting
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
const isProduct = (item: SectionItem): item is Product => {
  return (item as Product).price !== undefined;
};

const isVendor = (item: SectionItem): item is Vendor => {
  return (
    (item as Vendor).shop_name !== undefined &&
    (item as Product).price === undefined
  );
};

// -------------------- COMPONENT --------------------

const BuyerSearch = () => {
  const params = useLocalSearchParams<SearchParams>();
  const initialQuery = typeof params.q === "string" ? params.q : "";

  // State
  const [searchQuery, setSearchQuery] = useState(initialQuery || "");
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<
    "relevance" | "price_asc" | "price_desc" | "freshness" | "vendor_rating"
  >("relevance");
  const [showSortModal, setShowSortModal] = useState(false);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [hasMoreVendors, setHasMoreVendors] = useState(true);
  const [productPage, setProductPage] = useState(1);
  const [vendorPage, setVendorPage] = useState(1);
  const [totalProductCount, setTotalProductCount] = useState(0);
  const [totalVendorCount, setTotalVendorCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "products" | "vendors">(
    "all",
  );

  const debouncedSearch = useDebounce(searchQuery, 500);
  const ITEMS_PER_PAGE = 20;

  // Search products
  const searchProducts = useCallback(
    async (query: string, pageNum: number, reset: boolean = false) => {
      try {
        // Build the search query
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
            { count: "exact" },
          )
          .eq("is_active", true)
          .gt("stock", 0);

        // Add search condition if query exists
        if (query.trim()) {
          dbQuery = dbQuery.ilike("product_name", `%${query}%`);
        }

        // Add pagination
        const from = (pageNum - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count } = await dbQuery
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) {
          console.error("Error searching products:", error);
          return;
        }

        // Map products with proper type handling
        const mappedProducts: Product[] = (data || []).map((item: any) => {
          // Handle categories
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

          // Handle vendor_profiles
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
          };
        });

        setTotalProductCount(count || 0);

        if (reset) {
          setProducts(mappedProducts);
          setHasMoreProducts(mappedProducts.length === ITEMS_PER_PAGE);
        } else {
          setProducts((prev) => [...prev, ...mappedProducts]);
          setHasMoreProducts(mappedProducts.length === ITEMS_PER_PAGE);
        }
      } catch (error) {
        console.error("Error in searchProducts:", error);
      }
    },
    [],
  );

  // Search vendors - FIXED to use vendor_profiles table
  const searchVendors = useCallback(
    async (query: string, pageNum: number, reset: boolean = false) => {
      try {
        // Build the vendor search query - using vendor_profiles table
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
            { count: "exact" },
          )
          .eq("approval_status", "approved"); // Only show approved vendors

        // Add search condition if query exists
        if (query.trim()) {
          dbQuery = dbQuery.ilike("shop_name", `%${query}%`);
        }

        // Add pagination
        const from = (pageNum - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error, count } = await dbQuery
          .order("shop_name", { ascending: true })
          .range(from, to);

        if (error) {
          console.error("Error searching vendors:", error);
          return;
        }

        // Get additional profile info and product counts for each vendor
        const vendorsWithDetails: Vendor[] = await Promise.all(
          (data || []).map(async (vendor: any) => {
            // Get profile info for location and description (if available)
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("user_id", vendor.user_id)
              .single();

            // Count active products for this vendor
            const { count: productCount, error: countError } = await supabase
              .from("products")
              .select("*", { count: "exact", head: true })
              .eq("vendor_user_id", vendor.user_id)
              .eq("is_active", true)
              .gt("stock", 0);

            if (countError) {
              console.error("Error counting vendor products:", countError);
            }

            return {
              id: vendor.user_id,
              shop_name: vendor.shop_name || "Unnamed Shop",
              avatar_url: vendor.avatar_url,
              description: profileData?.full_name || null, // Using full_name as description fallback
              location: null, // You might want to add location to vendor_profiles or get from addresses
              product_count: productCount || 0,
              rating: 4.5, // You can implement actual rating logic later
            };
          }),
        );

        setTotalVendorCount(count || 0);

        if (reset) {
          setVendors(vendorsWithDetails);
          setHasMoreVendors(vendorsWithDetails.length === ITEMS_PER_PAGE);
        } else {
          setVendors((prev) => [...prev, ...vendorsWithDetails]);
          setHasMoreVendors(vendorsWithDetails.length === ITEMS_PER_PAGE);
        }
      } catch (error) {
        console.error("Error in searchVendors:", error);
      }
    },
    [],
  );
  // Apply sorting to products
  const sortProducts = useCallback(
    (productsToSort: Product[], sortType: typeof sortBy) => {
      const sorted = [...productsToSort];

      switch (sortType) {
        case "price_asc":
          return sorted.sort((a, b) => a.price - b.price);
        case "price_desc":
          return sorted.sort((a, b) => b.price - a.price);
        case "freshness":
          return sorted.sort((a, b) => {
            const scoreA = getFreshnessScore(a.harvested_at);
            const scoreB = getFreshnessScore(b.harvested_at);
            return scoreB - scoreA;
          });
        case "relevance":
        default:
          // Keep original order (by creation date)
          return sorted;
      }
    },
    [],
  );

  // Apply sorting to vendors
  const sortVendors = useCallback(
    (vendorsToSort: Vendor[], sortType: typeof sortBy) => {
      const sorted = [...vendorsToSort];

      switch (sortType) {
        case "vendor_rating":
          return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case "relevance":
        default:
          // Keep alphabetical order
          return sorted.sort((a, b) => a.shop_name.localeCompare(b.shop_name));
      }
    },
    [],
  );

  // Update filtered products and vendors when data or sort changes
  useEffect(() => {
    if (products.length > 0) {
      const sorted = sortProducts(products, sortBy);
      setFilteredProducts(sorted);
    } else {
      setFilteredProducts([]);
    }

    if (vendors.length > 0) {
      const sorted = sortVendors(vendors, sortBy);
      setFilteredVendors(sorted);
    } else {
      setFilteredVendors([]);
    }
  }, [products, vendors, sortBy, sortProducts, sortVendors]);

  // Handle search input changes
  useEffect(() => {
    setProductPage(1);
    setVendorPage(1);
    setProducts([]);
    setVendors([]);

    if (debouncedSearch !== undefined) {
      // Only show loading on initial search
      if (productPage === 1 && vendorPage === 1) {
        setLoading(true);
      }

      // Search both products and vendors
      Promise.all([
        searchProducts(debouncedSearch, 1, true),
        searchVendors(debouncedSearch, 1, true),
      ]).finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
    }
  }, [debouncedSearch, searchProducts, searchVendors]);

  // Handle load more products
  const handleLoadMoreProducts = useCallback(() => {
    if (!loading && hasMoreProducts && activeTab !== "vendors") {
      const nextPage = productPage + 1;
      setProductPage(nextPage);
      searchProducts(debouncedSearch, nextPage, false);
    }
  }, [
    loading,
    hasMoreProducts,
    productPage,
    debouncedSearch,
    searchProducts,
    activeTab,
  ]);

  // Handle load more vendors
  const handleLoadMoreVendors = useCallback(() => {
    if (!loading && hasMoreVendors && activeTab !== "products") {
      const nextPage = vendorPage + 1;
      setVendorPage(nextPage);
      searchVendors(debouncedSearch, nextPage, false);
    }
  }, [
    loading,
    hasMoreVendors,
    vendorPage,
    debouncedSearch,
    searchVendors,
    activeTab,
  ]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setProductPage(1);
    setVendorPage(1);

    Promise.all([
      searchProducts(debouncedSearch, 1, true),
      searchVendors(debouncedSearch, 1, true),
    ]).finally(() => {
      setRefreshing(false);
    });
  }, [debouncedSearch, searchProducts, searchVendors]);

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

  const handleSortPress = (sortType: typeof sortBy) => {
    setSortBy(sortType);
    setShowSortModal(false);
  };

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Get sort label
  const getSortLabel = () => {
    switch (sortBy) {
      case "price_asc":
        return "Price: Low to High";
      case "price_desc":
        return "Price: High to Low";
      case "freshness":
        return "Freshness";
      case "vendor_rating":
        return "Top Rated Vendors";
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
        {/* Product Image */}
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

        {/* Product Details */}
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
        {/* Vendor Avatar */}
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

        {/* Vendor Details */}
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

          {item.location && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <Ionicons name="location-outline" size={12} color="#999" />
              <Text
                style={{ fontSize: 11, color: "#999", marginLeft: 2 }}
                numberOfLines={1}
              >
                {item.location}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Ionicons
                name="fish-outline"
                size={12}
                color={COLORS.light.primary}
              />
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

          {item.description && (
            <Text
              style={{ fontSize: 11, color: "#999", marginTop: 4 }}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          )}
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

  // Render section item with type guard
  const renderSectionItem = ({
    item,
    section,
  }: {
    item: SectionItem;
    section: SearchSection;
  }) => {
    if (section.type === "product" && isProduct(item)) {
      return renderProductItem({ item });
    } else if (section.type === "vendor" && isVendor(item)) {
      return renderVendorItem({ item });
    }
    return null;
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading && productPage === 1 && vendorPage === 1) return null;

    const hasProducts = filteredProducts.length > 0;
    const hasVendors = filteredVendors.length > 0;

    if (hasProducts || hasVendors) return null;

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
      </View>
    );
  };

  // Render footer (loading indicator for pagination)
  const renderFooter = () => {
    if (!loading || (productPage === 1 && vendorPage === 1)) return null;

    return (
      <View style={{ paddingVertical: 20, alignItems: "center" }}>
        <ActivityIndicator size="small" color={COLORS.light.primary} />
      </View>
    );
  };

  // Get total results count
  const getTotalResults = () => {
    if (activeTab === "products") return filteredProducts.length;
    if (activeTab === "vendors") return filteredVendors.length;
    return filteredProducts.length + filteredVendors.length;
  };

  // Get total count for display
  const getTotalCount = () => {
    if (activeTab === "products") return totalProductCount;
    if (activeTab === "vendors") return totalVendorCount;
    return totalProductCount + totalVendorCount;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.primary }}>
      <View style={buyerDashboardStyles.container}>
        {/* Header */}
        <View style={buyerDashboardStyles.header}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={handleBack}
              style={{ marginRight: 12 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Search Bar */}
            <View
              style={[buyerDashboardStyles.searchBarContainer, { flex: 1 }]}
            >
              <Feather
                name="search"
                size={20}
                color="#005f73"
                style={buyerDashboardStyles.searchIcon}
              />
              <TextInput
                style={buyerDashboardStyles.searchInput}
                placeholder="Search products or vendors..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#005f73"
                autoFocus={true}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  style={{ padding: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#005f73" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Results Info and Sort */}
        {!loading &&
          (filteredProducts.length > 0 || filteredVendors.length > 0) && (
            <>
              {/* Tabs */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#fff",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f0f0f0",
                }}
              >
                <TouchableOpacity
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    marginRight: 8,
                    borderRadius: 20,
                    backgroundColor:
                      activeTab === "all" ? COLORS.light.primary : "#f0f0f0",
                  }}
                  onPress={() => setActiveTab("all")}
                >
                  <Text
                    style={{
                      color: activeTab === "all" ? "#fff" : "#666",
                      fontWeight: activeTab === "all" ? "600" : "400",
                    }}
                  >
                    All ({totalProductCount + totalVendorCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    marginRight: 8,
                    borderRadius: 20,
                    backgroundColor:
                      activeTab === "products"
                        ? COLORS.light.primary
                        : "#f0f0f0",
                  }}
                  onPress={() => setActiveTab("products")}
                >
                  <Text
                    style={{
                      color: activeTab === "products" ? "#fff" : "#666",
                      fontWeight: activeTab === "products" ? "600" : "400",
                    }}
                  >
                    Products ({totalProductCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    backgroundColor:
                      activeTab === "vendors"
                        ? COLORS.light.primary
                        : "#f0f0f0",
                  }}
                  onPress={() => setActiveTab("vendors")}
                >
                  <Text
                    style={{
                      color: activeTab === "vendors" ? "#fff" : "#666",
                      fontWeight: activeTab === "vendors" ? "600" : "400",
                    }}
                  >
                    Vendors ({totalVendorCount})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sort Bar */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: "#f8f9fa",
                }}
              >
                <Text style={{ fontSize: 13, color: "#666" }}>
                  {getTotalResults()}{" "}
                  {getTotalResults() === 1 ? "result" : "results"} shown
                </Text>

                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center" }}
                  onPress={() => setShowSortModal(true)}
                >
                  <Feather
                    name="sliders"
                    size={16}
                    color={COLORS.light.primary}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      color: COLORS.light.primary,
                      marginLeft: 4,
                      fontWeight: "500",
                    }}
                  >
                    Sort: {getSortLabel()}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={COLORS.light.primary}
                    style={{ marginLeft: 2 }}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

        {/* Results List */}
        {activeTab === "products" ? (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => `product-${item.id}`}
            renderItem={renderProductItem}
            contentContainerStyle={{
              padding: 16,
              flexGrow: 1,
            }}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMoreProducts}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.light.primary]}
              />
            }
          />
        ) : activeTab === "vendors" ? (
          <FlatList
            data={filteredVendors}
            keyExtractor={(item) => `vendor-${item.id}`}
            renderItem={renderVendorItem}
            contentContainerStyle={{
              padding: 16,
              flexGrow: 1,
            }}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMoreVendors}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.light.primary]}
              />
            }
          />
        ) : (
          // All results - show sections
          // Replace the SectionList section in your return statement with this:

          <SectionList
            sections={[
              {
                type: "product" as const,
                title: `Products (${filteredProducts.length})`,
                data: filteredProducts.slice(0, 5) as (Product | Vendor)[], // Cast to union type
              },
              {
                type: "vendor" as const,
                title: `Vendors (${filteredVendors.length})`,
                data: filteredVendors.slice(0, 5) as (Product | Vendor)[], // Cast to union type
              },
            ].filter((section) => section.data.length > 0)}
            keyExtractor={(item, index) => {
              if (isProduct(item)) {
                return `product-${item.id}-${index}`;
              }
              return `vendor-${(item as Vendor).id}-${index}`;
            }}
            renderItem={({ item, section }) => {
              if (section.type === "product" && isProduct(item)) {
                return renderProductItem({ item });
              } else if (section.type === "vendor" && isVendor(item)) {
                return renderVendorItem({ item });
              }
              return null;
            }}
            renderSectionHeader={({ section }) => (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: "#fff",
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#333" }}
                >
                  {section.title}
                </Text>
                {section.data.length === 5 && (
                  <TouchableOpacity
                    onPress={() =>
                      setActiveTab(
                        section.type === "product" ? "products" : "vendors",
                      )
                    }
                  >
                    <Text style={{ fontSize: 12, color: COLORS.light.primary }}>
                      View all{" "}
                      {section.type === "product"
                        ? totalProductCount
                        : totalVendorCount}{" "}
                      →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            contentContainerStyle={{
              padding: 16,
              flexGrow: 1,
            }}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMoreProducts}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.light.primary]}
              />
            }
          />
        )}
      </View>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
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
              { value: "vendor_rating", label: "Top Rated Vendors" },
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
                onPress={() => handleSortPress(option.value as typeof sortBy)}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color:
                      sortBy === option.value ? COLORS.light.primary : "#333",
                    fontWeight: sortBy === option.value ? "600" : "400",
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
    </SafeAreaView>
  );
};

export default BuyerSearch;
