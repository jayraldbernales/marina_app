import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { COLORS } from "@/constants";

type Review = {
  review_id: string;
  order_id: string;
  user_id: string;
  vendor_user_id: string;
  rider_user_id: string;
  product_rating: number;
  vendor_rating: number;
  rider_rating: number;
  comment: string | null;
  created_at: string;
  product_id: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  products: {
    product_name: string;
    product_id: string;
    images: string[] | null;
  };
};

type RatingSummary = {
  overall: number;
  totalReviews: number;
  productAvg: number;
  vendorAvg: number;
  riderAvg: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
};

const VendorReviewsScreen = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<RatingSummary>({
    overall: 0,
    totalReviews: 0,
    productAvg: 0,
    vendorAvg: 0,
    riderAvg: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "product" | "vendor" | "rider"
  >("all");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">(
    "newest",
  );
  const [showSortModal, setShowSortModal] = useState(false);

  const navigation = useNavigation();
  const user = useUserStore((state) => state.user);

  const fetchReviews = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // ✅ FIXED: Changed from profiles!reviews_user_id_fkey to profiles!user_id
      const { data, error } = await supabase
        .from("reviews")
        .select(
          `
          *,
          profiles!user_id (
            full_name,
            avatar_url
          ),
          products!product_id (
            product_name,
            product_id,
            images
          )
        `,
        )
        .eq("vendor_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReviews(data || []);

      // Calculate summary statistics
      if (data && data.length > 0) {
        const total = data.length;
        const productSum = data.reduce((sum, r) => sum + r.product_rating, 0);
        const vendorSum = data.reduce((sum, r) => sum + r.vendor_rating, 0);
        const riderSum = data.reduce((sum, r) => sum + r.rider_rating, 0);

        // Distribution counts
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        data.forEach((r) => {
          // Average the three ratings for overall distribution
          const avg = (r.product_rating + r.vendor_rating + r.rider_rating) / 3;
          const rounded = Math.round(avg);
          if (rounded >= 5) dist[5]++;
          else if (rounded >= 4) dist[4]++;
          else if (rounded >= 3) dist[3]++;
          else if (rounded >= 2) dist[2]++;
          else dist[1]++;
        });

        setSummary({
          overall: Number(
            ((productSum + vendorSum + riderSum) / (total * 3)).toFixed(1),
          ),
          totalReviews: total,
          productAvg: Number((productSum / total).toFixed(1)),
          vendorAvg: Number((vendorSum / total).toFixed(1)),
          riderAvg: Number((riderSum / total).toFixed(1)),
          distribution: dist,
        });
      } else {
        setSummary({
          overall: 0,
          totalReviews: 0,
          productAvg: 0,
          vendorAvg: 0,
          riderAvg: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        });
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      Alert.alert("Error", "Failed to load reviews");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = [...reviews];

    // Apply filter based on rating type
    if (selectedFilter !== "all") {
      filtered = filtered.filter((r) => {
        if (selectedFilter === "product") return r.product_rating >= 4;
        if (selectedFilter === "vendor") return r.vendor_rating >= 4;
        if (selectedFilter === "rider") return r.rider_rating >= 4;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (sortBy === "highest") {
        const avgA = (a.product_rating + a.vendor_rating + a.rider_rating) / 3;
        const avgB = (b.product_rating + b.vendor_rating + b.rider_rating) / 3;
        return avgB - avgA;
      } else {
        const avgA = (a.product_rating + a.vendor_rating + a.rider_rating) / 3;
        const avgB = (b.product_rating + b.vendor_rating + b.rider_rating) / 3;
        return avgA - avgB;
      }
    });

    return filtered;
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={size} color="#FFB800" />,
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={size} color="#FFB800" />,
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={size} color="#FFB800" />,
        );
      }
    }
    return stars;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredReviews = getFilteredAndSortedReviews();

  const SortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort Reviews</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.sortOption,
              sortBy === "newest" && styles.sortOptionSelected,
            ]}
            onPress={() => {
              setSortBy("newest");
              setShowSortModal(false);
            }}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={sortBy === "newest" ? COLORS.light.primary : "#666"}
            />
            <Text
              style={[
                styles.sortOptionText,
                sortBy === "newest" && styles.sortOptionTextSelected,
              ]}
            >
              Newest First
            </Text>
            {sortBy === "newest" && (
              <Ionicons
                name="checkmark"
                size={20}
                color={COLORS.light.primary}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortOption,
              sortBy === "highest" && styles.sortOptionSelected,
            ]}
            onPress={() => {
              setSortBy("highest");
              setShowSortModal(false);
            }}
          >
            <Ionicons
              name="trending-up"
              size={20}
              color={sortBy === "highest" ? COLORS.light.primary : "#666"}
            />
            <Text
              style={[
                styles.sortOptionText,
                sortBy === "highest" && styles.sortOptionTextSelected,
              ]}
            >
              Highest Rated
            </Text>
            {sortBy === "highest" && (
              <Ionicons
                name="checkmark"
                size={20}
                color={COLORS.light.primary}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortOption,
              sortBy === "lowest" && styles.sortOptionSelected,
            ]}
            onPress={() => {
              setSortBy("lowest");
              setShowSortModal(false);
            }}
          >
            <Ionicons
              name="trending-down"
              size={20}
              color={sortBy === "lowest" ? COLORS.light.primary : "#666"}
            />
            <Text
              style={[
                styles.sortOptionText,
                sortBy === "lowest" && styles.sortOptionTextSelected,
              ]}
            >
              Lowest Rated
            </Text>
            {sortBy === "lowest" && (
              <Ionicons
                name="checkmark"
                size={20}
                color={COLORS.light.primary}
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Reviews</Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.light.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Reviews</Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={COLORS.light.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Rating Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.overallRating}>
            <Text style={styles.overallScore}>{summary.overall}</Text>
            <Text style={styles.overallMax}>/5</Text>
          </View>
          <View style={styles.overallStars}>
            {renderStars(summary.overall, 24)}
          </View>
          <Text style={styles.totalReviews}>
            Based on {summary.totalReviews} review
            {summary.totalReviews !== 1 ? "s" : ""}
          </Text>

          {/* Distribution Bars */}
          <View style={styles.distributionContainer}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count =
                summary.distribution[star as keyof typeof summary.distribution];
              const percentage =
                summary.totalReviews > 0
                  ? (count / summary.totalReviews) * 100
                  : 0;

              return (
                <View key={star} style={styles.distributionRow}>
                  <Text style={styles.distributionLabel}>{star} ★</Text>
                  <View style={styles.distributionBarContainer}>
                    <View
                      style={[
                        styles.distributionBar,
                        { width: `${percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.distributionCount}>{count}</Text>
                </View>
              );
            })}
          </View>

          {/* Category Averages */}
          <View style={styles.categoryAverages}>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryLabel}>Product</Text>
              <View style={styles.categoryRating}>
                <Text style={styles.categoryScore}>{summary.productAvg}</Text>
                <View style={styles.categoryStars}>
                  {renderStars(summary.productAvg, 12)}
                </View>
              </View>
            </View>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryLabel}>Vendor</Text>
              <View style={styles.categoryRating}>
                <Text style={styles.categoryScore}>{summary.vendorAvg}</Text>
                <View style={styles.categoryStars}>
                  {renderStars(summary.vendorAvg, 12)}
                </View>
              </View>
            </View>
            <View style={styles.categoryItem}>
              <Text style={styles.categoryLabel}>Rider</Text>
              <View style={styles.categoryRating}>
                <Text style={styles.categoryScore}>{summary.riderAvg}</Text>
                <View style={styles.categoryStars}>
                  {renderStars(summary.riderAvg, 12)}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Filter and Sort */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === "all" && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter("all")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === "all" && styles.filterChipTextActive,
                ]}
              >
                All Reviews
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === "product" && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter("product")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === "product" && styles.filterChipTextActive,
                ]}
              >
                Product ★4+
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === "vendor" && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter("vendor")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === "vendor" && styles.filterChipTextActive,
                ]}
              >
                Vendor ★4+
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === "rider" && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter("rider")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === "rider" && styles.filterChipTextActive,
                ]}
              >
                Rider ★4+
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Reviews List */}
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <View key={review.review_id} style={styles.reviewCard}>
              {/* Customer Info */}
              <View style={styles.customerInfo}>
                <View style={styles.avatarContainer}>
                  {review.profiles?.avatar_url ? (
                    <Image
                      source={{ uri: review.profiles.avatar_url }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {review.profiles?.full_name?.charAt(0) || "C"}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.customerDetails}>
                  <Text style={styles.customerName}>
                    {review.profiles?.full_name || "Anonymous"}
                  </Text>
                  <Text style={styles.reviewDate}>
                    {formatDate(review.created_at)}
                  </Text>
                </View>
              </View>

              {/* Product Info */}
              <View style={styles.productInfo}>
                <View style={styles.productImageContainer}>
                  {review.products?.images?.[0] ? (
                    <Image
                      source={{ uri: review.products.images[0] }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Ionicons name="fish-outline" size={20} color="#999" />
                    </View>
                  )}
                </View>
                <Text style={styles.productName} numberOfLines={1}>
                  {review.products?.product_name || "Unknown Product"}
                </Text>
              </View>

              {/* Ratings Breakdown */}
              <View style={styles.ratingsBreakdown}>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>Product</Text>
                  <View style={styles.ratingStars}>
                    {renderStars(review.product_rating)}
                  </View>
                </View>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>Vendor</Text>
                  <View style={styles.ratingStars}>
                    {renderStars(review.vendor_rating)}
                  </View>
                </View>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>Rider</Text>
                  <View style={styles.ratingStars}>
                    {renderStars(review.rider_rating)}
                  </View>
                </View>
              </View>

              {/* Comment */}
              {review.comment && (
                <View style={styles.commentContainer}>
                  <Text style={styles.commentText}>{review.comment}</Text>
                </View>
              )}

              {/* View Order Button */}
              <TouchableOpacity
                style={styles.viewOrderButton}
                onPress={() =>
                  router.push({
                    pathname: "/(seller-tabs)/orders",
                    params: { orderId: review.order_id },
                  })
                }
              >
                <Text style={styles.viewOrderText}>View Order</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.light.primary}
                />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptyDescription}>
              When customers leave reviews, they'll appear here
            </Text>
          </View>
        )}
      </ScrollView>

      <SortModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.common.white,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f2ed",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.light.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryCard: {
    backgroundColor: COLORS.common.white,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overallRating: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 4,
  },
  overallScore: {
    fontSize: 48,
    fontWeight: "700",
    color: COLORS.light.primary,
  },
  overallMax: {
    fontSize: 24,
    color: "#999",
    marginLeft: 2,
  },
  overallStars: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  totalReviews: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  distributionContainer: {
    marginBottom: 20,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  distributionLabel: {
    width: 35,
    fontSize: 13,
    color: "#666",
  },
  distributionBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginHorizontal: 8,
  },
  distributionBar: {
    height: "100%",
    backgroundColor: COLORS.light.primary,
    borderRadius: 4,
  },
  distributionCount: {
    width: 30,
    fontSize: 13,
    color: "#666",
    textAlign: "right",
  },
  categoryAverages: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 16,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: "#666",
    width: 60,
  },
  categoryRating: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryScore: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.light.primary,
    marginRight: 8,
    width: 30,
  },
  categoryStars: {
    flexDirection: "row",
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterChipActive: {
    backgroundColor: COLORS.light.primary,
    borderColor: COLORS.light.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: "#666",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  sortButton: {
    width: 40,
    height: 40,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewCard: {
    backgroundColor: COLORS.common.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  customerInfo: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0f2ed",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.light.primary,
  },
  customerDetails: {
    flex: 1,
    justifyContent: "center",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  productImageContainer: {
    marginRight: 8,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  productName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  ratingsBreakdown: {
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingLabel: {
    width: 60,
    fontSize: 13,
    color: "#666",
  },
  ratingStars: {
    flexDirection: "row",
    marginLeft: 8,
  },
  commentContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  viewOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  viewOrderText: {
    fontSize: 13,
    color: COLORS.light.primary,
    marginRight: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    color: "#ccc",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.common.white,
    borderRadius: 16,
    padding: 20,
    width: "80%",
    maxWidth: 320,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sortOptionSelected: {
    backgroundColor: "#e0f2ed",
  },
  sortOptionText: {
    flex: 1,
    fontSize: 15,
    color: "#666",
    marginLeft: 12,
  },
  sortOptionTextSelected: {
    color: COLORS.light.primary,
    fontWeight: "600",
  },
});

export default VendorReviewsScreen;
