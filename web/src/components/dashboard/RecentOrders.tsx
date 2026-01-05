import type { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecentOrdersProps {
  orders: Order[];
}

const statusStyles: Record<
  Order["status"],
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
};

export function RecentOrders({ orders }: RecentOrdersProps) {
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
            {orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-foreground">
                    {order.orderNumber}
                  </span>
                  <p className="text-xs text-muted-foreground">{order.date}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-foreground">
                    {order.buyerName}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-foreground">
                    {order.vendorName}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    variant={statusStyles[order.status].variant}
                    className={cn(
                      "capitalize",
                      statusStyles[order.status].className
                    )}
                  >
                    {order.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-medium text-foreground">
                    ₱{order.total.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
