import { supabase } from "../lib/supabase";
import * as FileSystem from "expo-file-system";

export type DeliveryItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  vendor: string;
  image: any;
};

export type DatabaseDeliveryStatus =
  | "pending"
  | "assigned"
  | "ready_to_pickup"
  | "picked_up"
  | "delivered"
  | "failed"
  | "cancelled"
  | "rejected";

export type UITabStatus =
  | "to-pickup"
  | "in-transit"
  | "delivered"
  | "failed"
  | "canceled";

export type DeliveryStatus = DatabaseDeliveryStatus;

export type Delivery = {
  id: string;
  order_id: string;
  order_number: string;
  items: DeliveryItem[];
  status: DatabaseDeliveryStatus;
  total_amount: number;
  delivery_fee?: number;
  subtotal?: number;
  scheduled_date: string;
  delivery_address: string;
  vendor_address: string;
  vendor_name: string;
  vendor_lat?: number;
  vendor_lng?: number;
  customer_lat?: number;
  customer_lng?: number;
  created_at: string;
  assigned_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  rejection_count?: number;
  assignment_attempts?: number;
  pickup_proof_url?: string;
  delivered_proof_url?: string;
  customer_name?: string;
  customer_phone?: string;
  vendor_phone?: string;
};

class DeliveryService {
  // Get deliveries for a rider
  async getRiderDeliveries(riderId: string): Promise<Delivery[]> {
    // Check if we're properly authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Also check what the database sees
    const { data: userData, error: userError } =
      await supabase.rpc("get_auth_uid");

    // STEP 1: First, just get the deliveries without the join to see if RLS is working
    const { data: rawDeliveries, error: rawError } = await supabase
      .from("deliveries")
      .select("*")
      .eq("rider_user_id", riderId);

    // STEP 2: Now try the full query with join
    const { data: deliveries, error } = await supabase
      .from("deliveries")
      .select(
        `
        *,
        orders!fk_delivery_order(
          order_id,
          order_number,
          total_amount,
          delivery_fee,
          created_at,
          user_id,
          vendor_user_id,
          address_id,
          addresses!orders_address_fkey(
            full_address,
            latitude,
            longitude
          ),
          vendor_profiles!orders_vendor_fkey(
            shop_name,
            user_id
          ),
          order_items(
            quantity,
            unit_price,
            products(
              product_id,
              product_name,
              images
            )
          )
        )
      `,
      )
      .eq("rider_user_id", riderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching deliveries with join:", error);
      return [];
    }

    return this.formatDeliveries(deliveries);
  }

  async getAvailableDeliveries() {
    const { data, error } = await supabase
      .from("deliveries")
      .select(
        `
        *,
        orders!fk_delivery_order(
          order_id,
          order_number,
          total_amount,
          delivery_fee,
          created_at,
          user_id,
          vendor_user_id,
          address_id,
          addresses!orders_address_fkey(
            full_address,
            latitude,
            longitude
          ),
          vendor_profiles!orders_vendor_fkey(
            shop_name,
            user_id
          ),
          order_items(
            quantity,
            unit_price,
            products(
              product_id,
              product_name,
              images
            )
          )
        )
      `,
      )
      .is("rider_user_id", null)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return this.formatDeliveries(data || []);
  }

  // Respond to a delivery offer - FIXED to always use v2
  async respondToOffer(
    deliveryId: string,
    riderId: string,
    accepted: boolean,
    rejectionReason?: string,
  ) {
    // ALWAYS use v2 for ALL responses (accept, reject, timeout)
    const functionName = "record_offer_response_v2";

    console.log("Calling v2 function:", {
      deliveryId,
      riderId,
      accepted,
      rejectionReason,
    });

    const { data, error } = await supabase.rpc(functionName, {
      p_delivery_id: deliveryId,
      p_rider_id: riderId,
      p_accepted: accepted,
      p_rejection_reason: rejectionReason,
    });

    if (error) {
      console.error("RPC Error:", error);
      throw error;
    }

    // Clear timeout if this is a response from a rider
    if (!rejectionReason?.includes("timeout")) {
      try {
        // Dynamic import to avoid circular dependency
        const { dispatchService } = await import("./dispatchService");
        await dispatchService.clearDeliveryTimeout(deliveryId);
      } catch (importError) {
        console.log("Could not import dispatchService for timeout clearing");
      }
    }

    return data;
  }

