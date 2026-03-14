import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/types";

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderDetails extends Order {
  buyerEmail?: string;
  buyerMobile?: string;
  buyerAddress?: string;
  vendorEmail?: string;
  vendorMobile?: string;
  vendorAddress?: string;
  orderItems?: OrderItem[];
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      // Get orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          order_id,
          order_number,
          user_id,
          vendor_user_id,
          total_amount,
          order_status,
          created_at
        `,
        )
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        return [];
      }

      // Get buyer and vendor IDs
      const buyerIds = ordersData.map((o) => o.user_id).filter(Boolean);
      const vendorIds = ordersData.map((o) => o.vendor_user_id).filter(Boolean);

      // Fetch buyer profiles
      const { data: buyersData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", buyerIds);

      const buyerMap = new Map();
      buyersData?.forEach((b) => buyerMap.set(b.user_id, b.full_name));

      // Fetch vendor profiles
      const { data: vendorsData } = await supabase
        .from("vendor_profiles")
        .select("user_id, shop_name")
        .in("user_id", vendorIds);

      const vendorMap = new Map();
      vendorsData?.forEach((v) => vendorMap.set(v.user_id, v.shop_name));

      // Get item counts for each order
      const orderIds = ordersData.map((o) => o.order_id);
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("order_id")
        .in("order_id", orderIds);

      const itemCountMap = new Map();
      itemsData?.forEach((item) => {
        itemCountMap.set(
          item.order_id,
          (itemCountMap.get(item.order_id) || 0) + 1,
        );
      });

      return ordersData.map((order: any) => ({
        id: order.order_id,
        orderNumber: order.order_number || `ORD-${order.order_id.slice(0, 8)}`,
        buyerName: buyerMap.get(order.user_id) || "Unknown",
        vendorName: vendorMap.get(order.vendor_user_id) || "Unknown",
        status: order.order_status || "pending",
        total: Number(order.total_amount || 0),
        items: itemCountMap.get(order.order_id) || 0,
        date: order.created_at
          ? new Date(order.created_at).toLocaleString()
          : "",
      })) as Order[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useOrderDetails(orderId: string | null) {
  return useQuery({
    queryKey: ["orderDetails", orderId],
    queryFn: async () => {
      if (!orderId) return null;

      // Fetch full order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          order_id,
          order_number,
          user_id,
          vendor_user_id,
          total_amount,
          order_status,
          created_at,
          address_id
        `,
        )
        .eq("order_id", orderId)
        .single();

      if (orderError) throw orderError;

      // Fetch buyer details
      const { data: buyerData } = await supabase
        .from("profiles")
        .select("full_name, email, mobile_number")
        .eq("user_id", orderData.user_id)
        .single();

      // Fetch vendor details
      const { data: vendorProfile } = await supabase
        .from("vendor_profiles")
        .select("shop_name, gcash_number, gcash_name, user_id")
        .eq("user_id", orderData.vendor_user_id)
        .single();

      // Fetch vendor email from profiles
      const { data: vendorUserData } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", orderData.vendor_user_id)
        .single();

      // Fetch address
      const { data: addressData } = await supabase
        .from("addresses")
        .select("full_address")
        .eq("address_id", orderData.address_id)
        .single();

      // Fetch order items
      const { data: itemsData } = await supabase
        .from("order_items")
        .select(
          `
          order_item_id,
          quantity,
          unit_price,
          subtotal,
          products (
            product_name
          )
        `,
        )
        .eq("order_id", orderId);

      const orderItems: OrderItem[] = (itemsData || []).map((item: any) => ({
        id: item.order_item_id,
        productName: item.products?.product_name || "Unknown Product",
        quantity: item.quantity || 0,
        unitPrice: Number(item.unit_price || 0),
        subtotal: Number(item.subtotal || 0),
      }));

      return {
        id: orderData.order_id,
        orderNumber:
          orderData.order_number || `ORD-${orderData.order_id.slice(0, 8)}`,
        buyerName: buyerData?.full_name || "Unknown",
        vendorName: vendorProfile?.shop_name || "Unknown",
        status: orderData.order_status || "pending",
        total: Number(orderData.total_amount || 0),
        items: orderItems.length,
        date: orderData.created_at
          ? new Date(orderData.created_at).toLocaleString()
          : "",
        buyerEmail: buyerData?.email,
        buyerMobile: buyerData?.mobile_number,
        buyerAddress: addressData?.full_address,
        vendorEmail: vendorUserData?.email,
        vendorMobile: vendorProfile?.gcash_number,
        vendorAddress: vendorProfile?.gcash_name,
        orderItems: orderItems,
      } as OrderDetails;
    },
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
