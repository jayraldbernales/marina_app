import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
  FontAwesome5,
} from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { COLORS } from "../constants";
import { buyerDashboardStyles } from "../components/styles/buyerDashboardStyles";

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
    name: "Fresh Red Snapper",
    price: 480,
    unit: "kg",
    vendor: "Maria's Catch",
    rating: 4.8,
    image: "🐟",
    freshness: "Caught Today",
    location: "2.3 km away",
  },
  {
    id: 2,
    name: "Tiger Prawns",
    price: 650,
    unit: "kg",
    vendor: "Ocean Harvest",
    rating: 4.9,
    image: "🦐",
    freshness: "Ultra Fresh",
    location: "1.8 km away",
  },
  {
    id: 3,
    name: "Blue Marlin Steak",
    price: 720,
    unit: "kg",
    vendor: "Deep Sea Catch",
    rating: 4.7,
    image: "🐟",
    freshness: "Just Landed",
    location: "3.1 km away",
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
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation<NavigationProp>();

  // Handlers
  const handleProductPress = (product: (typeof featuredProducts)[0]) => {
    navigation.navigate("ProductDetail", { product });
  };

  const handleChatPress = () => {
    console.log("Open chat");
    // TODO: Navigate to chat
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
                onPress={handleChatPress}
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
          contentContainerStyle={{ paddingBottom: 100 }}
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
                onPress={() => handleCategoryPress(cat)} // Added stub handler
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
          {featuredProducts.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={buyerDashboardStyles.productCard}
              onPress={() => handleProductPress(product)}
              accessibilityLabel={`${product.name}, ${product.price} per ${product.unit}`}
            >
              <Text style={buyerDashboardStyles.productImage}>
                {product.image}
              </Text>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 2,
                  }}
                >
                  <Text style={buyerDashboardStyles.productName}>
                    {product.name}
                  </Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={buyerDashboardStyles.productPrice}>
                      ₱{product.price}
                    </Text>
                    <Text style={buyerDashboardStyles.productUnit}>
                      per {product.unit}
                    </Text>
                  </View>
                </View>
                <Text style={buyerDashboardStyles.productVendor}>
                  {product.vendor}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <FontAwesome5 name="star" size={14} color="#FFD700" />
                    <Text style={buyerDashboardStyles.productRating}>
                      {product.rating}
                    </Text>
                    <View style={buyerDashboardStyles.freshnessBadge}>
                      <Text style={buyerDashboardStyles.freshnessText}>
                        {product.freshness}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Feather name="map-pin" size={12} color="#005f73" />
                    <Text style={buyerDashboardStyles.productLocation}>
                      {product.location}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default BuyerDashboard;
