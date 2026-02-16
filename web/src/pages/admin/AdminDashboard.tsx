import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { TopVendors } from "@/components/dashboard/TopVendors";
import {
  mockStats,
  mockWeeklyData,
  mockOrders,
  mockVendors,
} from "@/data/mockData";
import {
  Users,
  Store,
  ShoppingCart,
  CheckCircle,
  UserCheck,
  Eye,
} from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="space-y-6 animate-slide-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
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
        <StatCard
          title="Buyers"
          value={mockStats.buyerCount}
          change="+15% growth"
          changeType="positive"
          icon={UserCheck}
          iconColor="bg-coral"
        />
        <StatCard
          title="Viewers"
          value={mockStats.viewerCount}
          change="Active monitors"
          changeType="neutral"
          icon={Eye}
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

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrders orders={mockOrders.slice(0, 5)} />
        </div>
        <div>
          <TopVendors vendors={mockVendors} />
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
