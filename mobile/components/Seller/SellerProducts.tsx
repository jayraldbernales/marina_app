import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../constants";
import { sellerProductsStyles } from "./styles/sellerProductsStyles";
import { supabase } from "../../lib/supabase";
import { computeFreshness, FreshnessStatus } from "../../utils/freshness";

// Types aligned with DB schema
type StockFilter = "all" | "inStock" | "lowStock" | "outOfStock";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  thumbnail?: string | null;
  harvested_at: string;
  category?: string | null;
}

const SellerProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<StockFilter>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Helpers
  const formatPrice = useCallback((price: number) => {
    return `₱${Number(price).toLocaleString()}`;
  }, []);

  const getStockStatus = useCallback((stock: number) => {
    if (stock === 0) return { text: "Out of Stock", color: "#dc2626" };
    if (stock <= 5) return { text: "Low Stock", color: "#ea580c" };
    return { text: "In Stock", color: COLORS.light.oceanMedium };
  }, []);

  // Fetch products for current vendor
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      // get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        Alert.alert("Error", "Unable to determine current user.");
        setProducts([]);
        return;
      }

      if (!user?.id) {
        setProducts([]);
        return;
      }

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
          is_active,
          category_id,
          categories:category_id(category_name)
        `,
        )
        .eq("vendor_user_id", user.id)
        .eq("is_active", true)
        .order("product_name", { ascending: true });

      if (error) {
        Alert.alert("Error", "Failed to load products. Please try again.");
        setProducts([]);
        return;
      }

      const mapped: Product[] = (data || []).map((p: any) => ({
        id: p.product_id,
        name: p.product_name,
        price: Number(p.price ?? 0),
        stock: Number(p.stock ?? 0),
        thumbnail: p.images?.[0] ?? null,
        harvested_at: p.harvested_at,
        category: p.categories?.category_name ?? null,
      }));

      setProducts(mapped);
    } catch (err) {
      Alert.alert(
        "Error",
        "An unexpected error occurred while loading products.",
      );
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const searchParams = useLocalSearchParams();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Re-fetch when returning from add/edit actions (e.g. ?refresh=1)
  useEffect(() => {
    if (searchParams?.refresh === "1") {
      fetchProducts();
      // clean URL so the param doesn't keep triggering on mount
      router.replace("/(seller-tabs)/products");
    }
  }, [searchParams?.refresh, fetchProducts]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  // Filtered products according to stock state
  const filteredProducts = useMemo(() => {
    if (filter === "all") return products;
    return products.filter((product) => {
      const status = getStockStatus(product.stock).text;
      if (filter === "inStock") return status === "In Stock";
      if (filter === "lowStock") return status === "Low Stock";
      if (filter === "outOfStock") return status === "Out of Stock";
      return true;
    });
  }, [filter, products, getStockStatus]);

  // Navigation handlers
  const handleOpenProduct = useCallback((productId: string) => {
    router.push(`/seller/products-view?product_id=${productId}`);
  }, []);

  const handleEditProduct = useCallback((productId: string) => {
    router.push(`/seller/products-edit?product_id=${productId}`);
  }, []);

  const handleAddProduct = useCallback(() => {
    router.push("/seller/products-add");
  }, []);

  const handleGoProfile = useCallback(() => {
    router.push("/(tabs)/profile");
  }, []);

  // Loading / Empty UI
  if (loading) {
    return (
      <SafeAreaView style={sellerProductsStyles.container}>
        <View style={sellerProductsStyles.mainContent}>
          <View style={sellerProductsStyles.headerBar}>
            <TouchableOpacity
              onPress={handleGoProfile}
              style={sellerProductsStyles.headerBackBtn}
              accessibilityLabel="Back to profile"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>
            <Text style={sellerProductsStyles.headerTitle}>My Products</Text>
            <TouchableOpacity
              style={sellerProductsStyles.addProductButton}
              onPress={handleAddProduct}
            >
              <Text style={sellerProductsStyles.addProductButtonText}>
                Add Product
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ color: COLORS.light.oceanMedium }}>
              Loading products...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sellerProductsStyles.container}>
      <View style={sellerProductsStyles.mainContent}>
        {/* Header */}
        <View style={sellerProductsStyles.headerBar}>
          <TouchableOpacity
            onPress={handleGoProfile}
            style={sellerProductsStyles.headerBackBtn}
            accessibilityLabel="Back to profile"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={sellerProductsStyles.headerTitle}>My Products</Text>
          <TouchableOpacity
            style={sellerProductsStyles.addProductButton}
            onPress={handleAddProduct}
          >
            <Text style={sellerProductsStyles.addProductButtonText}>
              Add Product
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={sellerProductsStyles.tabsContainer}>
          {[
            { key: "all" as const, label: "All" },
            { key: "inStock" as const, label: "In Stock" },
            { key: "lowStock" as const, label: "Low Stock" },
            { key: "outOfStock" as const, label: "Out of Stock" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                sellerProductsStyles.tab,
                filter === tab.key && sellerProductsStyles.activeTab,
              ]}
              onPress={() => setFilter(tab.key)}
              accessibilityLabel={`Filter by ${tab.label}`}
            >
              <Text
                style={[
                  sellerProductsStyles.tabText,
                  filter === tab.key && sellerProductsStyles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Products List */}
        <ScrollView
          style={sellerProductsStyles.productsContainer}
          contentContainerStyle={
            filteredProducts.length === 0 ? { flexGrow: 1 } : undefined
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredProducts.length > 0 ? (
            <View style={sellerProductsStyles.productsGrid}>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                const freshness = computeFreshness(product.harvested_at);
                const isFairOrWorse =
                  freshness.status === FreshnessStatus.FAIR ||
                  freshness.status === FreshnessStatus.NOT_FRESH;

                return (
                  <TouchableOpacity
                    key={product.id}
                    style={sellerProductsStyles.productCard}
                    onPress={() => handleOpenProduct(product.id)}
                    activeOpacity={0.9}
                  >
                    {/* Product Image with Freshness Status Badge */}
                    <View style={sellerProductsStyles.imageContainer}>
                      {product.thumbnail ? (
                        <Image
                          source={{ uri: product.thumbnail }}
                          style={sellerProductsStyles.productImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            sellerProductsStyles.productImage,
                            {
                              justifyContent: "center",
                              alignItems: "center",
                              backgroundColor: "#f3f4f6",
                            },
                          ]}
                        >
                          <Ionicons name="image" size={28} color="#9ca3af" />
                        </View>
                      )}

                      {/* Freshness Status Badge */}
                      <View style={sellerProductsStyles.stockStatusBadge}>
                        {isFairOrWorse ? (
                          <Ionicons
                            name="warning"
                            size={12}
                            color={freshness.color}
                          />
                        ) : (
                          <View
                            style={[
                              sellerProductsStyles.statusDot,
                              { backgroundColor: freshness.color },
                            ]}
                          />
                        )}
                        <Text style={sellerProductsStyles.statusText}>
                          {freshness.label}
                        </Text>
                      </View>
                    </View>

                    {/* Product Info */}
                    <View style={sellerProductsStyles.productInfo}>
                      <View style={sellerProductsStyles.namePriceRow}>
                        <Text
                          style={sellerProductsStyles.productName}
                          numberOfLines={1}
                        >
                          {product.name}
                        </Text>
                        <Text style={sellerProductsStyles.productPrice}>
                          {formatPrice(product.price)}
                        </Text>
                      </View>

                      {/* Category (if any) */}
                      <View style={sellerProductsStyles.metaRow}>
                        {product.category ? (
                          <Text style={sellerProductsStyles.productCategory}>
                            {product.category}
                          </Text>
                        ) : (
                          <Text style={sellerProductsStyles.productCategory}>
                            No category
                          </Text>
                        )}
                      </View>

                      {/* Stock Info */}
                      <View style={sellerProductsStyles.statsRow}>
                        <View style={sellerProductsStyles.stockContainer}>
                          <Text
                            style={[
                              sellerProductsStyles.productStock,
                              { color: stockStatus.color },
                            ]}
                          >
                            {product.stock} stocks
                          </Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View style={sellerProductsStyles.actionButtons}>
                        <TouchableOpacity
                          style={[
                            sellerProductsStyles.statusButton,
                            sellerProductsStyles.statusButtonInactive,
                          ]}
                          onPress={() => handleOpenProduct(product.id)}
                        >
                          <Text
                            style={[
                              sellerProductsStyles.statusButtonText,
                              sellerProductsStyles.statusButtonTextInactive,
                            ]}
                          >
                            Details
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={sellerProductsStyles.viewButton}
                          onPress={() => handleEditProduct(product.id)}
                        >
                          <Text style={sellerProductsStyles.viewButtonText}>
                            Edit
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={sellerProductsStyles.emptyState}>
              <Ionicons
                name="archive-outline"
                size={64}
                color={COLORS.light.oceanMedium}
              />
              <Text style={sellerProductsStyles.emptyTitle}>
                No products {filter !== "all" && `(${filter})`}
              </Text>
              <Text style={sellerProductsStyles.emptyDescription}>
                {filter === "all"
                  ? "Add your first product to get started."
                  : `No ${filter} products found. Try a different filter.`}
              </Text>
              {filter === "all" && (
                <TouchableOpacity
                  style={sellerProductsStyles.addProductButton}
                  onPress={handleAddProduct}
                >
                  <Text style={sellerProductsStyles.addProductButtonText}>
                    Add Product
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SellerProducts;
