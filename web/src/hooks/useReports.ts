import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TrendingUp, ShoppingCart, Store, Bike } from "lucide-react";
export interface ProductSales {
  name: string;
  sales: number;
  revenue: number;
}

export interface VendorPerformance {
  id: string;
  name: string;
  status: string;
  productCount: number;
  totalSales: number;
}

export interface RiderPerformance {
  id: string;
  name: string;
  totalDeliveries: number;
  completedDeliveries: number;
  avgDeliveryTime?: number;
  rating?: number;
  status: string;
}

export interface SummaryStat {
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: any;
}

export interface QuickStats {
  totalBuyers: number;
  totalVendors: number;
  totalRiders: number;
  activeRiders: number;
  completionRate: number;
  growthRate: number;
  avgDeliveryTime: number;
}

export interface ChartDataPoint {
  name: string;
  orders: number;
  sales: number;
}

interface DateRange {
  start: string;
  end: string;
}

const getDateRange = (period: string): DateRange => {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case "weekly":
      start.setDate(now.getDate() - 7);
      break;
    case "monthly":
      start.setMonth(now.getMonth() - 1);
      break;
    case "yearly":
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
  }

  return {
    start: start.toISOString(),
    end: now.toISOString(),
  };
};

const fetchSummaryStats = async (
  dateRange: DateRange,
): Promise<SummaryStat[]> => {
  // Get current period data
  const { data: currentOrders } = await supabase
    .from("orders")
    .select("total_amount, order_status")
    .gte("created_at", dateRange.start)
    .lte("created_at", dateRange.end);

  // Get previous period data for comparison
  const prevStart = new Date(dateRange.start);
  const diff =
    new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime();
  prevStart.setTime(prevStart.getTime() - diff);

  const { data: previousOrders } = await supabase
    .from("orders")
    .select("total_amount")
    .gte("created_at", prevStart.toISOString())
    .lt("created_at", dateRange.start);

  // Calculate totals
  const totalRevenue =
    currentOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) ||
    0;
  const prevRevenue =
    previousOrders?.reduce(
      (sum, order) => sum + (order.total_amount || 0),
      0,
    ) || 0;

  const totalOrders = currentOrders?.length || 0;
  const prevOrders = previousOrders?.length || 0;

  // Get active vendors count
  const { count: activeVendors } = await supabase
    .from("vendor_profiles")
    .select("*", { count: "exact", head: true })
    .eq("approval_status", "approved");

  // Get active riders count
  const { count: activeRiders } = await supabase
    .from("rider_profiles")
    .select("*", { count: "exact", head: true })
    .eq("approval_status", "approved")
    .eq("is_available", true);

  const getChangeType = (
    current: number,
    previous: number,
  ): "positive" | "negative" | "neutral" => {
    if (current > previous) return "positive";
    if (current < previous) return "negative";
    return "neutral";
  };

  const calculatePercentChange = (
    current: number,
    previous: number,
  ): string => {
    if (previous === 0) return "+0%";
    const change = ((current - previous) / previous) * 100;
    return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  return [
    {
      label: "Total Revenue",
      value: `₱${totalRevenue.toLocaleString()}`,
      change: calculatePercentChange(totalRevenue, prevRevenue),
      changeType: getChangeType(totalRevenue, prevRevenue),
      icon: TrendingUp,
    },
    {
      label: "Total Orders",
      value: totalOrders.toLocaleString(),
      change: calculatePercentChange(totalOrders, prevOrders),
      changeType: getChangeType(totalOrders, prevOrders),
      icon: ShoppingCart,
    },
    {
      label: "Active Vendors",
      value: (activeVendors || 0).toString(),
      change: "+0",
      changeType: "neutral" as const,
      icon: Store,
    },
    {
      label: "Active Riders",
      value: (activeRiders || 0).toString(),
      change: "+0",
      changeType: "neutral" as const,
      icon: Bike,
    },
  ];
};

