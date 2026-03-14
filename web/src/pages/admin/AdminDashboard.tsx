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
  Bike,
} from "lucide-react";

const AdminDashboard = () => {
  const { data, isLoading, error } = useAdminDashboard();

  if (isLoading) {
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

  if (error || !data?.stats) {
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

  const { stats, weeklyData, recentOrders, topVendors } = data;
  const s = stats;

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={s.totalUsers}
          icon={Users}
          iconColor="bg-primary"
        />
        <StatCard
          title="Total Vendors"
          value={s.totalVendors}
          icon={Store}
          iconColor="bg-ocean-medium"
        />
        <StatCard
          title="Total Orders"
          value={s.totalOrders}
          icon={ShoppingCart}
          iconColor="bg-aqua-bright"
        />
        <StatCard
          title="Completed"
          value={s.completedTransactions}
          icon={CheckCircle}
          iconColor="bg-success"
        />
        <StatCard
          title="Buyers"
          value={s.buyerCount}
          icon={UserCheck}
          iconColor="bg-coral"
        />
        <StatCard
          title="Riders"
          value={s.riderCount}
          icon={Bike}
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
