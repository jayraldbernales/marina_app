import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { COLORS } from "../../constants";
import { buyerDashboardStyles } from "../../components/styles/buyerDashboardStyles";

const BuyerDashboardSkeleton = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSeeAllPress = () => {
    console.log("View all products");
  };

  const handleSearchSubmit = () => {
    console.log("Search for:", searchQuery);
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
          {/* Promos Skeleton */}
          <Text style={buyerDashboardStyles.sectionTitle}>Today's Offers</Text>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            {Array.from({ length: 2 }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  buyerDashboardStyles.promoCard,
                  { backgroundColor: "#ffffff" },
                ]}
              >
                {/* Promo Title Skeleton */}
                <View
                  style={{
                    height: 14,
                    width: 80,
                    backgroundColor: "#e0e0e0",
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                {/* Promo Description Skeleton */}
                <View
                  style={{
                    height: 12,
                    width: 120,
                    backgroundColor: "#e0e0e0",
                    borderRadius: 4,
                  }}
                />
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
            {Array.from({ length: 6 }).map((_, idx) => (
              <View key={idx} style={buyerDashboardStyles.categoryCard}>
                <View
                  style={{
                    height: 30,
                    width: 35,
                    backgroundColor: "#e0e0e0",
                    borderRadius: 5,
                  }}
                />
                <View
                  style={{
                    height: 8,
                    width: 20,
                    backgroundColor: "#e0e0e0",
                    borderRadius: 10,
                    marginTop: 8,
                  }}
                />
              </View>
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
            {Array.from({ length: 6 }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  buyerDashboardStyles.productCard,
                  {
                    width: "49%",
                    marginBottom: 12,
                  },
                ]}
              >
                <View style={{ position: "relative" }}>
                  <View
                    style={[
                      buyerDashboardStyles.productImage,
                      { backgroundColor: "#e0e0e0" },
                    ]}
                  />
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
                    <View
                      style={{
                        height: 16,
                        width: 70,
                        backgroundColor: "#e0e0e0",
                        borderRadius: 4,
                      }}
                    />
                    <View
                      style={{
                        height: 16,
                        backgroundColor: "#e0e0e0",
                        width: 30,
                        borderRadius: 4,
                      }}
                    />
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 2,
                    }}
                  >
                    <View
                      style={{
                        height: 14,
                        width: 30,
                        backgroundColor: "#e0e0e0",
                        borderRadius: 4,
                      }}
                    />
                    <View
                      style={{
                        height: 14,
                        backgroundColor: "#e0e0e0",
                        width: 40,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default BuyerDashboardSkeleton;
