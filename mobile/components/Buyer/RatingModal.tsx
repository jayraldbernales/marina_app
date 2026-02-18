// app/buyer/components/RatingModal.tsx
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
  | "preparing"
  | "ready-to-ship"
  | "shipped"
  | "delivered"
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
  // Separate ratings for product, vendor, and rider - default to 5
  const [productRating, setProductRating] = useState(5);
  const [vendorRating, setVendorRating] = useState(5);
  const [riderRating, setRiderRating] = useState(5);
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (visible && order) {
      checkExistingReview();
    }
  }, [visible, order]);

  const checkExistingReview = async () => {
    if (!order || !user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("order_id", order.id)
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking existing review:", error);
      }

      if (data) {
        setExistingReview(data);
        setProductRating(data.product_rating);
        setVendorRating(data.vendor_rating);
        setRiderRating(data.rider_rating);
        setComment(data.comment || "");
      } else {
        setExistingReview(null);
        // Set defaults to 5 when no existing review
        setProductRating(5);
        setVendorRating(5);
        setRiderRating(5);
        setComment("");
      }
    } catch (error) {
      console.error("Error checking existing review:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset to defaults when modal opens with new order
  useEffect(() => {
    if (visible && order && !existingReview) {
      setProductRating(5);
      setVendorRating(5);
      setRiderRating(5);
      setComment("");
    }
  }, [visible, order, existingReview]);

  const validateRatings = () => {
    // All ratings are now always selected (default 5)
    return true;
  };

  const handleSubmitRating = async () => {
    if (!order || !user?.id) return;

    setSubmitting(true);
    try {
      // Get vendor and rider IDs
      const vendorId = order.vendorId || order.items[0]?.vendorId;

      let riderId = order.riderId;
      if (!riderId) {
        const { data: orderData } = await supabase
          .from("orders")
          .select("rider_user_id")
          .eq("order_id", order.id)
          .single();

        riderId = orderData?.rider_user_id;
      }

      if (!vendorId) {
        Alert.alert("Error", "Vendor information not available");
        return;
      }

      if (!riderId) {
        Alert.alert("Error", "Rider information not available");
        return;
      }

      const reviewData = {
        order_id: order.id,
        user_id: user.id,
        vendor_user_id: vendorId,
        rider_user_id: riderId,
        product_rating: productRating,
        vendor_rating: vendorRating,
        rider_rating: riderRating,
        comment: comment.trim() || null,
      };

      let error;
      if (existingReview) {
        // Update existing review
        const { error: updateError } = await supabase
          .from("reviews")
          .update(reviewData)
          .eq("review_id", existingReview.review_id);
        error = updateError;
      } else {
        // Insert new review
        const { error: insertError } = await supabase
          .from("reviews")
          .insert([reviewData]);
        error = insertError;
      }

      if (error) throw error;

      Alert.alert(
        "Success",
        existingReview
          ? "Review updated successfully!"
          : "Thank you for your review!",
        [{ text: "OK", onPress: onRatingSubmitted }],
      );

      onClose();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      Alert.alert("Error", error.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!existingReview) return;

    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete your review?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);
            try {
              const { error } = await supabase
                .from("reviews")
                .delete()
                .eq("review_id", existingReview.review_id);

              if (error) throw error;

              Alert.alert("Success", "Review deleted successfully", [
                { text: "OK", onPress: onRatingSubmitted },
              ]);

              onClose();
            } catch (error: any) {
              console.error("Error deleting review:", error);
              Alert.alert("Error", error.message || "Failed to delete review");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  // Render product items with images and details
  const renderProductItems = () => {
    if (!order || order.items.length === 0) return null;

    return (
      <View style={orderStyles.productsContainer}>
        <Text style={orderStyles.productsTitle}>Products</Text>
        {order.items.map((item, index) => (
          <View key={item.id} style={orderStyles.productItemCard}>
            {/* Product Image */}
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

            {/* Product Details */}
            <View style={orderStyles.productInfo}>
              <View style={orderStyles.productMetaRow}>
                <Text style={orderStyles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={orderStyles.productPrice}>
                  ₱{order.totalAmount.toLocaleString()}
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
        ))}
      </View>
    );
  };

  // Render large stars for product rating
  const renderProductStars = (
    rating: number,
    setRating: (value: number) => void,
    label: string,
  ) => (
    <View style={orderStyles.productRatingSection}>
      <Text style={orderStyles.productRatingLabel}>{label}</Text>
      <View style={orderStyles.productStarsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            disabled={submitting}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={44}
              color={star <= rating ? "#FFB800" : "#D1D5DB"}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={orderStyles.productRatingHint}>
        {rating === 1 && "Poor"}
        {rating === 2 && "Fair"}
        {rating === 3 && "Good"}
        {rating === 4 && "Very Good"}
        {rating === 5 && "Excellent"}
      </Text>
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
              {existingReview ? "Edit Your Review" : "Rate Your Order"}
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
              <Text style={{ marginTop: 12 }}>Loading review...</Text>
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

              {/* Product Items with Images */}
              {renderProductItems()}

              {/* Divider */}
              <View style={orderStyles.ratingDivider} />

              {/* Product Rating - Large Stars */}
              {renderProductStars(
                productRating,
                setProductRating,
                "Rate Product Quality",
              )}

              {/* Divider */}
              <View style={orderStyles.ratingDivider} />

              {/* Comment Input */}
              <View style={orderStyles.ratingCommentContainer}>
                <Text style={orderStyles.commentLabel}>Comments</Text>
                <TextInput
                  style={orderStyles.ratingCommentInput}
                  placeholder="Share more thoughts on the products to help other buyers."
                  placeholderTextColor="#afabab"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!submitting}
                />
              </View>

              {/* Divider */}
              <View style={orderStyles.ratingDivider} />

              {/* Vendor Rating - Inline Small Stars */}
              <View style={orderStyles.serviceRatingsContainer}>
                <Text style={orderStyles.serviceRatingsTitle}>
                  Rate Service
                </Text>
                {order &&
                  order.items[0] &&
                  renderInlineStars(
                    vendorRating,
                    setVendorRating,
                    `Seller Service`,
                  )}

                {/* Rider Rating - Inline Small Stars */}
                {renderInlineStars(
                  riderRating,
                  setRiderRating,
                  "Delivery Speed",
                )}
              </View>

              {/* Divider */}
              <View style={orderStyles.ratingDivider} />

              {/* Action Buttons */}
              <View style={orderStyles.ratingActions}>
                {existingReview && (
                  <TouchableOpacity
                    style={[
                      orderStyles.ratingDeleteButton,
                      submitting && orderStyles.disabledButton,
                    ]}
                    onPress={handleDeleteReview}
                    disabled={submitting}
                  >
                    <Text style={orderStyles.ratingDeleteButtonText}>
                      Delete Review
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    orderStyles.ratingSubmitButton,
                    submitting && orderStyles.disabledButton,
                  ]}
                  onPress={handleSubmitRating}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={orderStyles.ratingSubmitButtonText}>
                      {existingReview ? "Update Review" : "Submit Review"}
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
