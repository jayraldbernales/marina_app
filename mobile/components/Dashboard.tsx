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
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { COLORS } from "../constants";
import { buyerDashboardStyles } from "../components/styles/buyerDashboardStyles";
import BuyerDashboardSkeleton from "../components/skeleton/BuyerDashboardSkeleton";
import { supabase } from "../lib/supabase";
import { computeFreshness } from "../utils/freshness";

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

// -------------------- COMPONENT --------------------

const BuyerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullName, setFullName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]); // Changed to string array

  const navigation = useNavigation();

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
        .limit(20);

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

  // Fetch categories - SIMPLIFIED: Just category names, no icons
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

      // Just extract category names as strings
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
          setProducts(productsData);
          setFeaturedProducts(productsData.slice(0, 4));
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

  // Handlers - Add proper navigation
  const handleProductPress = useCallback((product: Product) => {
    router.push(`./buyer/product-details?product_id=${product.id}`);
  }, []);

  const handleCategoryPress = useCallback((category: string) => {}, []);

  const handleSeeAllProducts = useCallback(() => {}, []);

  const handleSearchSubmit = useCallback(() => {}, [searchQuery]);

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

          {/* Categories - NO ICONS */}
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
                style={buyerDashboardStyles.categoryCard}
                onPress={() => handleCategoryPress(category)}
                accessibilityLabel={`Browse ${category}`}
              >
                {/* Removed icon wrapper completely */}
                <Text style={buyerDashboardStyles.categoryName}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Featured Products */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={buyerDashboardStyles.sectionTitle}>Fresh Catch</Text>
            <TouchableOpacity onPress={handleSeeAllProducts}>
              <Text style={{ color: COLORS.light.primary, fontSize: 14 }}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          {featuredProducts.length === 0 ? (
            <View style={{ alignItems: "center", padding: 20 }}>
              <Ionicons name="fish-outline" size={48} color="#ccc" />
              <Text style={{ color: "#666", marginTop: 10 }}>
                No fresh products available at the moment
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              {featuredProducts.map((product) => {
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
    </SafeAreaView>
  );
};

export default BuyerDashboard;
