import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DashboardStats, ChartData, Order, Vendor } from "@/types";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      // Counts
      const [profilesRes, vendorsRes, ridersRes, ordersRes, completedRes] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase
            .from("vendor_profiles")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("rider_profiles")
            .select("*", { count: "exact", head: true }),
          supabase.from("orders").select("*", { count: "exact", head: true }),
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("order_status", "delivered"),
        ]);

      const totalUsers = profilesRes.count || 0;
      const totalVendors = vendorsRes.count || 0;
      const totalRiders = ridersRes.count || 0;
      const totalOrders = ordersRes.count || 0;
      const completedTransactions = completedRes.count || 0;

      const buyerRes = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "user");
      const buyerCount = buyerRes.count || 0;

      const stats: DashboardStats = {
        totalUsers,
        totalVendors,
        totalOrders,
        completedTransactions,
        buyerCount,
        riderCount: totalRiders,
      };

      // Weekly aggregates (last 7 days)
      const d = new Date();
      const since = new Date();
      since.setDate(d.getDate() - 6);
      since.setHours(0, 0, 0, 0);

      const { data: weeklyOrders } = await supabase
        .from("orders")
        .select("created_at, total_amount")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      const days: Record<string, { orders: number; sales: number }> = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(since);
        date.setDate(since.getDate() + i);
        const label = date.toLocaleDateString(undefined, {
          weekday: "short",
        });
        days[label] = { orders: 0, sales: 0 };
      }

      if (weeklyOrders) {
        weeklyOrders.forEach((o: any) => {
          const date = new Date(o.created_at);
          const label = date.toLocaleDateString(undefined, {
            weekday: "short",
          });
          if (days[label]) {
            days[label].orders += 1;
            days[label].sales += Number(o.total_amount || 0);
          }
        });
      }

      const weeklyData: ChartData[] = Object.keys(days).map((k) => ({
        name: k,
        orders: days[k].orders,
        sales: days[k].sales,
      }));

      // Recent Orders
      const { data: ordersData } = await supabase
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
        .order("created_at", { ascending: false })
        .limit(5);

      let recentOrders: Order[] = [];
      if (ordersData && ordersData.length > 0) {
        const buyerIds = ordersData.map((o) => o.user_id).filter(Boolean);
        const vendorIds = ordersData
          .map((o) => o.vendor_user_id)
          .filter(Boolean);

        // Fetch buyer names
        let buyerMap = new Map();
        if (buyerIds.length > 0) {
          const { data: buyers } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", buyerIds);

          buyerMap = new Map(
            buyers?.map((b) => [b.user_id, b.full_name]) || [],
          );
        }

        // Fetch vendor shop names
        let vendorMap = new Map();
        if (vendorIds.length > 0) {
          const { data: vendors } = await supabase
            .from("vendor_profiles")
            .select("user_id, shop_name")
            .in("user_id", vendorIds);

          vendorMap = new Map(
            vendors?.map((v) => [v.user_id, v.shop_name]) || [],
          );
        }

        // Get item counts
        const orderIds = ordersData.map((o) => o.order_id);
        let itemCountMap = new Map();

        if (orderIds.length > 0) {
          const { data: orderItems } = await supabase
            .from("order_items")
            .select("order_id")
            .in("order_id", orderIds);

          orderItems?.forEach((item) => {
            itemCountMap.set(
              item.order_id,
              (itemCountMap.get(item.order_id) || 0) + 1,
            );
          });
        }

        recentOrders = ordersData.map((o: any) => ({
          id: o.order_id,
          orderNumber: o.order_number || "N/A",
          buyerName: buyerMap.get(o.user_id) || "Unknown",
          vendorName: vendorMap.get(o.vendor_user_id) || "Unknown",
          status: o.order_status || "pending",
          total: Number(o.total_amount || 0),
          items: itemCountMap.get(o.order_id) || 0,
          date: o.created_at
            ? new Date(o.created_at).toLocaleString()
            : "Unknown",
        }));
      }

      // Top Vendors
      const { data: vendorsList } = await supabase.from("vendor_profiles")
        .select(`
          user_id,
          shop_name,
          created_at
        `);

      let topVendors: Vendor[] = [];
      if (vendorsList && vendorsList.length > 0) {
        // Get product counts
        const { data: products } = await supabase
          .from("products")
          .select("vendor_user_id");

        const productCounts = new Map<string, number>();
        (products || []).forEach((p: any) => {
          productCounts.set(
            p.vendor_user_id,
            (productCounts.get(p.vendor_user_id) || 0) + 1,
          );
        });

        // Get sales data
        const { data: salesData } = await supabase
          .from("orders")
          .select("vendor_user_id, total_amount")
          .eq("order_status", "delivered");

        const salesMap = new Map<string, number>();
        (salesData || []).forEach((o: any) => {
          const vid = o.vendor_user_id;
          if (vid) {
            salesMap.set(
              vid,
              (salesMap.get(vid) || 0) + Number(o.total_amount || 0),
            );
          }
        });

        // Get emails from profiles
        const vendorIds = vendorsList.map((v) => v.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, email")
          .in("user_id", vendorIds);

        const emailMap = new Map(
          profiles?.map((p) => [p.user_id, p.email]) || [],
        );

        const vendorsMapped: Vendor[] = vendorsList.map((v: any) => ({
          id: v.user_id,
          name: v.shop_name || "Unnamed Shop",
          email: emailMap.get(v.user_id) || "",
          status: "active",
          productCount: productCounts.get(v.user_id) || 0,
          joinedDate: v.created_at
            ? new Date(v.created_at).toLocaleDateString()
            : "",
          totalSales: salesMap.get(v.user_id) || 0,
        }));

        // Sort by total sales and take top 5
        topVendors = vendorsMapped
          .sort((a, b) => b.totalSales - a.totalSales)
          .slice(0, 5);
      }

      return {
        stats,
        weeklyData,
        recentOrders,
        topVendors,
      };
    },
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}