  // Upload image to Supabase Storage
  async uploadProofImage(
    uri: string,
    deliveryId: string,
    riderId: string,
    type: "pickup" | "delivery",
  ): Promise<string> {
    try {
      // Create filename with path structure: delivery-proofs/{riderId}/{type}-proof-{deliveryId}-{timestamp}.jpg
      const fileName = `${type}-proof-${deliveryId}-${Date.now()}.jpg`;
      const filePath = `${riderId}/${fileName}`;

      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to binary
      const binaryData = atob(base64);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from("delivery-proofs")
        .upload(filePath, bytes, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicData } = supabase.storage
        .from("delivery-proofs")
        .getPublicUrl(filePath);

      console.log(`Upload successful: ${publicData.publicUrl}`);
      return publicData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  // Confirm pickup with proof photo
  async confirmPickupWithProof(
    deliveryId: string,
    orderId: string,
    imageUrl: string,
  ) {
    try {
      console.log(`Confirming pickup for delivery ${deliveryId}`);

      // Update deliveries table
      const { error: deliveryError } = await supabase
        .from("deliveries")
        .update({
          pickup_proof_url: imageUrl,
          status: "picked_up",
          pickup_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("delivery_id", deliveryId);

      if (deliveryError) throw deliveryError;

      // Update order status to shipped
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          order_status: "shipped",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (orderError) throw orderError;

      console.log(`Pickup confirmed for delivery ${deliveryId}`);
    } catch (error) {
      console.error("Error confirming pickup:", error);
      throw error;
    }
  }

  // Confirm delivery with proof photo
  async confirmDeliveryWithProof(
    deliveryId: string,
    orderId: string,
    riderId: string,
    imageUrl: string,
  ) {
    try {
      // Update deliveries table
      const { error: deliveryError } = await supabase
        .from("deliveries")
        .update({
          delivered_proof_url: imageUrl,
          status: "delivered",
          delivered_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("delivery_id", deliveryId);

      if (deliveryError) throw deliveryError;

      // Update order status to delivered
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          order_status: "delivered",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (orderError) throw orderError;

      // Set rider back to AVAILABLE when delivery is completed
      const { error: riderError } = await supabase
        .from("rider_profiles")
        .update({
          is_available: true,
        })
        .eq("user_id", riderId);

      if (riderError) throw riderError;
    } catch (error) {
      console.error("Error confirming delivery:", error);
      throw error;
    }
  }
  // Add this method to your DeliveryService class
  async failDelivery(
    deliveryId: string,
    orderId: string,
    riderId: string,
    reason: string,
  ) {
    try {
      console.log(`Failing delivery ${deliveryId} with reason: ${reason}`);

      // Update deliveries table to failed status
      const { error: deliveryError } = await supabase
        .from("deliveries")
        .update({
          status: "failed",
          failure_reason: reason,
          failure_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("delivery_id", deliveryId);

      if (deliveryError) throw deliveryError;

      // Update order status to failed
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          order_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (orderError) throw orderError;

      // Set rider back to AVAILABLE
      const { error: riderError } = await supabase
        .from("rider_profiles")
        .update({
          is_available: true,
        })
        .eq("user_id", riderId);

      if (riderError) throw riderError;

      console.log(`Delivery ${deliveryId} marked as failed`);
      return { success: true };
    } catch (error) {
      console.error("Error failing delivery:", error);
      throw error;
    }
  }
  // Update delivery status - kept for backward compatibility
  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    additionalData?: any,
  ) {
    const updates: any = { status };

    if (status === "picked_up") {
      updates.pickup_time = new Date().toISOString();

      // Get the order_id for this delivery
      const { data: delivery } = await supabase
        .from("deliveries")
        .select("order_id")
        .eq("delivery_id", deliveryId)
        .single();

      if (delivery) {
        // Update order status to shipped when picked up
        await supabase
          .from("orders")
          .update({
            order_status: "shipped",
          })
          .eq("order_id", delivery.order_id);
      }
    } else if (status === "delivered") {
      updates.delivered_time = new Date().toISOString();

      // Get the order_id and rider_user_id for this delivery
      const { data: delivery } = await supabase
        .from("deliveries")
        .select("order_id, rider_user_id")
        .eq("delivery_id", deliveryId)
        .single();

      if (delivery) {
        // Update order status to delivered
        await supabase
          .from("orders")
          .update({
            order_status: "delivered",
          })
          .eq("order_id", delivery.order_id);

        // Set rider back to AVAILABLE when delivery is completed
        if (delivery.rider_user_id) {
          await supabase
            .from("rider_profiles")
            .update({
              is_available: true,
            })
            .eq("user_id", delivery.rider_user_id);
        }
      }
    } else if (status === "failed" || status === "cancelled") {
      // Also handle failed/cancelled deliveries - set rider back to available
      const { data: delivery } = await supabase
        .from("deliveries")
        .select("rider_user_id, order_id")
        .eq("delivery_id", deliveryId)
        .single();

      if (delivery) {
        // Update order status to failed/cancelled
        await supabase
          .from("orders")
          .update({
            order_status: status,
          })
          .eq("order_id", delivery.order_id);

        if (delivery.rider_user_id) {
          await supabase
            .from("rider_profiles")
            .update({
              is_available: true,
            })
            .eq("user_id", delivery.rider_user_id);
        }
      }
    }

    const { error } = await supabase
      .from("deliveries")
      .update(updates)
      .eq("delivery_id", deliveryId);

    if (error) throw error;
  }

  // Get vendor business address
  private async getVendorBusinessAddress(vendorUserId: string) {
    if (!vendorUserId) return null;

    const { data, error } = await supabase
      .from("addresses")
      .select("full_address, latitude, longitude")
      .eq("user_id", vendorUserId)
      .eq("address_type", "business")
      .maybeSingle();

    if (error) {
      console.error("Error fetching vendor address:", error);
      return null;
    }
    return data;
  }

  // Format deliveries from database to match your UI
  private async formatDeliveries(data: any[]): Promise<Delivery[]> {
    const formattedDeliveries = [];

    for (const d of data) {
      const order = d.orders;

      if (!order) {
        console.warn("Delivery has no order:", d.delivery_id);
        continue;
      }

      // Get customer address from the order's address_id
      const customerAddress = order.addresses || {
        full_address: "",
        latitude: null,
        longitude: null,
      };

      // Get vendor business address
      const vendorAddress = await this.getVendorBusinessAddress(
        order.vendor_user_id,
      );

      // Get customer profile for name and phone
      const { data: customerProfile } = await supabase
        .from("profiles")
        .select("full_name, mobile_number")
        .eq("user_id", order.user_id)
        .single();

      // Get vendor's mobile number from profiles table
      const { data: vendorUserProfile } = await supabase
        .from("profiles")
        .select("mobile_number")
        .eq("user_id", order.vendor_user_id)
        .single();

      // Get order items - now from order.order_items
      const orderItems = order.order_items || [];

      // Calculate subtotal from items
      const itemsSubtotal = orderItems.reduce(
        (sum: number, item: any) =>
          sum + (item.unit_price || 0) * (item.quantity || 0),
        0,
      );

      const items = orderItems.map((item: any) => {
        const images = item.products?.images || [];
        const imageSource =
          images.length > 0 && images[0]
            ? { uri: images[0] }
            : require("@/assets/img/mayamaya.jpg");

        return {
          id: item.products?.product_id || "",
          name: item.products?.product_name || "Product",
          price: item.unit_price || 0,
          quantity: item.quantity || 1,
          vendor: order.vendor_profiles?.shop_name || "Vendor",
          image: imageSource,
        };
      });

      formattedDeliveries.push({
        id: d.delivery_id,
        order_id: d.order_id,
        order_number: order.order_number || "",
        items,
        status: d.status,
        total_amount: order.total_amount || 0,
        delivery_fee: order.delivery_fee || 0,
        subtotal: itemsSubtotal,
        scheduled_date: new Date(d.created_at).toLocaleDateString(),
        delivery_address: customerAddress.full_address || "",
        vendor_address: vendorAddress?.full_address || "",
        vendor_name: order.vendor_profiles?.shop_name || "",
        vendor_lat: vendorAddress?.latitude,
        vendor_lng: vendorAddress?.longitude,
        customer_lat: customerAddress.latitude,
        customer_lng: customerAddress.longitude,
        created_at: d.created_at,
        assigned_at: d.assigned_at,
        picked_up_at: d.pickup_time,
        delivered_at: d.delivered_time,
        rejection_count: d.rejection_count,
        assignment_attempts: d.assignment_attempts,
        pickup_proof_url: d.pickup_proof_url,
        delivered_proof_url: d.delivered_proof_url,
        // Contact information
        customer_name: customerProfile?.full_name || "Customer",
        customer_phone: customerProfile?.mobile_number || "No phone",
        vendor_phone: vendorUserProfile?.mobile_number || "No phone",
      });
    }

    return formattedDeliveries;
  }

  // Subscribe to real-time updates for a delivery
  subscribeToDelivery(deliveryId: string, callback: (delivery: any) => void) {
    return supabase
      .channel(`delivery-${deliveryId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "deliveries",
          filter: `delivery_id=eq.${deliveryId}`,
        },
        (payload) => callback(payload.new),
      )
      .subscribe();
  }
}

export const deliveryService = new DeliveryService();
