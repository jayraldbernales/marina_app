import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Vendor } from "@/types";

export interface VendorWithBan extends Vendor {
  shopBanned?: boolean;
  ownerName?: string;
  mobileNumber?: string;
  businessAddress?: string;
}

export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      // Get all vendor profiles with their associated user profile data
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select(
          `
          user_id,
          shop_name,
          banned,
          created_at,
          profiles!vendor_profiles_user_id_fkey (
            email,
            full_name,
            mobile_number
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get product counts for each vendor
      const vendorIds = data?.map((v) => v.user_id) || [];
      let productCounts = new Map();

      if (vendorIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("vendor_user_id")
          .in("vendor_user_id", vendorIds);

        products?.forEach((p) => {
          productCounts.set(
            p.vendor_user_id,
            (productCounts.get(p.vendor_user_id) || 0) + 1,
          );
        });
      }

      // Get sales data for each vendor (only delivered orders)
      const { data: sales } = await supabase
        .from("orders")
        .select("vendor_user_id, total_amount")
        .eq("order_status", "delivered")
        .in("vendor_user_id", vendorIds);

      const salesMap = new Map();
      sales?.forEach((order) => {
        salesMap.set(
          order.vendor_user_id,
          (salesMap.get(order.vendor_user_id) || 0) +
            Number(order.total_amount || 0),
        );
      });

      // Get business addresses for each vendor
      const addressesMap = new Map();
      if (vendorIds.length > 0) {
        const { data: addresses } = await supabase
          .from("addresses")
          .select("user_id, full_address")
          .in("user_id", vendorIds)
          .eq("address_type", "business");

        addresses?.forEach((addr) => {
          addressesMap.set(addr.user_id, addr.full_address);
        });
      }

      return (data || []).map((vendor: any) => {
        // profiles is an array, get the first item
        const profile =
          Array.isArray(vendor.profiles) && vendor.profiles.length > 0
            ? vendor.profiles[0]
            : { email: "", full_name: "", mobile_number: "" };

        return {
          id: vendor.user_id,
          name: vendor.shop_name || "Unnamed Shop",
          email: profile?.email || "",
          mobileNumber: profile?.mobile_number,
          ownerName: profile?.full_name,
          status: vendor.banned ? "banned" : "active",
          productCount: productCounts.get(vendor.user_id) || 0,
          joinedDate: vendor.created_at
            ? new Date(vendor.created_at).toLocaleDateString()
            : "",
          totalSales: salesMap.get(vendor.user_id) || 0,
          shopBanned: vendor.banned,
          businessAddress:
            addressesMap.get(vendor.user_id) || "No business address set",
        };
      }) as VendorWithBan[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useVendorDetails(vendorId: string | null) {
  return useQuery({
    queryKey: ["vendorDetails", vendorId],
    queryFn: async () => {
      if (!vendorId) return null;

      // Get vendor profile with user data
      const { data: vendor, error } = await supabase
        .from("vendor_profiles")
        .select(
          `
          user_id,
          shop_name,
          banned,
          created_at,
          profiles!vendor_profiles_user_id_fkey (
            email,
            full_name,
            mobile_number
          )
        `,
        )
        .eq("user_id", vendorId)
        .single();

      if (error) throw error;

      // Get product count
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("vendor_user_id", vendorId);

      // Get total sales
      const { data: sales } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("vendor_user_id", vendorId)
        .eq("order_status", "delivered");

      const totalSales =
        sales?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Get business address
      const { data: address } = await supabase
        .from("addresses")
        .select("full_address")
        .eq("user_id", vendorId)
        .eq("address_type", "business")
        .maybeSingle();

      // profiles is an array, get the first item
      const profile =
        Array.isArray(vendor.profiles) && vendor.profiles.length > 0
          ? vendor.profiles[0]
          : { email: "", full_name: "", mobile_number: "" };

      return {
        id: vendor.user_id,
        name: vendor.shop_name || "Unnamed Shop",
        email: profile?.email || "",
        mobileNumber: profile?.mobile_number,
        ownerName: profile?.full_name,
        status: vendor.banned ? "banned" : "active",
        productCount: productCount || 0,
        joinedDate: vendor.created_at
          ? new Date(vendor.created_at).toLocaleDateString()
          : "",
        totalSales,
        shopBanned: vendor.banned,
        businessAddress: address?.full_address || "No business address set",
      } as VendorWithBan;
    },
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useBanVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      banned,
    }: {
      vendorId: string;
      banned: boolean;
    }) => {
      const { error } = await supabase
        .from("vendor_profiles")
        .update({ banned })
        .eq("user_id", vendorId);

      if (error) throw error;
      return { vendorId, banned };
    },
    onSuccess: (data) => {
      // Update vendors list cache
      queryClient.setQueryData(
        ["vendors"],
        (oldData: VendorWithBan[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((vendor) => {
            if (vendor.id === data.vendorId) {
              const newStatus = data.banned ? "banned" : "active";
              return {
                ...vendor,
                status: newStatus,
                shopBanned: data.banned,
              };
            }
            return vendor;
          });
        },
      );

      // Update vendor details cache if it exists
      queryClient.setQueryData(
        ["vendorDetails", data.vendorId],
        (oldData: VendorWithBan | undefined) => {
          if (!oldData) return oldData;
          const newStatus = data.banned ? "banned" : "active";
          return {
            ...oldData,
            status: newStatus,
            shopBanned: data.banned,
          };
        },
      );
    },
  });
}
