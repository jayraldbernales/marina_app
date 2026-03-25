// utils/productRatings.ts
import { supabase } from "../lib/supabase";

interface ProductRating {
  rating: number;
  totalReviews: number;
}

export const fetchMultipleProductRatings = async (
  productIds: string[],
): Promise<Record<string, ProductRating>> => {
  if (!productIds.length) return {};

  const { data, error } = await supabase
    .from("reviews")
    .select("product_rating, product_id")
    .in("product_id", productIds);

  if (error || !data) return {};

  const results: Record<string, ProductRating> = {};
  productIds.forEach((id) => {
    results[id] = { rating: 0, totalReviews: 0 };
  });

  const grouped: Record<string, number[]> = {};
  data.forEach((r: any) => {
    if (!grouped[r.product_id]) grouped[r.product_id] = [];
    grouped[r.product_id].push(r.product_rating);
  });

  Object.entries(grouped).forEach(([id, ratings]) => {
    const avg =
      Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) /
      10;
    results[id] = { rating: avg, totalReviews: ratings.length };
  });

  return results;
};

// Single product rating — just calls the batch function with one ID
export const fetchProductRating = async (
  productId: string,
): Promise<ProductRating> => {
  const results = await fetchMultipleProductRatings([productId]);
  return results[productId] ?? { rating: 0, totalReviews: 0 };
};
