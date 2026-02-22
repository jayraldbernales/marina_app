import { supabase } from "@/lib/supabase";

type NearestRider = {
  rider_id: string;
  distance_meters: number;
  vehicle_type: string | null;
  daily_rejection_count: number;
  is_penalized: boolean;
};

class DispatchService {
  // Store active dispatches to prevent garbage collection
  private activeDispatches: Map<string, boolean> = new Map();

  // Store timeouts for pending deliveries
  private pendingTimeouts: Map<string, ReturnType<typeof setTimeout>> =
    new Map();

  // Main function to handle order acceptance
  async handleOrderAcceptance(orderId: string, vendorUserId: string) {
    // Generate a unique dispatch ID
    const dispatchId = `${orderId}-${Date.now()}`;
    this.activeDispatches.set(dispatchId, true);

    try {
      console.log(`🚀 [${dispatchId}] Starting dispatch for order:`, orderId);

      // Step 1: Get order details (without joining addresses)
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("order_id", orderId)
        .eq("vendor_user_id", vendorUserId)
        .single();

      if (orderError || !order) {
        throw new Error("Order not found");
      }

      // Step 2: Get vendor's business address (for pickup location)
      let vendorAddress: {
        latitude: number;
        longitude: number;
        full_address?: string;
        barangay?: string;
      } | null = null;

      const { data: businessAddress, error: addressError } = await supabase
        .from("addresses")
        .select("latitude, longitude, full_address, barangay")
        .eq("user_id", vendorUserId)
        .eq("address_type", "business")
        .maybeSingle();

      if (!addressError && businessAddress) {
        vendorAddress = businessAddress;
        console.log(`[${dispatchId}] Found business address:`, vendorAddress);
      } else {
        console.error(
          `[${dispatchId}] Vendor business address not found:`,
          addressError,
        );

        // Fallback: Try to get any address for the vendor
        const { data: anyAddress } = await supabase
          .from("addresses")
          .select("latitude, longitude")
          .eq("user_id", vendorUserId)
          .maybeSingle();

        if (anyAddress) {
          vendorAddress = {
            latitude: anyAddress.latitude,
            longitude: anyAddress.longitude,
            full_address: "Address not specified",
            barangay: "Unknown",
          };
          console.log(`[${dispatchId}] Using fallback address:`, vendorAddress);
        }
      }

      // Check if we have a valid address with coordinates
      if (
        !vendorAddress ||
        !vendorAddress.latitude ||
        !vendorAddress.longitude
      ) {
        console.error(`[${dispatchId}] No valid vendor address found`);
        throw new Error("Vendor address with valid coordinates not found");
      }

      console.log(`[${dispatchId}] Final vendor address:`, vendorAddress);

      // Step 3: Create delivery record if not exists
      let deliveryId;
      const { data: existingDelivery, error: existingError } = await supabase
        .from("deliveries")
        .select("delivery_id")
        .eq("order_id", orderId)
        .maybeSingle();

      if (existingError) {
        console.error(
          `[${dispatchId}] Error checking existing delivery:`,
          existingError,
        );
      }

      if (!existingDelivery) {
        console.log(`[${dispatchId}] Creating new delivery record`);
        const { data: delivery, error: deliveryError } = await supabase
          .from("deliveries")
          .insert({
            order_id: orderId,
            status: "pending",
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (deliveryError) {
          console.error(
            `[${dispatchId}] Error creating delivery:`,
            deliveryError,
          );
          throw deliveryError;
        }
        deliveryId = delivery.delivery_id;
        console.log(`[${dispatchId}] Created delivery:`, deliveryId);

        const { error: updateError } = await supabase
          .from("orders")
          .update({ delivery_id: deliveryId })
          .eq("order_id", orderId);

        if (updateError) {
          console.error(
            `[${dispatchId}] Error linking delivery to order:`,
            updateError,
          );
        }
      } else {
        deliveryId = existingDelivery.delivery_id;
        console.log(`[${dispatchId}] Using existing delivery:`, deliveryId);
      }

      // Step 4: Find nearest available riders using VENDOR's coordinates
      console.log(`[${dispatchId}] Finding nearest riders near vendor...`);
      const nearestRiders = await this.findNearestRiders(
        vendorAddress.latitude,
        vendorAddress.longitude,
      );

      if (nearestRiders.length === 0) {
        console.log(`⚠️ [${dispatchId}] No riders available nearby`);

        // Update order status to indicate no riders
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            order_status: "finding_rider",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId);

        if (updateError) {
          console.error(
            `[${dispatchId}] Error updating order status:`,
            updateError,
          );
        }

        this.activeDispatches.delete(dispatchId);
        return { success: false, reason: "no_riders" };
      }

      console.log(`[${dispatchId}] Found ${nearestRiders.length} riders`);

      // Step 5: Try to assign a rider
      let assigned = false;
      let lastError = null;

      for (let i = 0; i < nearestRiders.length; i++) {
        const rider = nearestRiders[i];

        console.log(
          `[${dispatchId}] Attempting to assign rider ${i + 1}: ${rider.rider_id}`,
        );

        // Check if this rider is already assigned to another delivery
        const { data: existingAssignment, error: checkError } = await supabase
          .from("deliveries")
          .select("delivery_id")
          .eq("rider_user_id", rider.rider_id)
          .in("status", ["assigned", "picked_up"])
          .maybeSingle();

        if (checkError) {
          console.log(
            `[${dispatchId}] Error checking rider availability:`,
            checkError,
          );
          continue;
        }

        if (existingAssignment) {
          console.log(
            `[${dispatchId}] Rider ${rider.rider_id} already has an active delivery: ${existingAssignment.delivery_id}`,
          );
          continue;
        }

        // Try to assign this rider
        console.log(
          `[${dispatchId}] Updating delivery ${deliveryId} with rider ${rider.rider_id}`,
        );

        const { data: updateData, error: assignError } = await supabase
          .from("deliveries")
          .update({
            rider_user_id: rider.rider_id,
            status: "pending",
            assigned_at: new Date().toISOString(),
            assignment_attempts: i + 1,
            rejected_by: [],
          })
          .eq("delivery_id", deliveryId)
          .select();

        if (assignError) {
          console.log(
            `❌ [${dispatchId}] Failed to assign to rider ${rider.rider_id}:`,
            assignError,
          );
          lastError = assignError;
          continue;
        }

        // Verify the update actually happened
        if (updateData && updateData.length > 0) {
          console.log(
            `✅ [${dispatchId}] Successfully assigned to rider ${rider.rider_id}`,
            updateData[0],
          );

          // Double-check by fetching the delivery directly
          const { data: verifyData } = await supabase
            .from("deliveries")
            .select("rider_user_id, status, assigned_at")
            .eq("delivery_id", deliveryId)
            .single();

          if (verifyData && verifyData.rider_user_id === rider.rider_id) {
            console.log(
              `✅ [${dispatchId}] Verified: Delivery ${deliveryId} now assigned to rider ${rider.rider_id}`,
            );

            // Set timeout for this delivery (3 minutes)
            this.setDeliveryTimeout(deliveryId, rider.rider_id);
          } else {
            console.log(`⚠️ [${dispatchId}] Verification failed:`, verifyData);
          }

          // DO NOT UPDATE ORDER STATUS - leave as "preparing"
          console.log(
            `✅ Order remains in "preparing" status until seller is ready`,
          );

          // Notify rider
          await this.notifyRider(rider.rider_id, deliveryId);

          assigned = true;
          break;
        } else {
          console.log(
            `⚠️ [${dispatchId}] Update succeeded but no data returned for rider ${rider.rider_id}`,
          );

          // Try to fetch the delivery directly to verify
          const { data: verifyData } = await supabase
            .from("deliveries")
            .select("rider_user_id, status, assigned_at")
            .eq("delivery_id", deliveryId)
            .single();

          if (verifyData && verifyData.rider_user_id === rider.rider_id) {
            console.log(
              `✅ [${dispatchId}] Verified: Delivery ${deliveryId} now assigned to rider ${rider.rider_id}`,
            );

            // Set timeout for this delivery (3 minutes)
            this.setDeliveryTimeout(deliveryId, rider.rider_id);

            assigned = true;
            break;
          } else {
            console.log(
              `❌ [${dispatchId}] Verification failed - rider not assigned`,
            );
          }
        }
      }

      if (!assigned) {
        console.log(`⚠️ [${dispatchId}] Could not assign any rider`);
        if (lastError) {
          console.error(`[${dispatchId}] Last error:`, lastError);
        }

        await supabase
          .from("orders")
          .update({
            order_status: "finding_rider",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId);

        this.activeDispatches.delete(dispatchId);
        return {
          success: false,
          reason: "assignment_failed",
          error: lastError,
        };
      }

      this.activeDispatches.delete(dispatchId);
      return {
        success: true,
        deliveryId,
        riderCount: nearestRiders.length,
      };
    } catch (error) {
      console.error(`[${dispatchId}] Error in dispatch:`, error);

      // Ensure order status is updated on error
      try {
        await supabase
          .from("orders")
          .update({
            order_status: "dispatch_failed",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderId);
      } catch (updateError) {
        console.error(
          `[${dispatchId}] Error updating order status after failure:`,
          updateError,
        );
      }

      this.activeDispatches.delete(dispatchId);
      throw error;
    }
  }

  // Set timeout for pending deliveries
  private setDeliveryTimeout(deliveryId: string, riderId: string) {
    // Clear any existing timeout for this delivery
    if (this.pendingTimeouts.has(deliveryId)) {
      clearTimeout(this.pendingTimeouts.get(deliveryId));
      this.pendingTimeouts.delete(deliveryId);
    }

    // Set new timeout (3 minutes = 180000 ms)
    const timeout = setTimeout(
      async () => {
        try {
          console.log(
            `⏰ Timeout triggered for delivery ${deliveryId} (rider ${riderId})`,
          );

          // Check if delivery is still pending and assigned to same rider
          const { data: delivery, error } = await supabase
            .from("deliveries")
            .select("status, rider_user_id")
            .eq("delivery_id", deliveryId)
            .single();

          if (error) {
            console.error("Error checking delivery status:", error);
            return;
          }

          // If still pending and same rider (no response after 3 minutes)
          if (
            delivery?.status === "pending" &&
            delivery?.rider_user_id === riderId
          ) {
            console.log(`Rider ${riderId} didn't respond - auto-rejecting`);

            // Call the v2 database function with timeout reason
            const { error: rpcError } = await supabase.rpc(
              "record_offer_response_v2",
              {
                p_delivery_id: deliveryId,
                p_rider_id: riderId,
                p_accepted: false,
                p_rejection_reason: "timeout",
              },
            );

            if (rpcError) {
              console.error("Error auto-rejecting delivery:", rpcError);
            }

            // Clear from pending timeouts
            this.pendingTimeouts.delete(deliveryId);
          }
        } catch (error) {
          console.error("Error in timeout handler:", error);
        }
      },
      3 * 60 * 1000,
    ); // 3 minutes

    this.pendingTimeouts.set(deliveryId, timeout);
    console.log(`⏰ Timeout set for delivery ${deliveryId} (3 minutes)`);
  }

  // Clear timeout when rider responds
  async clearDeliveryTimeout(deliveryId: string) {
    if (this.pendingTimeouts.has(deliveryId)) {
      clearTimeout(this.pendingTimeouts.get(deliveryId));
      this.pendingTimeouts.delete(deliveryId);
      console.log(`✅ Timeout cleared for delivery ${deliveryId}`);
    }
  }

  // Check for stuck deliveries on startup
  async checkStuckDeliveries() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data: stuckDeliveries, error } = await supabase
        .from("deliveries")
        .select("delivery_id, rider_user_id")
        .eq("status", "pending")
        .not("rider_user_id", "is", null)
        .lt("assigned_at", fiveMinutesAgo); // Older than 5 minutes

      if (error) {
        console.error("Error checking stuck deliveries:", error);
        return;
      }

      for (const delivery of stuckDeliveries || []) {
        console.log(
          `Found stuck delivery ${delivery.delivery_id}, auto-rejecting`,
        );

        await supabase.rpc("record_offer_response_v2", {
          p_delivery_id: delivery.delivery_id,
          p_rider_id: delivery.rider_user_id,
          p_accepted: false,
          p_rejection_reason: "system_timeout",
        });
      }
    } catch (error) {
      console.error("Error in checkStuckDeliveries:", error);
    }
  }

