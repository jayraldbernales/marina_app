import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { TopVendors } from "@/components/dashboard/TopVendors";
import { mockStats, mockWeeklyData, mockVendors } from "@/data/mockData";
import {
  Users,
  Store,
  ShoppingCart,
  CheckCircle,
  Eye,
  TrendingUp,
} from "lucide-react";

const ViewerDashboard = () => {
  return (
    <div className="space-y-6 animate-slide-in">
      {/* Read-only Notice */}
      <div className="bg-ocean-light/50 border border-ocean-medium/20 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-ocean-medium/20 flex items-center justify-center">
          <Eye className="w-5 h-5 text-ocean-medium" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Viewer Dashboard
          </p>
          <p className="text-xs text-muted-foreground">
            You have read-only access to overview and analytics data.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={mockStats.totalUsers}
          change="+12% from last month"
          changeType="positive"
          icon={Users}
          iconColor="bg-primary"
        />
        <StatCard
          title="Total Vendors"
          value={mockStats.totalVendors}
          change="+8% from last month"
          changeType="positive"
          icon={Store}
          iconColor="bg-ocean-medium"
        />
        <StatCard
          title="Total Orders"
          value={mockStats.totalOrders}
          change="+23% from last month"
          changeType="positive"
          icon={ShoppingCart}
          iconColor="bg-aqua-bright"
        />
        <StatCard
          title="Completed"
          value={mockStats.completedTransactions}
          change="84% completion rate"
          changeType="neutral"
          icon={CheckCircle}
          iconColor="bg-success"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              Weekly Orders
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Order activity this week
            </p>
          </div>
          <ActivityChart data={mockWeeklyData} type="bar" />
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              Orders & Sales Trend
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Weekly performance overview
            </p>
          </div>
          <ActivityChart data={mockWeeklyData} type="line" />
        </div>
      </div>

      {/* Vendor Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopVendors vendors={mockVendors} />

        {/* Quick Stats */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Quick Insights
          </h3>
          <div className="grid grid-cols-2 gap-4">
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
              <p className="text-xs text-muted-foreground">Active Vendors</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-aqua-bright mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {Math.round(
                  (mockStats.completedTransactions / mockStats.totalOrders) *
                    100
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
    </div>
  );
};
export default ViewerDashboard;
