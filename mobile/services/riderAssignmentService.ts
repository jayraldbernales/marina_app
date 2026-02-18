// services/riderAssignmentService.ts
import { supabase } from "@/lib/supabase";

// -----------------------------
// Types
// -----------------------------
export interface Rider {
  riderId: string;
  name: string;
  avatar: string | null;
  distance?: number;
  score: number;
  location: string;
  latitude?: number;
  longitude?: number;
}

export interface VendorAddress {
  barangay?: string;
  municipality?: string;
  latitude?: number;
  longitude?: number;
}

// -----------------------------
// Utils
// -----------------------------
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// -----------------------------
// Find all available riders, scored by distance
// -----------------------------
export const findClosestRiders = async (
  vendorAddress: VendorAddress,
): Promise<Rider[]> => {
  try {
    const { data: riders, error } = await supabase
      .from("rider_profiles")
      .select(
        `
        user_id,
        profiles!inner (
          full_name,
          avatar_url
        ),
        is_available,
        approval_status,
        addresses!inner (
          barangay,
          municipality,
          latitude,
          longitude
        )
      `,
      )
      .eq("is_available", true)
      .eq("approval_status", "approved");

    if (error) throw error;
    if (!riders || riders.length === 0) return [];

    const scoredRiders: Rider[] = riders.map((rider: any) => {
      let score = 0;
      let distance: number | undefined;

      const riderAddress = rider.addresses?.[0] || {};
      const riderProfile = rider.profiles || {};

      if (
        vendorAddress.latitude &&
        vendorAddress.longitude &&
        riderAddress.latitude &&
        riderAddress.longitude
      ) {
        distance = calculateDistance(
          vendorAddress.latitude,
          vendorAddress.longitude,
          riderAddress.latitude,
          riderAddress.longitude,
        );
        score = Math.max(0, 100 - distance);
      } else {
        if (riderAddress.municipality === vendorAddress.municipality)
          score += 10;
        if (riderAddress.barangay === vendorAddress.barangay) score += 20;
      }

      return {
        riderId: rider.user_id,
        name: riderProfile.full_name || "Unknown Rider",
        avatar: riderProfile.avatar_url || null,
        score,
        distance,
        location: `${riderAddress.barangay || "Unknown"}, ${riderAddress.municipality || "Unknown"}`,
        latitude: riderAddress.latitude,
        longitude: riderAddress.longitude,
      };
    });

    scoredRiders.sort((a, b) => {
      if (a.distance && b.distance) return a.distance - b.distance;
      return b.score - a.score;
    });

    return scoredRiders;
  } catch (error) {
    console.error("Error finding closest riders:", error);
    return [];
  }
};

// -----------------------------
// Offer delivery to one rider at a time
// -----------------------------
export const offerDeliveryToRiders = async (
  orderId: string,
  vendorAddress: VendorAddress,
): Promise<void> => {
  const riders = await findClosestRiders(vendorAddress);
  if (!riders || riders.length === 0) {
    console.log("No available riders for this order.");
    return;
  }

  for (const rider of riders) {
    // Insert delivery record for this rider
    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .insert({
        order_id: orderId,
        rider_user_id: rider.riderId,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (deliveryError) {
      console.error("Error creating delivery:", deliveryError);
      continue;
    }

    // Insert initial status history
    await supabase.from("delivery_status_history").insert({
      delivery_id: delivery.delivery_id,
      status: "pending",
      message: `Delivery offer sent to ${rider.name}`,
      created_at: new Date().toISOString(),
    });

    // Update order with delivery_id (first rider only)
    await supabase
      .from("orders")
      .update({ delivery_id: delivery.delivery_id })
      .eq("order_id", orderId);

    // TODO: send push notification to rider
    console.log(`Offer sent to rider: ${rider.name} (${rider.riderId})`);

    // Wait for rider response (should be handled via realtime subscription)
    // If rider rejects, this loop continues to next rider
    break; // Only offer to one rider at a time
  }
};

// -----------------------------
// Realtime listener for rider responses
// -----------------------------
export const subscribeToRiderResponses = (
  orderIds: string[],
  onAccepted: (delivery: any, rider: any) => void,
  onRejected: (delivery: any) => void,
) => {
  const subscription = supabase
    .channel("rider_responses")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "deliveries",
        filter: `order_id=in.(${orderIds.join(",")})`,
      },
      async (payload) => {
        const updatedDelivery = payload.new as any;

        if (updatedDelivery.status === "accepted") {
          const { data: riderData } = await supabase
            .from("rider_profiles")
            .select(`user_id, profiles!inner (full_name, avatar_url)`)
            .eq("user_id", updatedDelivery.rider_user_id)
            .single();

          onAccepted(updatedDelivery, riderData);
        } else if (updatedDelivery.status === "rejected") {
          onRejected(updatedDelivery);
        }
      },
    )
    .subscribe();

  return subscription;
};

// -----------------------------
// Get vendor address from order
// -----------------------------
export const getVendorAddressFromOrder = async (
  orderId: string,
): Promise<VendorAddress | null> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`addresses (barangay, municipality, latitude, longitude)`)
      .eq("order_id", orderId)
      .single();

    if (error) throw error;

    const address = (data as any)?.addresses?.[0];
    if (!address) return null;

    return {
      barangay: address.barangay,
      municipality: address.municipality,
      latitude: address.latitude,
      longitude: address.longitude,
    };
  } catch (error) {
    console.error("Error getting vendor address:", error);
    return null;
  }
};
