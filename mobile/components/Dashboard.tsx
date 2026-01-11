import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { COLORS } from "../constants";
import { buyerDashboardStyles } from "../components/styles/buyerDashboardStyles";
import BuyerDashboardSkeleton from "../components/skeleton/BuyerDashboardSkeleton";

const categories: {
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { name: "Fish", icon: "fish" },
  { name: "Shellfish", icon: "fish" },
  { name: "Squid", icon: "jellyfish" },
  { name: "Crab", icon: "fish" },
  { name: "Shrimp", icon: "fish" },
  { name: "Lobster", icon: "leaf" },
];

const featuredProducts = [
  {
    id: 1,
    name: "Bangus",
    price: 480,
    unit: "kg",
    vendor: "Maria's Catch",
    rating: 4.8,
    image: require("@/assets/img/bangus.jpg"),
    freshness: "Caught Today",
  },
  {
    id: 2,
    name: "Mayamaya",
    price: 650,
    unit: "kg",
    vendor: "Ocean Harvest",
    rating: 4.9,
    image: require("@/assets/img/mayamaya.jpg"),
    freshness: "Caught Today",
  },
  {
    id: 3,
    name: "Crab",
    price: 720,
    unit: "kg",
    vendor: "Deep Sea Catch",
    rating: 4.7,
    image: require("@/assets/img/crab.jpg"),
    freshness: "Caught Today",
  },
  {
    id: 4,
    name: "Shrimp",
    price: 720,
    unit: "kg",
    vendor: "Deep Sea Catch",
    rating: 4.7,
    image: require("@/assets/img/shrimp.jpg"),
    freshness: "Caught Today",
  },
  {
    id: 5,
    name: "Mayamaya",
    price: 650,
    unit: "kg",
    vendor: "Ocean Harvest",
    rating: 4.9,
    image: require("@/assets/img/mayamaya.jpg"),
    freshness: "Caught Today",
  },
  {
    id: 6,
    name: "Bangus",
    price: 480,
    unit: "kg",
    vendor: "Maria's Catch",
    rating: 4.8,
    image: require("@/assets/img/bangus.jpg"),
    freshness: "Caught Today",
  },
];

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

// Types now reference defined constants
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
type RootStackParamList = {
  ProductDetail: { product: (typeof featuredProducts)[0] };
};
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BuyerDashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1200);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation<NavigationProp>();

  // Handlers
  const handleProductPress = (product: (typeof featuredProducts)[0]) => {
    navigation.navigate("ProductDetail", { product });
  };

  const handleSeeAllPress = () => {
    console.log("View all products");
    // TODO: Navigate to full list
  };

  const handleSearchSubmit = () => {
    console.log("Search for:", searchQuery);
    // TODO: Filter or navigate
  };

  const handleCategoryPress = (category: (typeof categories)[0]) => {
    console.log(`Filter by ${category.name}`);
    // TODO: Filter products or navigate
  };

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
              <Text style={buyerDashboardStyles.headerTitle}>
                Good Morning!
              </Text>
              <Text style={buyerDashboardStyles.headerSubtitle}>
                What's fresh today?
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
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
        >
          {/* Promos */}
          <Text style={buyerDashboardStyles.sectionTitle}>Today's Offers</Text>
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
          <Text style={buyerDashboardStyles.sectionTitle}>Categories</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 12 }}
            style={{ marginBottom: 12 }}
          >
            {categories.map((cat, idx) => (
              <TouchableOpacity
                key={idx}
                style={buyerDashboardStyles.categoryCard}
                onPress={() => handleCategoryPress(cat)}
                accessibilityLabel={`Browse ${cat.name}`}
              >
                <View style={buyerDashboardStyles.categoryIconWrapper}>
                  <MaterialCommunityIcons
                    name={cat.icon}
                    size={32}
                    color="#005f73"
                  />
                </View>
                <Text style={buyerDashboardStyles.categoryName}>
                  {cat.name}
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
            <Text style={buyerDashboardStyles.sectionTitle}>
              Featured Catch
            </Text>
            <TouchableOpacity onPress={handleSeeAllPress}>
              <Text style={{ color: "#00b4d8", fontSize: 14 }}>See All</Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {featuredProducts.map((product) => (
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
                  <Image
                    source={product.image}
                    style={buyerDashboardStyles.productImage}
                    resizeMode="cover"
                  />
                  <View style={buyerDashboardStyles.freshnessOverlay}>
                    <Text style={buyerDashboardStyles.freshnessOverlayText}>
                      {product.freshness}
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
                        ₱{product.price}
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
                      {product.vendor}
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
                        {product.rating}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default BuyerDashboard;