  // Find nearest available riders
  async findNearestRiders(lat: number, lng: number): Promise<NearestRider[]> {
    try {
      console.log("🔍 Finding nearest riders at:", lat, lng);

      // Validate coordinates
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        console.log("⚠️ Invalid coordinates, cannot find nearby riders");
        return [];
      }

      // Try with increasing radius if no riders found
      const radii = [5, 10, 20, 50];

      for (const radius of radii) {
        console.log(`Trying radius: ${radius}km`);

        const { data: riders, error } = await supabase.rpc(
          "get_nearest_riders",
          {
            p_restaurant_lat: lat,
            p_restaurant_lng: lng,
            p_radius_km: radius,
            p_limit: 10,
            p_exclude_ids: [],
          },
        );

        if (error) {
          console.error(`Error with radius ${radius}km:`, error);
          continue;
        }

        if (riders && riders.length > 0) {
          console.log(`✅ Found ${riders.length} riders within ${radius}km`);
          return riders;
        }
      }

      // If still no riders, check if any riders exist at all
      const { count, error: countError } = await supabase
        .from("rider_profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_available", true)
        .eq("approval_status", "approved")
        .not("current_lat", "is", null);

      if (countError) {
        console.error("Error counting riders:", countError);
      } else {
        console.log(`📊 Total available riders with location: ${count}`);
      }

      return [];
    } catch (error) {
      console.error("Error in findNearestRiders:", error);
      return [];
    }
  }

  // Simple notification
  async notifyRider(riderId: string, deliveryId: string) {
    console.log(`🔔 Notify rider ${riderId} about delivery ${deliveryId}`);
    // TODO: Implement push notifications
  }

  // Get rider assignment for an order - FIXED with type assertions
  async getRiderAssignment(orderId: string) {
    const { data, error } = await supabase
      .from("deliveries")
      .select(
        `
      rider_user_id,
      status,
      assigned_at,
      rider_profiles!inner(
        vehicle_type,
        profiles!inner(
          full_name,
          avatar_url
        )
      )
    `,
      )
      .eq("order_id", orderId)
      .not("rider_user_id", "is", null)
      .maybeSingle();

    if (error) {
      console.error("Error fetching rider assignment:", error);
      return null;
    }

    if (!data) {
      console.log("No rider assignment found for order:", orderId);
      return null;
    }

    // Safe access with type assertions
    const riderProfiles = (data as any).rider_profiles;
    const riderProfile = Array.isArray(riderProfiles)
      ? riderProfiles[0]
      : riderProfiles;

    // Safe access to profiles
    const profiles = riderProfile?.profiles;
    const profileData = Array.isArray(profiles) ? profiles[0] : profiles;

    return {
      id: data.rider_user_id,
      name: profileData?.full_name || "Rider",
      avatar: profileData?.avatar_url || null,
      status: data.status,
      vehicle: riderProfile?.vehicle_type || null,
    };
  }

  // Check if an order has a rider assigned
  async hasRiderAssignment(orderId: string): Promise<boolean> {
    const { data } = await supabase
      .from("deliveries")
      .select("rider_user_id")
      .eq("order_id", orderId)
      .not("rider_user_id", "is", null)
      .maybeSingle();

    return !!data;
  }
}

export const dispatchService = new DispatchService();

// Run stuck delivery check on startup
setTimeout(() => {
  dispatchService.checkStuckDeliveries();
}, 5000);
