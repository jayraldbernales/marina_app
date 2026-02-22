// utils/productRatings.ts
import { supabase } from "../lib/supabase";

// Types
interface OrderItem {
  order_id: string;
}

interface ReviewData {
  product_rating: number;
}

interface ProductRating {
  rating: number;
  totalReviews: number;
}

// Cache for product ratings to avoid repeated fetches
const productRatingCache: Record<string, ProductRating> = {};

// Fetch product rating from reviews table
export const fetchProductRating = async (
  productId: string,
): Promise<ProductRating> => {
  // Check cache first
  if (productRatingCache[productId]) {
    return productRatingCache[productId];
  }

  try {
    // First, find all order_items that contain this product
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("order_id")
      .eq("product_id", productId);

    if (orderItemsError) {
      console.error("Error fetching order items:", orderItemsError);
      return { rating: 0, totalReviews: 0 };
    }

    if (!orderItems || orderItems.length === 0) {
      const result = { rating: 0, totalReviews: 0 };
      productRatingCache[productId] = result;
      return result;
    }

    // Get unique order IDs
    const orderIds = (orderItems as OrderItem[]).map((item) => item.order_id);

    // Find reviews for these orders
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("product_rating")
      .in("order_id", orderIds);

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
      return { rating: 0, totalReviews: 0 };
    }

    if (!reviews || reviews.length === 0) {
      const result = { rating: 0, totalReviews: 0 };
      productRatingCache[productId] = result;
      return result;
    }

    // Calculate average rating
    const sumRatings = (reviews as ReviewData[]).reduce(
      (sum, review) => sum + review.product_rating,
      0,
    );
    const avgRating = Math.round((sumRatings / reviews.length) * 10) / 10;

    const result = {
      rating: avgRating,
      totalReviews: reviews.length,
    };

    productRatingCache[productId] = result;
    return result;
  } catch (error) {
    console.error("Error in fetchProductRating:", error);
    return { rating: 0, totalReviews: 0 };
  }
};

// Fetch multiple product ratings at once (for dashboard)
export const fetchMultipleProductRatings = async (
  productIds: string[],
): Promise<Record<string, ProductRating>> => {
  const results: Record<string, ProductRating> = {};

  // Check cache first for each product
  const uncachedIds = productIds.filter((id) => !productRatingCache[id]);

  // Return cached results for cached products
  productIds.forEach((id) => {
    if (productRatingCache[id]) {
      results[id] = productRatingCache[id];
    }
  });

  if (uncachedIds.length === 0) {
    return results;
  }

  try {
    // First, find all order_items for all uncached products
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("order_id, product_id")
      .in("product_id", uncachedIds);

    if (orderItemsError) {
      console.error("Error fetching order items:", orderItemsError);
      return results;
    }

    if (!orderItems || orderItems.length === 0) {
      // No orders for these products yet
      uncachedIds.forEach((id) => {
        const result = { rating: 0, totalReviews: 0 };
        productRatingCache[id] = result;
        results[id] = result;
      });
      return results;
    }

    // Group order IDs by product
    const orderIdsByProduct: Record<string, string[]> = {};
    const allOrderIds: string[] = [];

    orderItems.forEach((item: any) => {
      if (!orderIdsByProduct[item.product_id]) {
        orderIdsByProduct[item.product_id] = [];
      }
      orderIdsByProduct[item.product_id].push(item.order_id);
      allOrderIds.push(item.order_id);
    });

    // Get unique order IDs
    const uniqueOrderIds = [...new Set(allOrderIds)];

    // Fetch all reviews for these orders
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("product_rating, order_id")
      .in("order_id", uniqueOrderIds);

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
      return results;
    }

    // Group reviews by order_id
    const reviewsByOrder: Record<string, ReviewData[]> = {};
    (reviews || []).forEach((review: any) => {
      if (!reviewsByOrder[review.order_id]) {
        reviewsByOrder[review.order_id] = [];
      }
      reviewsByOrder[review.order_id].push(review);
    });

    // Calculate ratings for each product
    uncachedIds.forEach((productId) => {
      const productOrderIds = orderIdsByProduct[productId] || [];
      let totalRating = 0;
      let reviewCount = 0;

      productOrderIds.forEach((orderId) => {
        const orderReviews = reviewsByOrder[orderId] || [];
        orderReviews.forEach((review) => {
          totalRating += review.product_rating;
          reviewCount++;
        });
      });

      const result = {
        rating:
          reviewCount > 0
            ? Math.round((totalRating / reviewCount) * 10) / 10
            : 0,
        totalReviews: reviewCount,
      };

      productRatingCache[productId] = result;
      results[productId] = result;
    });

    return results;
  } catch (error) {
    console.error("Error in fetchMultipleProductRatings:", error);
    return results;
  }
};

// Clear cache (useful for testing or when needed)
export const clearProductRatingCache = () => {
  Object.keys(productRatingCache).forEach(
    (key) => delete productRatingCache[key],
  );
};
