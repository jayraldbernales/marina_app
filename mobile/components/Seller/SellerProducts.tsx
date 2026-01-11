import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../../constants";
import { sellerProductsStyles } from "./styles/sellerProductsStyles";
// Types
type StockFilter = "all" | "inStock" | "lowStock" | "outOfStock";
type FreshnessStatus = "today" | "yesterday" | "this week" | "not fresh";
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: any;
  category?: string;
  rating?: number;
  sales?: number;
  freshness?: FreshnessStatus;
}
// Mock data for products
const mockProducts: Product[] = [
  {
    id: "PROD-001",
    name: "Bangus",
    price: 480,
    stock: 25,
    image: require("@/assets/img/bangus.jpg"),
    category: "Fish",
    rating: 4.5,
    sales: 42,
    freshness: "today",
  },
  {
    id: "PROD-002",
    name: "Mayamaya",
    price: 650,
    stock: 12,
    image: require("@/assets/img/mayamaya.jpg"),
    category: "Fish",
    rating: 4.8,
    sales: 28,
    freshness: "yesterday",
  },
  {
    id: "PROD-003",
    name: "Crab",
    price: 720,
    stock: 4,
    image: require("@/assets/img/crab.jpg"),
    category: "Shellfish",
    rating: 4.3,
    sales: 15,
    freshness: "this week",
  },
  {
    id: "PROD-004",
    name: "Shrimp",
    price: 720,
    stock: 0,
    image: require("@/assets/img/shrimp.jpg"),
    category: "Shellfish",
    rating: 4.6,
    sales: 0,
    freshness: "not fresh",
  },
];
const SellerProducts = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [filter, setFilter] = useState<StockFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const handleOpenProduct = useCallback((productId: string) => {
    router.push(`/(seller-tabs)/products?view=${productId}`);
  }, []);
  const handleEditProduct = useCallback((productId: string) => {
    router.push(`/(seller-tabs)/products?edit=${productId}`);
  }, []);
  const handleAddProduct = useCallback(() => {
    router.push("/(seller-tabs)/products?mode=add");
  }, []);
  const handleBack = useCallback(() => {
    router.push("/(tabs)");
  }, []);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);
  const formatPrice = (price: number) => {
    return `₱${price.toLocaleString()}`;
  };
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: "Out of Stock", color: "#dc2626" };
    if (stock <= 5) return { text: "Low Stock", color: "#ea580c" };
    return { text: "In Stock", color: COLORS.light.oceanMedium };
  };
  const getFreshnessStatus = (freshness?: FreshnessStatus) => {
    switch (freshness) {
      case "today":
        return { text: "Caught Today", color: "#10b981" };
      case "yesterday":
        return { text: "Caught Yesterday", color: "#f59e0b" };
      case "this week":
        return { text: "Caught This Week", color: "#d97706" };
      case "not fresh":
        return { text: "Not Fresh", color: "#6b7280" };
      default:
        return { text: "Unknown", color: "#dc2626" };
    }
  };
  const filteredProducts =
    filter === "all"
      ? products
      : products.filter((product) => {
          const stockStatus = getStockStatus(product.stock);
          if (filter === "inStock") return stockStatus.text === "In Stock";
          if (filter === "lowStock") return stockStatus.text === "Low Stock";
          if (filter === "outOfStock")
            return stockStatus.text === "Out of Stock";
          return false;
        });
  return (
    <SafeAreaView style={sellerProductsStyles.container}>
      <View style={sellerProductsStyles.mainContent}>
        {/* Header */}
        <View style={sellerProductsStyles.headerBar}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
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
            filteredProducts.length === 0 && { flexGrow: 1 }
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredProducts.length > 0 ? (
            <View style={sellerProductsStyles.productsGrid}>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                const freshnessStatus = getFreshnessStatus(product.freshness);
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={sellerProductsStyles.productCard}
                    onPress={() => handleOpenProduct(product.id)}
                    activeOpacity={0.9}
                  >
                    {/* Product Image with Freshness Status Badge */}
                    <View style={sellerProductsStyles.imageContainer}>
                      <Image
                        source={product.image}
                        style={sellerProductsStyles.productImage}
                        resizeMode="cover"
                      />
                      {/* Freshness Status Badge */}
                      <View style={sellerProductsStyles.stockStatusBadge}>
                        {freshnessStatus.text.includes("Yesterday") ||
                        freshnessStatus.text.includes("This Week") ? (
                          <Ionicons
                            name="warning"
                            size={12}
                            color={freshnessStatus.color}
                          />
                        ) : (
                          <View
                            style={[
                              sellerProductsStyles.statusDot,
                              { backgroundColor: freshnessStatus.color },
                            ]}
                          />
                        )}
                        <Text style={sellerProductsStyles.statusText}>
                          {freshnessStatus.text}
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
                      {/* Category and Rating */}
                      <View style={sellerProductsStyles.metaRow}>
                        {product.category && (
                          <Text style={sellerProductsStyles.productCategory}>
                            {product.category}
                          </Text>
                        )}
                        {product.rating && (
                          <View style={sellerProductsStyles.ratingContainer}>
                            <Ionicons name="star" size={12} color="#f59e0b" />
                            <Text style={sellerProductsStyles.ratingText}>
                              {product.rating}
                            </Text>
                          </View>
                        )}
                      </View>
                      {/* Stock and Sales Info */}
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
                        {product.sales !== undefined && product.sales > 0 && (
                          <Text style={sellerProductsStyles.salesText}>
                            {product.sales} sold
                          </Text>
                        )}
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
