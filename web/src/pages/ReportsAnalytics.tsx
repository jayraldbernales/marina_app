import { useState } from "react";
import { mockMonthlyData, mockVendors, mockStats } from "@/data/mockData";
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
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Store,
  Download,
  Calendar,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ReportsAnalytics = () => {
  const [period, setPeriod] = useState("monthly");
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your report is being generated and will download shortly.",
    });
  };

  const summaryStats = [
    {
      label: "Total Revenue",
      value: "₱1,685,000",
      change: "+18.5%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      label: "Total Orders",
      value: mockStats.totalOrders.toLocaleString(),
      change: "+23%",
      changeType: "positive" as const,
      icon: ShoppingCart,
    },
    {
      label: "Active Vendors",
      value: mockVendors.filter((v) => v.status === "active").length.toString(),
      change: "+5",
      changeType: "positive" as const,
      icon: Store,
    },
    {
      label: "Avg. Order Value",
      value: "₱487",
      change: "+8.2%",
      changeType: "positive" as const,
      icon: BarChart3,
    },
  ];

  const topProducts = [
    { name: "Fresh Tuna", sales: 245, revenue: 98000 },
    { name: "Prawns (Large)", sales: 189, revenue: 75600 },
    { name: "Blue Crab", sales: 156, revenue: 62400 },
    { name: "Salmon Fillet", sales: 134, revenue: 80400 },
    { name: "Squid (Cleaned)", sales: 121, revenue: 36300 },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Analytics Overview
          </h3>
          <p className="text-sm text-muted-foreground">
            Aggregated sales and order data
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
                      : "bg-destructive/10 text-destructive border-destructive/20"
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
              Monthly Orders
            </h4>
            <p className="text-sm text-muted-foreground">
              Order volume by month
            </p>
          </div>
          <ActivityChart data={mockMonthlyData} type="bar" />
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
          <ActivityChart data={mockMonthlyData} type="line" />
        </div>
      </div>

      {/* Additional Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
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
            </div>
          </div>
        </div>

        {/* Vendor Performance */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h4 className="text-lg font-semibold text-foreground">
              Vendor Performance
            </h4>
            <p className="text-sm text-muted-foreground">
              Active vendor summary
            </p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {mockVendors
                .sort((a, b) => b.totalSales - a.totalSales)
                .slice(0, 5)
                .map((vendor, index) => (
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
                            vendor.status === "active"
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
              {mockStats.buyerCount}
            </p>
            <p className="text-xs text-muted-foreground">Total Buyers</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <Store className="w-6 h-6 text-ocean-medium mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {mockStats.totalVendors}
            </p>
            <p className="text-xs text-muted-foreground">Registered Vendors</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-aqua-bright mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {Math.round(
                (mockStats.completedTransactions / mockStats.totalOrders) * 100
              )}
              %
            </p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <TrendingUp className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">+23%</p>
            <p className="text-xs text-muted-foreground">Growth Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportsAnalytics;
