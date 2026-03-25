import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import { orderStyles } from "../styles/orderStyles";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";

// Types
type OrderStatus =
  | "pending"
  | "finding_rider"
  | "preparing"
  | "ready-to-ship"
  | "shipped"
  | "delivered"
  | "failed"
  | "cancelled"
  | "rejected";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "pending_verification";

interface DisplayOrder {
  id: string;
  orderNumber: string;
  items: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    vendor: string;
    vendorId?: string;
    image: string | null;
    harvested_at?: string;
  }[];
  status: OrderStatus;
  totalAmount: number;
  subtotal?: number;
  deliveryFee: number;
  orderDate: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentProofUrl?: string;
  gcashReference?: string;
  note?: string;
  deliveryAddress: string;
  vendorShopName?: string;
  vendorId?: string;
  riderId?: string;
}

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  order: DisplayOrder | null;
  onRatingSubmitted: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  order,
  onRatingSubmitted,
}) => {
  // Per-product ratings
  const [productRatings, setProductRatings] = useState<Record<string, number>>(
    {},
  );
  const [productComments, setProductComments] = useState<
    Record<string, string>
  >({});

  // Vendor and rider ratings (still global since they're the same for all products)
  const [vendorRating, setVendorRating] = useState(5);
  const [riderRating, setRiderRating] = useState(5);

  const [submitting, setSubmitting] = useState(false);
  const [existingReviews, setExistingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const user = useUserStore((state) => state.user);

  // Initialize ratings when order loads
  useEffect(() => {
    if (order) {
      const initialRatings: Record<string, number> = {};
      const initialComments: Record<string, string> = {};
      order.items.forEach((item) => {
        initialRatings[item.productId] = 5;
        initialComments[item.productId] = "";
      });
      setProductRatings(initialRatings);
      setProductComments(initialComments);
    }
  }, [order]);

  useEffect(() => {
    if (visible && order) {
      checkExistingReviews();
    }
  }, [visible, order]);

  const checkExistingReviews = async () => {
    if (!order || !user?.id) return;

    setLoading(true);
    try {
      // Check for existing reviews for this order
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("order_id", order.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error checking existing reviews:", error);
      }

      if (data && data.length > 0) {
        setExistingReviews(data);

        // Load existing ratings and comments
        const ratings: Record<string, number> = {};
        const comments: Record<string, string> = {};

        data.forEach((review) => {
          ratings[review.product_id] = review.product_rating;
          comments[review.product_id] = review.comment || "";
        });

        setProductRatings(ratings);
        setProductComments(comments);

        // Set vendor and rider ratings from first review (they should be the same)
        setVendorRating(data[0].vendor_rating || 5);
        setRiderRating(data[0].rider_rating || 5);
      } else {
        setExistingReviews([]);
        // Reset to defaults
        const defaultRatings: Record<string, number> = {};
        const defaultComments: Record<string, string> = {};
        order.items.forEach((item) => {
          defaultRatings[item.productId] = 5;
          defaultComments[item.productId] = "";
        });
        setProductRatings(defaultRatings);
        setProductComments(defaultComments);
        setVendorRating(5);
        setRiderRating(5);
      }
    } catch (error) {
      console.error("Error checking existing reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRatings = async () => {
    if (!order || !user?.id) return;

    setSubmitting(true);
    try {
      // Get vendor ID from order items
      const vendorId = order.vendorId || order.items[0]?.vendorId;

      if (!vendorId) {
        Alert.alert("Error", "Vendor information not available");
        return;
      }

      // Get rider ID from deliveries table
      let riderId = order.riderId;
      if (!riderId) {
        const { data: deliveryData, error: deliveryError } = await supabase
          .from("deliveries")
          .select("rider_user_id")
          .eq("order_id", order.id)
          .not("rider_user_id", "is", null)
          .maybeSingle();

        if (deliveryError) {
          console.error("Error fetching rider:", deliveryError);
        }

        riderId = deliveryData?.rider_user_id;
      }

      if (!riderId) {
        Alert.alert("Error", "Rider information not available");
        return;
      }

      // Create reviews for each product
      const reviewsData = order.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        user_id: user.id,
        vendor_user_id: vendorId,
        rider_user_id: riderId,
        product_rating: productRatings[item.productId] || 5,
        vendor_rating: vendorRating,
        rider_rating: riderRating,
        comment: productComments[item.productId]?.trim() || null,
      }));

      // Delete existing reviews first (if any)
      if (existingReviews.length > 0) {
        const { error: deleteError } = await supabase
          .from("reviews")
          .delete()
          .eq("order_id", order.id)
          .eq("user_id", user.id);

        if (deleteError) throw deleteError;
      }

      // Insert new reviews
      const { error: insertError } = await supabase
        .from("reviews")
        .insert(reviewsData);

      if (insertError) throw insertError;

      Alert.alert(
        "Success",
        existingReviews.length > 0
          ? "Reviews updated successfully!"
          : "Thank you for your reviews!",
        [{ text: "OK", onPress: onRatingSubmitted }],
      );

      onClose();
    } catch (error: any) {
      console.error("Error submitting reviews:", error);
      Alert.alert("Error", error.message || "Failed to submit reviews");
    } finally {
      setSubmitting(false);
    }
  };

  // Render rating UI for each product
  const renderProductRating = (item: DisplayOrder["items"][0]) => (
    <View key={item.id} style={orderStyles.productRatingContainer}>
      {/* Product Info */}
      <View style={orderStyles.productItemCard}>
        <View style={orderStyles.productImageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={orderStyles.productImage}
            />
          ) : (
            <View
              style={[
                orderStyles.productImage,
                orderStyles.productImagePlaceholder,
              ]}
            >
              <Ionicons name="image-outline" size={24} color="#999" />
            </View>
          )}
        </View>
        <View style={orderStyles.productInfo}>
          <View style={orderStyles.productMetaRow}>
            <Text style={orderStyles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={orderStyles.productPrice}>
              ₱{(item.price * item.quantity).toLocaleString()}
            </Text>
          </View>
          <View style={orderStyles.productMetaRow}>
            <Text style={orderStyles.productVendor}>{item.vendor}</Text>
            <Text style={orderStyles.productQuantity}>
              Qty: {item.quantity}
            </Text>
          </View>
        </View>
      </View>

      {/* Rating Stars for this product */}
      <View style={orderStyles.productRatingStars}>
        <Text style={orderStyles.ratingLabel}>Rate this product</Text>
        <View style={orderStyles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() =>
                setProductRatings((prev) => ({
                  ...prev,
                  [item.productId]: star,
                }))
              }
              disabled={submitting}
            >
              <Ionicons
                name={
                  star <= (productRatings[item.productId] || 5)
                    ? "star"
                    : "star-outline"
                }
                size={32}
                color={
                  star <= (productRatings[item.productId] || 5)
                    ? "#FFB800"
                    : "#D1D5DB"
                }
                style={orderStyles.starIcon}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={orderStyles.ratingHint}>
          {(productRatings[item.productId] || 5) === 1 && "Poor"}
          {(productRatings[item.productId] || 5) === 2 && "Fair"}
          {(productRatings[item.productId] || 5) === 3 && "Good"}
          {(productRatings[item.productId] || 5) === 4 && "Very Good"}
          {(productRatings[item.productId] || 5) === 5 && "Excellent"}
        </Text>
      </View>

      {/* Comment for this product */}
      <View style={orderStyles.productCommentContainer}>
        <TextInput
          style={orderStyles.ratingCommentInput}
          placeholder={`Comments for ${item.name} (optional)`}
          placeholderTextColor="#afabab"
          value={productComments[item.productId] || ""}
          onChangeText={(text) =>
            setProductComments((prev) => ({
              ...prev,
              [item.productId]: text,
            }))
          }
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!submitting}
        />
      </View>

      <View style={orderStyles.ratingDivider} />
    </View>
  );

  // Render small inline stars for vendor/rider ratings
  const renderInlineStars = (
    rating: number,
    setRating: (value: number) => void,
    label: string,
  ) => (
    <View style={orderStyles.inlineRatingRow}>
      <Text style={orderStyles.inlineRatingLabel}>{label}</Text>
      <View style={orderStyles.inlineStarsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            disabled={submitting}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={20}
              color={star <= rating ? "#FFB800" : "#D1D5DB"}
              style={orderStyles.inlineStar}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={orderStyles.modalOverlay}>
        <View style={orderStyles.ratingModalContent}>
          {/* Modal Header */}
          <View style={orderStyles.modalHeader}>
            <Text style={orderStyles.modalTitle}>
              {existingReviews.length > 0
                ? "Edit Your Reviews"
                : "Rate Your Order"}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={orderStyles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color={COLORS.light.primary} />
              <Text style={{ marginTop: 12 }}>Loading reviews...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Order Info */}
              {order && (
                <View style={orderStyles.ratingOrderInfo}>
                  <Text style={orderStyles.ratingOrderNumber}>
                    #{order.orderNumber}
                  </Text>
                  <Text style={orderStyles.ratingOrderDate}>
                    {order.orderDate}
                  </Text>
                </View>
              )}

              {/* Rate each product */}
              <View style={orderStyles.productsContainer}>
                <Text style={orderStyles.productsTitle}>Rate Each Product</Text>
                {order?.items.map((item) => renderProductRating(item))}
              </View>

              {/* Vendor and Rider Ratings */}
              <View style={orderStyles.serviceRatingsContainer}>
                <Text style={orderStyles.serviceRatingsTitle}>
                  Rate Overall Service
                </Text>
                {order &&
                  order.items[0] &&
                  renderInlineStars(
                    vendorRating,
                    setVendorRating,
                    `Seller Service`,
                  )}

                {renderInlineStars(
                  riderRating,
                  setRiderRating,
                  "Delivery Speed",
                )}
              </View>

              {/* Action Buttons */}
              <View style={orderStyles.ratingActions}>
                <TouchableOpacity
                  style={[
                    orderStyles.ratingSubmitButton,
                    submitting && orderStyles.disabledButton,
                  ]}
                  onPress={handleSubmitRatings}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={orderStyles.ratingSubmitButtonText}>
                      {existingReviews.length > 0
                        ? "Update Reviews"
                        : "Submit Reviews"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default RatingModal;
