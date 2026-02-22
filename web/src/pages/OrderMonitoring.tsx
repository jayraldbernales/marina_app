import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/types";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  User,
  Store,
  Package,
  Loader2,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  // Original statuses
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  delivered: {
    label: "Delivered",
    icon: Truck,
    className: "bg-success/10 text-success border-success/20",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },

  // Additional statuses from your database
  preparing: {
    label: "Preparing",
    icon: Package,
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  "ready-to-ship": {
    label: "Ready to Ship",
    icon: Package,
    className: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    className: "bg-purple-100 text-purple-700 border-purple-200",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  finding_rider: {
    label: "Finding Rider",
    icon: Clock,
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  dispatch_failed: {
    label: "Dispatch Failed",
    icon: AlertCircle,
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },

  paid: {
    label: "Paid",
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 border-green-200",
  },
  failed: {
    label: "Payment Failed",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  pending_verification: {
    label: "Pending Verification",
    icon: Clock,
    className: "bg-warning/10 text-warning border-warning/20",
  },

  // Fallback for unknown statuses
  unknown: {
    label: "Unknown",
    icon: AlertCircle,
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

// Helper function to safely get status config
const getStatusConfig = (status: string) => {
  return statusConfig[status?.toLowerCase()] || statusConfig.unknown;
};

// Extended order interface for view details
interface OrderDetails {
  id: string;
  orderNumber: string;
  buyerName: string;
  vendorName: string;
  status: string; // Change to string to handle any status
  total: number;
  items: number;
  date: string;
  // Additional details
  buyerEmail?: string;
  buyerMobile?: string;
  buyerAddress?: string;
  vendorEmail?: string;
  vendorMobile?: string;
  vendorAddress?: string;
  orderItems?: OrderItem[];
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

const OrderMonitoring = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const { toast } = useToast();

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Get orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          order_id,
          order_number,
          user_id,
          vendor_user_id,
          total_amount,
          order_status,
          created_at
        `,
        )
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Get buyer and vendor IDs
      const buyerIds = ordersData.map((o) => o.user_id).filter(Boolean);
      const vendorIds = ordersData.map((o) => o.vendor_user_id).filter(Boolean);

      // Fetch buyer profiles
      const { data: buyersData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", buyerIds);

      const buyerMap = new Map();
      buyersData?.forEach((b) => buyerMap.set(b.user_id, b.full_name));

      // Fetch vendor profiles
      const { data: vendorsData } = await supabase
        .from("vendor_profiles")
        .select("user_id, shop_name")
        .in("user_id", vendorIds);

      const vendorMap = new Map();
      vendorsData?.forEach((v) => vendorMap.set(v.user_id, v.shop_name));

      // Get item counts for each order
      const orderIds = ordersData.map((o) => o.order_id);
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("order_id")
        .in("order_id", orderIds);

      const itemCountMap = new Map();
      itemsData?.forEach((item) => {
        itemCountMap.set(
          item.order_id,
          (itemCountMap.get(item.order_id) || 0) + 1,
        );
      });

      const mappedOrders: Order[] = ordersData.map((order: any) => ({
        id: order.order_id,
        orderNumber: order.order_number || `ORD-${order.order_id.slice(0, 8)}`,
        buyerName: buyerMap.get(order.user_id) || "Unknown",
        vendorName: vendorMap.get(order.vendor_user_id) || "Unknown",
        status: order.order_status || "pending",
        total: Number(order.total_amount || 0),
        items: itemCountMap.get(order.order_id) || 0,
        date: order.created_at
          ? new Date(order.created_at).toLocaleString()
          : "",
      }));

      setOrders(mappedOrders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewOrder = async (order: Order) => {
    try {
      // Fetch full order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          order_id,
          order_number,
          user_id,
          vendor_user_id,
          total_amount,
          order_status,
          created_at,
          address_id
        `,
        )
        .eq("order_id", order.id)
        .single();

      if (orderError) throw orderError;

      // Fetch buyer details
      const { data: buyerData } = await supabase
        .from("profiles")
        .select("full_name, email, mobile_number")
        .eq("user_id", orderData.user_id)
        .single();

      // Fetch vendor details
      const { data: vendorProfile } = await supabase
        .from("vendor_profiles")
        .select("shop_name, gcash_number, gcash_name, user_id")
        .eq("user_id", orderData.vendor_user_id)
        .single();

      // Fetch vendor email from profiles
      const { data: vendorUserData } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", orderData.vendor_user_id)
        .single();

      // Fetch address
      const { data: addressData } = await supabase
        .from("addresses")
        .select("full_address")
        .eq("address_id", orderData.address_id)
        .single();

      // Fetch order items
      const { data: itemsData } = await supabase
        .from("order_items")
        .select(
          `
          order_item_id,
          quantity,
          unit_price,
          subtotal,
          products (
            product_name
          )
        `,
        )
        .eq("order_id", order.id);

      const orderItems: OrderItem[] = (itemsData || []).map((item: any) => ({
        id: item.order_item_id,
        productName: item.products?.product_name || "Unknown Product",
        quantity: item.quantity || 0,
        unitPrice: Number(item.unit_price || 0),
        subtotal: Number(item.subtotal || 0),
      }));

      const orderDetails: OrderDetails = {
        id: order.id,
        orderNumber: order.orderNumber,
        buyerName: order.buyerName,
        vendorName: order.vendorName,
        status: order.status,
        total: order.total,
        items: order.items,
        date: order.date,
        buyerEmail: buyerData?.email,
        buyerMobile: buyerData?.mobile_number,
        buyerAddress: addressData?.full_address,
        vendorEmail: vendorUserData?.email,
        vendorMobile: vendorProfile?.gcash_number,
        vendorAddress: vendorProfile?.gcash_name,
        orderItems: orderItems,
      };

      setSelectedOrder(orderDetails);
      setViewDialogOpen(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    accepted: orders.filter((o) => o.status === "accepted").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {stats.pending}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {stats.accepted}
              </p>
              <p className="text-xs text-muted-foreground">Accepted</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Truck className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {stats.delivered}
              </p>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {stats.cancelled}
              </p>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, buyers, vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
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
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => {
                // Use the safe getter function
                const status = getStatusConfig(order.status);
                const StatusIcon = status.icon;

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-foreground">
                        {order.orderNumber}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {order.date}
                      </p>
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
                      <span className="text-sm text-muted-foreground">
                        {order.items} items
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={cn("gap-1", status.className)}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-foreground">
                        ₱{order.total.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No orders found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* View Order Details Modal */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[700px] bg-white p-0 gap-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b rounded-t-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <span>Order Details</span>
                {selectedOrder && (
                  <Badge
                    className={cn(
                      "ml-auto gap-1",
                      getStatusConfig(selectedOrder.status).className,
                    )}
                  >
                    {(() => {
                      const StatusIcon = getStatusConfig(
                        selectedOrder.status,
                      ).icon;
                      return <StatusIcon className="w-3 h-3" />;
                    })()}
                    {getStatusConfig(selectedOrder.status).label}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Content */}
          {selectedOrder && (
            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Order Info */}
              <div className="bg-primary/5 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Order Number</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.orderNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.date}
                    </p>
                  </div>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Buyer Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs">Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.buyerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Email</p>
                    <p className="font-medium text-gray-900 text-xs truncate">
                      {selectedOrder.buyerEmail || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Mobile</p>
                    <p className="font-medium text-gray-900 text-xs">
                      {selectedOrder.buyerMobile || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Delivery Address
                    </p>
                    <p className="font-medium text-gray-900 text-sm">
                      {selectedOrder.buyerAddress || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vendor Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" />
                  Vendor Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs">Shop Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.vendorName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Email</p>
                    <p className="font-medium text-gray-900 text-xs truncate">
                      {selectedOrder.vendorEmail || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">GCash</p>
                    <p className="font-medium text-gray-900 text-xs">
                      {selectedOrder.vendorMobile || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  Order Items
                </h4>
                <div className="space-y-2">
                  {selectedOrder.orderItems &&
                  selectedOrder.orderItems.length > 0 ? (
                    selectedOrder.orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            ₱{item.unitPrice.toLocaleString()} x {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium text-gray-900">
                          ₱{item.subtotal.toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No items found</p>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="bg-primary/5 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    Total Amount
                  </p>
                  <p className="text-xl font-bold text-primary">
                    ₱{selectedOrder.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <DialogFooter className="px-6 py-3 bg-gray-50 border-t rounded-b-lg">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="bg-white hover:bg-gray-50 w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderMonitoring;
