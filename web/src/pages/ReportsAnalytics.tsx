import { useState } from "react";
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
import { exportToCSV } from "@/lib/exportUtils";
import { useReports } from "@/hooks/useReports";
const ReportsAnalytics = () => {
  const [period, setPeriod] = useState("monthly");
  const { toast } = useToast();

  const { data, isLoading, error } = useReports(period);

  const handleExport = async () => {
    if (!data) return;

    try {
      toast({
        title: "Export Started",
        description: "Preparing your report...",
      });

      const csvData = {
        summary: data.summaryStats.map((s) => ({
          Metric: s.label,
          Value: s.value,
          Change: s.change,
        })),
        products: data.topProducts.map((p) => ({
          Product: p.name,
          Units_Sold: p.sales,
          Revenue: p.revenue,
        })),
        vendors: data.vendorPerformance.map((v) => ({
          Vendor: v.name,
          Products: v.productCount,
          Total_Sales: v.totalSales,
        })),
        riders: data.riderPerformance.map((r) => ({
          Rider: r.name,
          Deliveries: r.completedDeliveries,
          "Avg Delivery Time": r.avgDeliveryTime
            ? `${r.avgDeliveryTime.toFixed(0)} min`
            : "N/A",
          Rating: r.rating ? r.rating.toFixed(1) : "N/A",
          Status: r.status,
        })),
      };

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

  if (isLoading) {
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

  if (error || !data) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="p-6 bg-card rounded-xl border border-border shadow-card">
          <p className="text-center text-destructive">
            Failed to load report data. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const {
    summaryStats,
    topProducts,
    vendorPerformance,
    riderPerformance,
    chartData,
    quickStats,
  } = data;

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
