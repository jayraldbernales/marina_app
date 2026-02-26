import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS } from "../../constants";
import { supabase } from "../../lib/supabase";
import LoadingSpinner from "../../components/Loading";
import { chatService } from "../../lib/chat";

type ReviewData = {
  rider_rating: number;
  review_id: string;
  created_at: string;
};

export default function ViewRiderFromVendorScreen() {
  const params = useLocalSearchParams();
  const riderUserId = params?.rider_user_id as string;

  const [rider, setRider] = useState<any | null>(null);
  const [riderProfile, setRiderProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    rating: 0,
    totalReviews: 0,
  });

  const loadRiderProfile = useCallback(async () => {
    if (!riderUserId) return;
    try {
      // Fetch rider profile and user profile
      const { data: riderData, error: riderError } = await supabase
        .from("rider_profiles")
        .select(
          `
        user_id,
        avatar_url,
        vehicle_type,
        license_plate,
        approval_status,
        is_available,
        created_at,
        gcash_number,
        gcash_name,
        profiles!rider_profiles_user_id_fkey(
          full_name
        )
      `,
        )
        .eq("user_id", riderUserId)
        .single();

      if (riderError) {
        console.error("Error fetching rider:", riderError);
        Alert.alert("Error", "Failed to load rider profile.");
        return;
      }

      setRider(riderData);

      // Access the first element of the profiles array
      const profileData = Array.isArray(riderData?.profiles)
        ? riderData?.profiles[0]
        : riderData?.profiles;

      setRiderProfile({
        full_name: profileData?.full_name || "Rider",
        avatar_url: riderData?.avatar_url || null,
      });

      // Get delivery stats
      const { count: totalCount } = await supabase
        .from("deliveries")
        .select("*", { count: "exact", head: true })
        .eq("rider_user_id", riderUserId);

      const { count: completedCount } = await supabase
        .from("deliveries")
        .select("*", { count: "exact", head: true })
        .eq("rider_user_id", riderUserId)
        .eq("status", "delivered");

      // Fetch rider's ratings from reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("rider_rating, review_id, created_at")
        .eq("rider_user_id", riderUserId);

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
      }

      const reviews = (reviewsData as ReviewData[]) || [];

      // Calculate average rating
      let avgRating = 0;
      let totalReviews = 0;

      if (reviews.length > 0) {
        totalReviews = reviews.length;
        const sumRatings = reviews.reduce(
          (sum, review) => sum + review.rider_rating,
          0,
        );
        avgRating = sumRatings / totalReviews;
        avgRating = Math.round(avgRating * 10) / 10;
      }

      setStats({
        totalDeliveries: totalCount || 0,
        completedDeliveries: completedCount || 0,
        rating: avgRating,
        totalReviews: totalReviews,
      });
    } catch (err) {
      console.error("Error loading rider profile:", err);
    }
  }, [riderUserId]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await loadRiderProfile();
      setLoading(false);
    };
    loadInitialData();
  }, [riderUserId]);

  const goBack = useCallback(() => router.back(), []);

  const handleChatWithRider = async () => {
    try {
      // Get current user (vendor)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "Please login to chat with riders");
        return;
      }

      const { data: conversation, error } =
        await chatService.getOrCreateConversation({
          vendorId: user.id,
          riderId: riderUserId,
        });

      if (error) {
        console.error("Error creating conversation:", error);
        Alert.alert("Error", "Failed to start chat");
        return;
      }

      // Navigate to chat screen
      router.push({
        pathname: "../buyer/chat",
        params: {
          conversationId: conversation.id,
          otherPartyName: riderProfile?.full_name || "Rider",
          otherPartyId: riderUserId,
          otherPartyType: "rider",
          otherPartyAvatar: riderProfile?.avatar_url,
        },
      });
    } catch (err) {
      console.error("Error in chat:", err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const formatJoinDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mainContent}>
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Rider Profile</Text>
            <View style={{ width: 40 }} />
          </View>
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  if (!rider) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mainContent}>
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Rider Profile</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bike" size={64} color="#cbd5e1" />
            <Text style={styles.emptyStateText}>Rider not found</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rider Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Rider Profile Header */}
          <View style={styles.riderHeader}>
            <View style={styles.riderProfileSection}>
              {riderProfile?.avatar_url ? (
                <Image
                  source={{ uri: riderProfile.avatar_url }}
                  style={styles.riderAvatar}
                />
              ) : (
                <View style={styles.riderAvatarPlaceholder}>
                  <MaterialCommunityIcons name="bike" size={32} color="#fff" />
                </View>
              )}

              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>
                  {riderProfile?.full_name || "Rider Name"}
                </Text>

                {/* Availability Badge */}
                <View
                  style={[
                    styles.availabilityBadge,
                    {
                      backgroundColor: rider.is_available
                        ? "#10b981"
                        : "#ef4444",
                    },
                  ]}
                >
                  <Text style={styles.availabilityText}>
                    {rider.is_available ? "Available" : "On Delivery"}
                  </Text>
                </View>

                <View style={styles.riderRatingContainer}>
                  <MaterialCommunityIcons
                    name="star"
                    size={16}
                    color="#FFD700"
                  />
                  <Text style={styles.riderRatingText}>
                    {stats.rating > 0 ? stats.rating.toFixed(1) : "0.0"} •
                    {stats.totalReviews > 0
                      ? ` ${stats.totalReviews} review${stats.totalReviews === 1 ? "" : "s"}`
                      : " No ratings yet"}
                  </Text>
                </View>

                <View style={styles.riderMetaRow}>
                  <View style={styles.riderMetaItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#757575"
                    />
                    <Text style={styles.riderMetaText}>
                      Joined {formatJoinDate(rider?.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Chat Button */}
            <TouchableOpacity
              style={styles.chatButton}
              onPress={handleChatWithRider}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>

            {/* Vehicle Info */}
            <View style={styles.vehicleContainer}>
              <View style={styles.vehicleHeader}>
                <MaterialCommunityIcons
                  name="motorbike"
                  size={16}
                  color={COLORS.light.primary}
                />
                <Text style={styles.vehicleTitle}>Vehicle Information</Text>
              </View>
              <View style={styles.vehicleDetails}>
                <Text style={styles.vehicleType}>
                  {rider.vehicle_type || "Not specified"}
                </Text>
                {rider.license_plate && (
                  <Text style={styles.licensePlate}>
                    Plate: {rider.license_plate}
                  </Text>
                )}
              </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalDeliveries}</Text>
                <Text style={styles.statLabel}>Total Deliveries</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {stats.completedDeliveries}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {stats.totalDeliveries > 0
                    ? Math.round(
                        (stats.completedDeliveries / stats.totalDeliveries) *
                          100,
                      )
                    : 0}
                  %
                </Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
            </View>

            {/* GCash Info (if available) */}
            {rider?.gcash_number && (
              <View style={styles.gcashContainer}>
                <View style={styles.gcashHeader}>
                  <FontAwesome name="mobile" size={16} color="#00b140" />
                  <Text style={styles.gcashTitle}>GCash</Text>
                </View>
                <View>
                  <Text style={styles.gcashNumber}>{rider.gcash_number}</Text>
                  {rider.gcash_name && (
                    <Text style={styles.gcashName}>{rider.gcash_name}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  mainContent: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.light.primary,
    textAlign: "center",
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
  },
  riderHeader: {
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  riderProfileSection: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  riderAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.light.primary,
  },
  riderAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.light.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  riderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  riderName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 4,
  },
  availabilityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  availabilityText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  riderRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  riderRatingText: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 4,
    fontWeight: "500",
  },
  riderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  riderMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  riderMetaText: {
    fontSize: 12,
    color: "#757575",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    gap: 8,
  },
  chatButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  vehicleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  vehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  vehicleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  vehicleDetails: {
    marginLeft: 22,
  },
  vehicleType: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  licensePlate: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    justifyContent: "space-around",
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.light.primary,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  gcashContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
  },
  gcashHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 12,
  },
  gcashTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  gcashNumber: {
    fontSize: 14,
    color: "#00b140",
    fontWeight: "500",
  },
  gcashName: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});
