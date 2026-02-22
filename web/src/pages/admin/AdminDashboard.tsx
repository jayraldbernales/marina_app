import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { TopVendors } from "@/components/dashboard/TopVendors";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import {
  Users,
  Store,
  ShoppingCart,
  CheckCircle,
  UserCheck,
  Bike, // Changed from Eye to Bike for riders
} from "lucide-react";

const AdminDashboard = () => {
  const { stats, weeklyData, recentOrders, topVendors, loading } =
    useAdminDashboard();

  if (loading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="p-6">
          <p className="text-center text-muted-foreground">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="p-6 bg-card rounded-xl border border-border shadow-card">
          <p className="text-center text-destructive">
            Failed to load dashboard data.
          </p>
        </div>
      </div>
    );
  }

  const s = stats;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={s.totalUsers}
          change="+12% from last month"
          changeType="positive"
          icon={Users}
          iconColor="bg-primary"
        />
        <StatCard
          title="Total Vendors"
          value={s.totalVendors}
          change="+8% from last month"
          changeType="positive"
          icon={Store}
          iconColor="bg-ocean-medium"
        />
        <StatCard
          title="Total Orders"
          value={s.totalOrders}
          change="+23% from last month"
          changeType="positive"
          icon={ShoppingCart}
          iconColor="bg-aqua-bright"
        />
        <StatCard
          title="Completed"
          value={s.completedTransactions}
          change="84% completion rate"
          changeType="neutral"
          icon={CheckCircle}
          iconColor="bg-success"
        />
        <StatCard
          title="Buyers"
          value={s.buyerCount}
          change="+15% growth"
          changeType="positive"
          icon={UserCheck}
          iconColor="bg-coral"
        />
        <StatCard
          title="Riders"
          value={s.riderCount}
          change="Active delivery partners"
          changeType="neutral"
          icon={Bike} // Changed from Eye to Bike
          iconColor="bg-warning"
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
          <ActivityChart data={weeklyData} type="bar" />
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
          <ActivityChart data={weeklyData} type="line" />
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrders orders={recentOrders} />
        </div>
        <div>
          <TopVendors vendors={topVendors} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