const fetchTopProducts = async (
  dateRange: DateRange,
): Promise<ProductSales[]> => {
  try {
    const { data: orders } = await supabase
      .from("orders")
      .select("order_id")
      .eq("order_status", "delivered")
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end);

    if (!orders || orders.length === 0) return [];

    const orderIds = orders.map((o) => o.order_id);

    const { data: orderItems } = await supabase
      .from("order_items")
      .select(
        `
        quantity,
        unit_price,
        products (
          product_name
        )
      `,
      )
      .in("order_id", orderIds);

    const productMap = new Map<
      string,
      { name: string; sales: number; revenue: number }
    >();

    orderItems?.forEach((item: any) => {
      const productName = item.products?.product_name || "Unknown Product";
      const quantity = item.quantity || 0;
      const revenue = (item.unit_price || 0) * quantity;

      const existing = productMap.get(productName) || {
        name: productName,
        sales: 0,
        revenue: 0,
      };
      existing.sales += quantity;
      existing.revenue += revenue;
      productMap.set(productName, existing);
    });

    return Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  } catch (error) {
    console.error("Error fetching top products:", error);
    return [];
  }
};

const fetchVendorPerformance = async (
  dateRange: DateRange,
): Promise<VendorPerformance[]> => {
  const { data: vendors } = await supabase
    .from("vendor_profiles")
    .select(
      `
      user_id,
      shop_name,
      approval_status,
      products (product_id)
    `,
    )
    .eq("approval_status", "approved");

  const vendorIds = vendors?.map((v) => v.user_id) || [];
  const { data: salesData } = await supabase
    .from("orders")
    .select("vendor_user_id, total_amount")
    .in("vendor_user_id", vendorIds)
    .eq("order_status", "delivered")
    .gte("created_at", dateRange.start)
    .lte("created_at", dateRange.end);

  const salesMap = new Map<string, number>();
  salesData?.forEach((order) => {
    const current = salesMap.get(order.vendor_user_id) || 0;
    salesMap.set(order.vendor_user_id, current + (order.total_amount || 0));
  });

  return (vendors || [])
    .map((v) => ({
      id: v.user_id,
      name: v.shop_name || "Unnamed Shop",
      status: v.approval_status || "active",
      productCount: v.products?.length || 0,
      totalSales: salesMap.get(v.user_id) || 0,
    }))
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);
};

const fetchRiderPerformance = async (
  dateRange: DateRange,
): Promise<RiderPerformance[]> => {
  try {
    const { data: riders } = await supabase
      .from("rider_profiles")
      .select(
        `
        user_id,
        approval_status,
        is_available,
        profiles!rider_profiles_user_id_fkey (
          full_name
        )
      `,
      )
      .eq("approval_status", "approved");

    if (!riders || riders.length === 0) return [];

    const riderIds = riders.map((r) => r.user_id);

    const { data: deliveries } = await supabase
      .from("deliveries")
      .select(
        `
        delivery_id,
        rider_user_id,
        status,
        assigned_at,
        delivered_time
      `,
      )
      .in("rider_user_id", riderIds)
      .gte("assigned_at", dateRange.start)
      .lte("assigned_at", dateRange.end);

    const { data: reviews } = await supabase
      .from("reviews")
      .select("rider_user_id, rider_rating")
      .in("rider_user_id", riderIds)
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end);

    const ratingMap = new Map<string, { sum: number; count: number }>();
    reviews?.forEach((review) => {
      const current = ratingMap.get(review.rider_user_id) || {
        sum: 0,
        count: 0,
      };
      current.sum += review.rider_rating;
      current.count += 1;
      ratingMap.set(review.rider_user_id, current);
    });

    const deliveryStats = new Map<
      string,
      { total: number; completed: number; avgTime: number }
    >();

    deliveries?.forEach((delivery) => {
      const riderId = delivery.rider_user_id;
      if (!riderId) return;

      const current = deliveryStats.get(riderId) || {
        total: 0,
        completed: 0,
        avgTime: 0,
      };
      current.total += 1;

      if (delivery.status === "delivered") {
        current.completed += 1;

        if (delivery.assigned_at && delivery.delivered_time) {
          const assignedTime = new Date(delivery.assigned_at).getTime();
          const deliveredTime = new Date(delivery.delivered_time).getTime();
          const timeDiff = (deliveredTime - assignedTime) / (1000 * 60);

          current.avgTime =
            current.avgTime === 0 ? timeDiff : (current.avgTime + timeDiff) / 2;
        }
      }

      deliveryStats.set(riderId, current);
    });

    return riders
      .map((rider) => {
        const stats = deliveryStats.get(rider.user_id) || {
          total: 0,
          completed: 0,
          avgTime: 0,
        };
        const rating = ratingMap.get(rider.user_id);
        const avgRating = rating ? rating.sum / rating.count : undefined;
        const profile =
          Array.isArray(rider.profiles) && rider.profiles.length > 0
            ? rider.profiles[0]
            : { full_name: "Unknown Rider" };

        return {
          id: rider.user_id,
          name: profile?.full_name || "Unknown Rider",
          totalDeliveries: stats.total,
          completedDeliveries: stats.completed,
          avgDeliveryTime: stats.avgTime || undefined,
          rating: avgRating,
          status: rider.is_available ? "available" : "unavailable",
        };
      })
      .sort((a, b) => b.completedDeliveries - a.completedDeliveries)
      .slice(0, 5);
  } catch (error) {
    console.error("Error fetching rider performance:", error);
    return [];
  }
};

