import { useState, useEffect } from "react";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  ShoppingCart,
  Store,
  Download,
  Calendar,
  Users,
  Bike,
  Package,
  Clock,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { exportToCSV } from "@/lib/exportUtils";

interface ProductSales {
  name: string;
  sales: number;
  revenue: number;
}

interface VendorPerformance {
  id: string;
  name: string;
  status: string;
  productCount: number;
  totalSales: number;
}

interface RiderPerformance {
  id: string;
  name: string;
  totalDeliveries: number;
  completedDeliveries: number;
  avgDeliveryTime?: number;
  rating?: number;
  status: string;
}

interface SummaryStat {
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: any;
}

const ReportsAnalytics = () => {
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState<SummaryStat[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [vendorPerformance, setVendorPerformance] = useState<
    VendorPerformance[]
  >([]);
  const [riderPerformance, setRiderPerformance] = useState<RiderPerformance[]>(
    [],
  );
  const [chartData, setChartData] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState({
    totalBuyers: 0,
    totalVendors: 0,
    totalRiders: 0,
    activeRiders: 0,
    completionRate: 0,
    growthRate: 0,
    avgDeliveryTime: 0,
  });

  const { toast } = useToast();

  useEffect(() => {
    loadReportData();
  }, [period]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Get date range based on period
      const dateRange = getDateRange(period);

      // Parallel data fetching
      const [
        statsData,
        productsData,
        vendorsData,
        ridersData,
        ordersTrend,
        countsData,
      ] = await Promise.all([
        fetchSummaryStats(dateRange),
        fetchTopProducts(dateRange),
        fetchVendorPerformance(dateRange),
        fetchRiderPerformance(dateRange),
        fetchOrdersTrend(dateRange),
        fetchQuickCounts(),
      ]);

      setSummaryStats(statsData);
      setTopProducts(productsData);
      setVendorPerformance(vendorsData);
      setRiderPerformance(ridersData);
      setChartData(ordersTrend);
      setQuickStats(countsData);
    } catch (error) {
      console.error("Error loading report data:", error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (period: string) => {
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

  const fetchSummaryStats = async (dateRange: {
    start: string;
    end: string;
  }): Promise<SummaryStat[]> => {
    // Get current period data
    const { data: currentOrders } = await supabase
      .from("orders")
      .select("total_amount, order_status")
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end);

    // Get previous period data for comparison
    const prevStart = new Date(dateRange.start);
    const prevEnd = new Date(dateRange.start);
    const diff =
      new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime();
    prevEnd.setTime(prevStart.getTime() - diff);

    const { data: previousOrders } = await supabase
      .from("orders")
      .select("total_amount")
      .gte("created_at", prevStart.toISOString())
      .lt("created_at", dateRange.start);

    // Calculate totals
    const totalRevenue =
      currentOrders?.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0,
      ) || 0;
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

    // Helper function to determine change type with proper typing
    const getChangeType = (
      current: number,
      previous: number,
    ): "positive" | "negative" | "neutral" => {
      if (current > previous) return "positive";
      if (current < previous) return "negative";
      return "neutral";
    };

    // Calculate percentage change with proper formatting
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

  const fetchTopProducts = async (dateRange: {
    start: string;
    end: string;
  }) => {
    try {
      // First, get the order IDs for the date range that are delivered
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("order_id")
        .eq("order_status", "delivered")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        return [];
      }

      const orderIds = orders.map((o) => o.order_id);

      // Then get order items for those orders
      const { data: orderItems, error: itemsError } = await supabase
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

      if (itemsError) throw itemsError;

      // Aggregate product sales
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

      // Convert to array, sort by revenue, and take top 5
      return Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    } catch (error) {
      console.error("Error fetching top products:", error);
      return [];
    }
  };
  const fetchVendorPerformance = async (dateRange: {
    start: string;
    end: string;
  }) => {
    // Get all approved vendors
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

    // Get sales data for these vendors in the period
    const vendorIds = vendors?.map((v) => v.user_id) || [];
    const { data: salesData } = await supabase
      .from("orders")
      .select("vendor_user_id, total_amount")
      .in("vendor_user_id", vendorIds)
      .eq("order_status", "delivered")
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end);

    // Calculate sales per vendor
    const salesMap = new Map<string, number>();
    salesData?.forEach((order) => {
      const current = salesMap.get(order.vendor_user_id) || 0;
      salesMap.set(order.vendor_user_id, current + (order.total_amount || 0));
    });

    // Map vendors with their sales
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

  const fetchRiderPerformance = async (dateRange: {
    start: string;
    end: string;
  }) => {
    try {
      // Get all approved riders with their profiles
      const { data: riders, error: ridersError } = await supabase
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

      if (ridersError) throw ridersError;
      if (!riders || riders.length === 0) return [];

      const riderIds = riders.map((r) => r.user_id);

      // Get deliveries for these riders
      const { data: deliveries, error: deliveriesError } = await supabase
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

      if (deliveriesError) throw deliveriesError;

      // Get ratings from reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("rider_user_id, rider_rating")
        .in("rider_user_id", riderIds)
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

      if (reviewsError) throw reviewsError;

      // Calculate average ratings per rider
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

      // Calculate delivery stats per rider
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

          // Calculate delivery time if both timestamps exist
          if (delivery.assigned_at && delivery.delivered_time) {
            const assignedTime = new Date(delivery.assigned_at).getTime();
            const deliveredTime = new Date(delivery.delivered_time).getTime();
            const timeDiff = (deliveredTime - assignedTime) / (1000 * 60); // in minutes

            // Update average (simple running average)
            current.avgTime =
              current.avgTime === 0
                ? timeDiff
                : (current.avgTime + timeDiff) / 2;
          }
        }

        deliveryStats.set(riderId, current);
      });

      // Map riders with their performance data
      return riders
        .map((rider) => {
          const stats = deliveryStats.get(rider.user_id) || {
            total: 0,
            completed: 0,
            avgTime: 0,
          };
          const rating = ratingMap.get(rider.user_id);
          const avgRating = rating ? rating.sum / rating.count : undefined;
          const profile = rider.profiles as any;

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
  const fetchOrdersTrend = async (dateRange: {
    start: string;
    end: string;
  }) => {
    const { data: orders } = await supabase
      .from("orders")
      .select("created_at, total_amount")
      .gte("created_at", dateRange.start)
      .lte("created_at", dateRange.end)
      .order("created_at", { ascending: true });

    // Group by date based on period
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

    // Convert to array format for chart
    return Object.entries(groupedData).map(([name, data]) => ({
      name,
      orders: data.orders,
      sales: data.sales,
    }));
  };

  const fetchQuickCounts = async () => {
    // Total buyers
    const { count: buyers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");

    // Total vendors
    const { count: vendors } = await supabase
      .from("vendor_profiles")
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "approved");

    // Total riders and active riders
    const { count: totalRiders } = await supabase
      .from("rider_profiles")
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "approved");

    const { count: activeRiders } = await supabase
      .from("rider_profiles")
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "approved")
      .eq("is_available", true);

    // Total orders and completed
    const { count: totalOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    const { count: completedOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "delivered");

    // Get current and previous month orders for growth rate
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

    // Calculate average delivery time
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
      avgDeliveryTime = totalTime / deliveries.length / (1000 * 60); // Convert to minutes
    }

    return {
      totalBuyers: buyers || 0,
      totalVendors: vendors || 0,
      totalRiders: totalRiders || 0,
      activeRiders: activeRiders || 0,
      completionRate: totalOrders
        ? ((completedOrders || 0) / totalOrders) * 100
        : 0,
      growthRate: growthRate,
      avgDeliveryTime: Math.round(avgDeliveryTime),
    };
  };

  const handleExport = async () => {
    try {
      toast({
        title: "Export Started",
        description: "Preparing your report...",
      });

      // Fetch all data for export
      const dateRange = getDateRange(period);
      const [summary, products, vendors, riders] = await Promise.all([
        fetchSummaryStats(dateRange),
        fetchTopProducts(dateRange),
        fetchVendorPerformance(dateRange),
        fetchRiderPerformance(dateRange),
      ]);

      // Prepare CSV data
      const csvData = {
        summary: summary.map((s) => ({
          Metric: s.label,
          Value: s.value,
          Change: s.change,
        })),
        products: products.map((p) => ({
          Product: p.name,
          Units_Sold: p.sales,
          Revenue: p.revenue,
        })),
        vendors: vendors.map((v) => ({
          Vendor: v.name,
          Products: v.productCount,
          Total_Sales: v.totalSales,
        })),
        riders: riders.map((r) => ({
          Rider: r.name,
          Deliveries: r.completedDeliveries,
          "Avg Delivery Time": r.avgDeliveryTime
            ? `${r.avgDeliveryTime.toFixed(0)} min`
            : "N/A",
          Rating: r.rating ? r.rating.toFixed(1) : "N/A",
          Status: r.status,
        })),
      };

      // Export to CSV
      exportToCSV(
        csvData,
        `report-${period}-${new Date().toISOString().split("T")[0]}`,
      );

      toast({
        title: "Export Complete",
        description: "Your report has been downloaded.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="p-6">
          <p className="text-center text-muted-foreground">
            Loading analytics data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Analytics Overview
          </h3>
          <p className="text-sm text-muted-foreground">
            Aggregated sales, orders, and delivery data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card rounded-xl border border-border p-5 shadow-card"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <Badge
                  variant="secondary"
                  className={
                    stat.changeType === "positive"
                      ? "bg-success/10 text-success border-success/20"
                      : stat.changeType === "negative"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-muted text-muted-foreground border-border"
                  }
                >
                  {stat.change}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-foreground">
              {period === "weekly"
                ? "Daily"
                : period === "monthly"
                  ? "Daily"
                  : "Monthly"}{" "}
              Orders
            </h4>
            <p className="text-sm text-muted-foreground">
              Order volume over time
            </p>
          </div>
          <ActivityChart data={chartData} type="bar" />
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-foreground">
              Revenue Trend
            </h4>
            <p className="text-sm text-muted-foreground">
              Orders and sales over time
            </p>
          </div>
          <ActivityChart data={chartData} type="line" />
        </div>
      </div>

      {/* Additional Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h4 className="text-lg font-semibold text-foreground">
              Top Products
            </h4>
            <p className="text-sm text-muted-foreground">
              Best selling items this period
            </p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.sales} units sold
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    ₱{product.revenue.toLocaleString()}
                  </p>
                </div>
              ))}
              {topProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No sales data available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Vendor Performance */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h4 className="text-lg font-semibold text-foreground">
              Top Vendors
            </h4>
            <p className="text-sm text-muted-foreground">By sales volume</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {vendorPerformance.map((vendor, index) => (
                <div
                  key={vendor.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                >
                  <div className="w-8 h-8 rounded-full bg-ocean-medium/20 flex items-center justify-center text-sm font-semibold text-ocean-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {vendor.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          vendor.status === "approved"
                            ? "bg-success/10 text-success border-success/20 text-xs"
                            : "text-xs"
                        }
                      >
                        {vendor.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {vendor.productCount} products
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    ₱{vendor.totalSales.toLocaleString()}
                  </p>
                </div>
              ))}
              {vendorPerformance.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No vendor data available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Rider Performance */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h4 className="text-lg font-semibold text-foreground">
              Top Riders
            </h4>
            <p className="text-sm text-muted-foreground">By delivery count</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {riderPerformance.map((rider, index) => (
                <div
                  key={rider.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                >
                  <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-sm font-semibold text-warning">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {rider.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          rider.status === "available"
                            ? "bg-success/10 text-success border-success/20 text-xs"
                            : "bg-muted text-muted-foreground border-border text-xs"
                        }
                      >
                        {rider.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {rider.completedDeliveries}
                      </span>
                      {rider.avgDeliveryTime && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rider.avgDeliveryTime.toFixed(0)} min
                        </span>
                      )}
                      {rider.rating && (
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Star className="w-3 h-3 fill-warning text-warning" />
                          {rider.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {riderPerformance.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No rider data available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">
          Quick Insights
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {quickStats.totalBuyers}
            </p>
            <p className="text-xs text-muted-foreground">Total Buyers</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <Store className="w-6 h-6 text-ocean-medium mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {quickStats.totalVendors}
            </p>
            <p className="text-xs text-muted-foreground">Active Vendors</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <Bike className="w-6 h-6 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {quickStats.activeRiders}/{quickStats.totalRiders}
            </p>
            <p className="text-xs text-muted-foreground">Active Riders</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <Clock className="w-6 h-6 text-aqua-bright mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {quickStats.avgDeliveryTime} min
            </p>
            <p className="text-xs text-muted-foreground">Avg Delivery Time</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-aqua-bright mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {Math.round(quickStats.completionRate)}%
            </p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <TrendingUp className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {quickStats.growthRate > 0 ? "+" : ""}
              {quickStats.growthRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Growth Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
