import React, { useEffect, useState, useCallback } from "react";
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
import { router } from "expo-router";
import { COLORS } from "../constants";
import { buyerDashboardStyles } from "../components/styles/buyerDashboardStyles";
import BuyerDashboardSkeleton from "../components/skeleton/BuyerDashboardSkeleton";
import { supabase } from "../lib/supabase";
import { computeFreshness, FreshnessStatus } from "../utils/freshness";

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
    avatar_url?: string;
  };
  category?: string;
  description?: string;
  rating: number;
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
  { label: "Fresh (Iced)", value: FreshnessStatus.FRESH, color: "#06b6d4" },
  { label: "Still Fresh", value: FreshnessStatus.GOOD, color: "#f59e0b" },
  { label: "Use Soon", value: FreshnessStatus.FAIR, color: "#d97706" },
];

// -------------------- COMPONENT --------------------

const BuyerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullName, setFullName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Store ALL products
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]); // Products after filtering
  const [categories, setCategories] = useState<string[]>([]);
  const [freshnessFilter, setFreshnessFilter] =
    useState<FreshnessFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Add category filter state
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setFullName("");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", session.user.id)
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

  // Fetch products
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
          description,
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
        .gt("stock", 0)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching products:", error);
        Alert.alert("Error", "Failed to load products");
        return [];
      }

      const mappedProducts: Product[] = (data || []).map((p: any) => {
        let vendorData = p.vendor_profiles;
        let shopName = "Seafood Vendor";
        let avatarUrl = null;

        if (vendorData) {
          if (Array.isArray(vendorData) && vendorData.length > 0) {
            shopName = vendorData[0]?.shop_name || "Seafood Vendor";
            avatarUrl = vendorData[0]?.avatar_url;
          } else if (typeof vendorData === "object" && vendorData.shop_name) {
            shopName = vendorData.shop_name;
            avatarUrl = vendorData.avatar_url;
          }
        }

        return {
          id: p.product_id,
          name: p.product_name,
          price: Number(p.price ?? 0),
          stock: Number(p.stock ?? 0),
          thumbnail: p.images?.[0] ?? null,
          harvested_at: p.harvested_at,
          unit: p.unit,
          description: p.description,
          vendor: {
            id: p.vendor_user_id,
            shop_name: shopName,
            avatar_url: avatarUrl,
          },
          category: p.categories?.category_name || null,
          rating: 4.5 + Math.random() * 0.5,
        };
      });

      return mappedProducts;
    } catch (error) {
      console.error("Error in fetchProducts:", error);
      return [];
    }
  }, []);

  // Filter products based on freshness AND category
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

        // Filter by category if selected
        if (category && product.category !== category) {
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

      const categoryNames = (data || []).map((cat: any) => cat.category_name);
      return categoryNames;
    } catch (error) {
      console.error("Error in fetchCategories:", error);
      return [];
    }
  }, []);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      await Promise.all([
        fetchUserProfile(),
        fetchProducts().then((productsData) => {
          // Store all products
          setAllProducts(productsData);
          // Initial filter will be applied by useEffect
        }),
        fetchCategories().then(setCategories),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchUserProfile, fetchProducts, fetchCategories]);

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

  // Pull to refresh
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
        // If same category is clicked again, deselect it
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

            <TouchableOpacity
              style={buyerDashboardStyles.chatButton}
              onPress={() => router.push("/buyer/chat")}
              accessibilityLabel="Open chat"
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={25}
                color="#fff"
              />
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
              placeholderTextColor="#005f73"
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
                    borderRadius: 16,
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
                    borderRadius: 16,
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
                borderRadius: 20,
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
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 2,
                        }}
                      >
                        <Text style={buyerDashboardStyles.productName}>
                          {product.name}
                        </Text>

                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Text style={buyerDashboardStyles.productPrice}>
                            {formatPrice(product.price)}
                          </Text>
                          <Text style={buyerDashboardStyles.productUnit}>
                            /{product.unit}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 2,
                        }}
                      >
                        <Text style={buyerDashboardStyles.productVendor}>
                          {product.vendor.shop_name}
                        </Text>
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <MaterialCommunityIcons
                            name="star"
                            size={11}
                            color="#FFD700"
                          />
                          <Text style={buyerDashboardStyles.productRating}>
                            {product.rating.toFixed(1)}
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
              keyExtractor={(item) => item.value}
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
