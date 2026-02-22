import type { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecentOrdersProps {
  orders: Order[];
}

const statusStyles: Record<
  string, // Change from Order["status"] to string to be more flexible
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  pending: {
    variant: "secondary",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  accepted: {
    variant: "secondary",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  delivered: {
    variant: "secondary",
    className: "bg-success/10 text-success border-success/20",
  },
  cancelled: {
    variant: "secondary",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  // Add a default fallback for unknown statuses
  unknown: {
    variant: "outline",
    className: "bg-muted/10 text-muted-foreground border-muted/20",
  },
};

// Helper function to safely get status styles
const getStatusStyle = (status: string | undefined) => {
  if (!status) return statusStyles.unknown;
  return statusStyles[status.toLowerCase()] || statusStyles.unknown;
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  // Guard clause for empty orders
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Recent Orders
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">
          No recent orders found
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Latest marketplace transactions
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Buyer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => {
              const statusStyle = getStatusStyle(order.status);
              return (
                <tr
                  key={order.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-foreground">
                      {order.orderNumber || "N/A"}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {order.date || "Unknown date"}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-foreground">
                      {order.buyerName || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-foreground">
                      {order.vendorName || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={statusStyle.variant}
                      className={cn("capitalize", statusStyle.className)}
                    >
                      {order.status || "pending"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-foreground">
                      ₱{(order.total || 0).toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
