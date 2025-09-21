import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
  FontAwesome5,
} from "@expo/vector-icons";

// Dummy data (replace with real data or props as needed)
const categories: {
  name: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  count: number;
}[] = [
  { name: "Fish", icon: "fish", count: 24 },
  { name: "Shellfish", icon: "fish", count: 18 },
  { name: "Squid", icon: "fish", count: 12 },
  { name: "Crab", icon: "fish", count: 8 },
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
    color: "#FF7F50", // coral
    textColor: "#fff",
  },
  {
    title: "Free Delivery",
    description: "On orders above ₱1,500",
    color: "#7FFFD4", // aqua
    textColor: "#005f73",
  },
];

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
type NavigationProp = NativeStackNavigationProp<any>;

interface BuyerDashboardProps {
  navigation: NavigationProp;
}

const BuyerDashboard = ({ navigation }: BuyerDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Good Morning!</Text>
            <Text style={styles.headerSubtitle}>What's fresh today?</Text>
          </View>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => navigation.navigate("/welcome")}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color="#fff" />
              <Text style={styles.switchButtonText}>Switch to Buyer</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Feather
            name="search"
            size={20}
            color="#005f73"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search fresh seafood..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#005f73"
          />
        </View>
      </View>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Promos */}
        <Text style={styles.sectionTitle}>Today's Offers</Text>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          {promos.map((promo, idx) => (
            <View
              key={idx}
              style={[styles.promoCard, { backgroundColor: promo.color }]}
            >
              <Text style={[styles.promoTitle, { color: promo.textColor }]}>
                {promo.title}
              </Text>
              <Text style={[styles.promoDesc, { color: promo.textColor }]}>
                {promo.description}
              </Text>
            </View>
          ))}
        </View>
        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          {categories.map((cat, idx) => (
            <View key={idx} style={styles.categoryCard}>
              <MaterialCommunityIcons
                name={cat.icon}
                size={32}
                color="#005f73"
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryCount}>{cat.count}</Text>
            </View>
          ))}
        </View>
        {/* Featured Products */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text style={styles.sectionTitle}>Featured Catch</Text>
          <TouchableOpacity>
            <Text style={{ color: "#00b4d8", fontSize: 14 }}>See All</Text>
          </TouchableOpacity>
        </View>
        {featuredProducts.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={styles.productCard}
            onPress={() => navigation.navigate("ProductDetail", { product })}
          >
            <Text style={styles.productImage}>{product.image}</Text>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Text style={styles.productName}>{product.name}</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.productPrice}>₱{product.price}</Text>
                  <Text style={styles.productUnit}>per {product.unit}</Text>
                </View>
              </View>
              <Text style={styles.productVendor}>{product.vendor}</Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <FontAwesome5 name="star" size={14} color="#FFD700" />
                  <Text style={styles.productRating}>{product.rating}</Text>
                  <View style={styles.freshnessBadge}>
                    <Text style={styles.freshnessText}>
                      {product.freshness}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Feather name="map-pin" size={12} color="#005f73" />
                  <Text style={styles.productLocation}>{product.location}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e0fbfc" },
  header: {
    backgroundColor: "#005f73",
    padding: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  headerSubtitle: { color: "#7fffd4", fontSize: 14 },
  iconButton: { marginLeft: 12 },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 4,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: "#005f73" },
  scrollArea: { padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#005f73",
    marginBottom: 8,
  },
  promoCard: { flex: 1, borderRadius: 16, padding: 12, marginRight: 8 },
  promoTitle: { fontWeight: "bold", fontSize: 14 },
  promoDesc: { fontSize: 12, opacity: 0.9 },
  categoryCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    flex: 1,
    marginHorizontal: 2,
  },
  categoryName: { fontSize: 12, color: "#005f73", fontWeight: "500" },
  categoryCount: { fontSize: 12, color: "#0077b6" },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
  },
  productImage: { fontSize: 36, marginRight: 12 },
  productName: { fontWeight: "bold", color: "#005f73", fontSize: 16 },
  productPrice: { fontWeight: "bold", color: "#005f73", fontSize: 16 },
  productUnit: { fontSize: 12, color: "#0077b6" },
  productVendor: { fontSize: 13, color: "#0077b6", marginBottom: 2 },
  productRating: { fontSize: 13, color: "#333", marginLeft: 4, marginRight: 8 },
  freshnessBadge: {
    backgroundColor: "#7fffd4",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  freshnessText: { fontSize: 11, color: "#005f73" },
  productLocation: { fontSize: 11, color: "#005f73", marginLeft: 2 },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#cce3de",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  navItem: { alignItems: "center", flex: 1 },
  navLabel: { fontSize: 11, color: "#005f73", marginTop: 2 },

  switchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00BFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  switchButtonText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 14,
  },
});

export default BuyerDashboard;
