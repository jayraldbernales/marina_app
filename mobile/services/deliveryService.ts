import { supabase } from "../lib/supabase";

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
};

class DeliveryService {
  // Get deliveries for a rider
  // Get deliveries for a rider
  async getRiderDeliveries(riderId: string): Promise<Delivery[]> {
    // Check if we're properly authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    console.log("Session exists:", !!session);
    console.log("Session user ID:", session?.user?.id);
    console.log("Rider ID passed:", riderId);
    console.log("Match?", session?.user?.id === riderId);

    // Also check what the database sees
    const { data: userData, error: userError } =
      await supabase.rpc("get_auth_uid");
    console.log("Database auth.uid():", userData);
    console.log("🔍 Fetching deliveries for rider:", riderId);

    // STEP 1: First, just get the deliveries without the join to see if RLS is working
    const { data: rawDeliveries, error: rawError } = await supabase
      .from("deliveries")
      .select("*")
      .eq("rider_user_id", riderId);

    console.log("📦 Raw deliveries found:", rawDeliveries?.length || 0);
    if (rawDeliveries && rawDeliveries.length > 0) {
      console.log("First raw delivery:", rawDeliveries[0]);
    } else {
      console.log("❌ No raw deliveries found for rider:", riderId);
    }

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
      console.error("❌ Error fetching deliveries with join:", error);
      return [];
    }

    console.log("📦 Joined deliveries count:", deliveries?.length || 0);
    if (deliveries && deliveries.length > 0) {
      console.log("First joined delivery:", deliveries[0]);
      console.log("Has orders data?", !!deliveries[0].orders);
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

  // Respond to a delivery offer
  async respondToOffer(
    deliveryId: string,
    riderId: string,
    accepted: boolean,
    rejectionReason?: string,
  ) {
    const { data, error } = await supabase.rpc("record_offer_response", {
      p_delivery_id: deliveryId,
      p_rider_id: riderId,
      p_accepted: accepted,
      p_rejection_reason: rejectionReason,
    });

    if (error) throw error;
    return data;
  }

  // Update delivery status
  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    additionalData?: any,
  ) {
    const updates: any = { status };

    if (status === "picked_up") {
      updates.pickup_time = new Date().toISOString();
    } else if (status === "delivered") {
      updates.delivered_time = new Date().toISOString();

      // Get the order_id for this delivery
      const { data: delivery } = await supabase
        .from("deliveries")
        .select("order_id")
        .eq("delivery_id", deliveryId)
        .single();

      if (delivery) {
        // Update order status to delivered
        await supabase
          .from("orders")
          .update({
            order_status: "delivered",
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", delivery.order_id);
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

      // Get order items - now from order.order_items
      const orderItems = order.order_items || [];

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