const fetchOrdersTrend = async (
  dateRange: DateRange,
  period: string,
): Promise<ChartDataPoint[]> => {
  const { data: orders } = await supabase
    .from("orders")
    .select("created_at, total_amount")
    .gte("created_at", dateRange.start)
    .lte("created_at", dateRange.end)
    .order("created_at", { ascending: true });

  const groupedData: Record<string, { orders: number; sales: number }> = {};

  orders?.forEach((order) => {
    const date = new Date(order.created_at);
    let key: string;

    if (period === "weekly") {
      key = date.toLocaleDateString(undefined, { weekday: "short" });
    } else if (period === "monthly") {
      key = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } else {
      key = date.toLocaleDateString(undefined, { month: "short" });
    }

    if (!groupedData[key]) {
      groupedData[key] = { orders: 0, sales: 0 };
    }
    groupedData[key].orders += 1;
    groupedData[key].sales += order.total_amount || 0;
  });

  return Object.entries(groupedData).map(([name, data]) => ({
    name,
    orders: data.orders,
    sales: data.sales,
  }));
};

const fetchQuickCounts = async (): Promise<QuickStats> => {
  const { count: buyers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "user");

  const { count: vendors } = await supabase
    .from("vendor_profiles")
    .select("*", { count: "exact", head: true })
    .eq("approval_status", "approved");

  const { count: totalRiders } = await supabase
    .from("rider_profiles")
    .select("*", { count: "exact", head: true })
    .eq("approval_status", "approved");

  const { count: activeRiders } = await supabase
    .from("rider_profiles")
    .select("*", { count: "exact", head: true })
    .eq("approval_status", "approved")
    .eq("is_available", true);

  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { count: completedOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("order_status", "delivered");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const { count: currentMonth } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString());

  const { count: lastMonth } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfLastMonth.toISOString())
    .lt("created_at", startOfMonth.toISOString());

  const growthRate =
    lastMonth && lastMonth > 0
      ? ((currentMonth! - lastMonth) / lastMonth) * 100
      : 0;

  const { data: deliveries } = await supabase
    .from("deliveries")
    .select("assigned_at, delivered_time")
    .eq("status", "delivered")
    .not("assigned_at", "is", null)
    .not("delivered_time", "is", null)
    .limit(100);

  let avgDeliveryTime = 0;
  if (deliveries && deliveries.length > 0) {
    const totalTime = deliveries.reduce((sum, d) => {
      const assigned = new Date(d.assigned_at).getTime();
      const delivered = new Date(d.delivered_time).getTime();
      return sum + (delivered - assigned);
    }, 0);
    avgDeliveryTime = totalTime / deliveries.length / (1000 * 60);
  }

  return {
    totalBuyers: buyers || 0,
    totalVendors: vendors || 0,
    totalRiders: totalRiders || 0,
    activeRiders: activeRiders || 0,
    completionRate: totalOrders
      ? ((completedOrders || 0) / totalOrders) * 100
      : 0,
    growthRate,
    avgDeliveryTime: Math.round(avgDeliveryTime),
  };
};

export function useReports(period: string) {
  return useQuery({
    queryKey: ["reports", period],
    queryFn: async () => {
      const dateRange = getDateRange(period);

      const [stats, products, vendors, riders, chartData, quickStats] =
        await Promise.all([
          fetchSummaryStats(dateRange),
          fetchTopProducts(dateRange),
          fetchVendorPerformance(dateRange),
          fetchRiderPerformance(dateRange),
          fetchOrdersTrend(dateRange, period),
          fetchQuickCounts(),
        ]);

      return {
        summaryStats: stats,
        topProducts: products,
        vendorPerformance: vendors,
        riderPerformance: riders,
        chartData,
        quickStats,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
