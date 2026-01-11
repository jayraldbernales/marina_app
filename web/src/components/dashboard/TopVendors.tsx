import type { Vendor } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Store, Package } from "lucide-react";

interface TopVendorsProps {
  vendors: Vendor[];
}

export function TopVendors({ vendors }: TopVendorsProps) {
  const sortedVendors = [...vendors]
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);

  return (
    <div className="bg-card rounded-xl border border-border shadow-card">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Top Vendors</h3>
        <p className="text-sm text-muted-foreground mt-1">By total sales</p>
      </div>
      <div className="p-4 space-y-3">
        {sortedVendors.map((vendor, index) => (
          <div
            key={vendor.id}
            className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground truncate">
                  {vendor.name}
                </p>
                <Badge
                  variant={vendor.status === "active" ? "default" : "secondary"}
                  className={
                    vendor.status === "active"
                      ? "bg-success/10 text-success border-success/20"
                      : ""
                  }
                >
                  {vendor.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Package className="w-3 h-3" />
                  {vendor.productCount} products
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                ₱{vendor.totalSales.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Sales</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
