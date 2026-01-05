import { useState } from "react";
import { mockVendors } from "@/data/mockData";
import type { Vendor } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Store,
  Package,
  Calendar,
  TrendingUp,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const VendorManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vendors] = useState<Vendor[]>(mockVendors);

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: vendors.length,
    active: vendors.filter((v) => v.status === "active").length,
    inactive: vendors.filter((v) => v.status === "inactive").length,
    totalProducts: vendors.reduce((acc, v) => acc + v.productCount, 0),
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Vendors</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.active}</p>
            <p className="text-sm text-muted-foreground">Active Vendors</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Store className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.inactive}
            </p>
            <p className="text-sm text-muted-foreground">Inactive Vendors</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-aqua-bright/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-ocean-medium" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.totalProducts}
            </p>
            <p className="text-sm text-muted-foreground">Total Products</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {vendor.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {vendor.email}
                  </p>
                </div>
              </div>
              <Badge
                className={cn(
                  vendor.status === "active"
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {vendor.status}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Package className="w-4 h-4" />
                  Products
                </span>
                <span className="font-medium text-foreground">
                  {vendor.productCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  Total Sales
                </span>
                <span className="font-medium text-foreground">
                  ₱{vendor.totalSales.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Joined
                </span>
                <span className="font-medium text-foreground">
                  {vendor.joinedDate}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Eye className="w-4 h-4" />
                View Details
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No vendors found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};
export default VendorManagement;
