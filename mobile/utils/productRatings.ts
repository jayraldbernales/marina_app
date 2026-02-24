// utils/productRatings.ts
import { supabase } from "../lib/supabase";

// Types
interface ReviewData {
  product_rating: number;
  product_id: string;
}

interface ProductRating {
  rating: number;
  totalReviews: number;
}

// Cache for product ratings to avoid repeated fetches
const productRatingCache: Record<string, ProductRating> = {};

// Fetch product rating from reviews table using product_id directly
export const fetchProductRating = async (
  productId: string,
): Promise<ProductRating> => {
  // Check cache first
  if (productRatingCache[productId]) {
    return productRatingCache[productId];
  }

  try {
    // Direct query to reviews table using product_id
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("product_rating")
      .eq("product_id", productId);

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
    // Direct query to reviews table using product_id with IN clause
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("product_rating, product_id")
      .in("product_id", uncachedIds);

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
      return results;
    }

    // Group reviews by product_id and calculate averages
    const reviewsByProduct: Record<string, number[]> = {};

    // Initialize arrays for each product
    uncachedIds.forEach((id) => {
      reviewsByProduct[id] = [];
    });

    // Group ratings by product
    (reviews || []).forEach((review: any) => {
      if (reviewsByProduct[review.product_id]) {
        reviewsByProduct[review.product_id].push(review.product_rating);
      }
    });

    // Calculate average for each product
    uncachedIds.forEach((productId) => {
      const productRatings = reviewsByProduct[productId] || [];

      if (productRatings.length === 0) {
        const result = { rating: 0, totalReviews: 0 };
        productRatingCache[productId] = result;
        results[productId] = result;
      } else {
        const sumRatings = productRatings.reduce(
          (sum, rating) => sum + rating,
          0,
        );
        const avgRating =
          Math.round((sumRatings / productRatings.length) * 10) / 10;

        const result = {
          rating: avgRating,
          totalReviews: productRatings.length,
        };

        productRatingCache[productId] = result;
        results[productId] = result;
      }
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
