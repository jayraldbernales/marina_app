import { useState } from "react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Store,
  Package,
  Calendar,
  TrendingUp,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  Loader2,
  User,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useVendors,
  useVendorDetails,
  useBanVendor,
  type VendorWithBan,
} from "@/hooks/useVendors";

const VendorManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorWithBan | null>(
    null,
  );
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const { toast } = useToast();

  // React Query hooks
  const { data: vendors = [], isLoading, error } = useVendors();

  const { data: selectedVendorDetails, isLoading: loadingDetails } =
    useVendorDetails(selectedVendorId);

  const banVendorMutation = useBanVendor();

  const handleBanVendor = async () => {
    if (!selectedVendor) return;

    try {
      await banVendorMutation.mutateAsync({
        vendorId: selectedVendor.id,
        banned: !selectedVendor.shopBanned,
      });

      toast({
        title: selectedVendor.shopBanned ? "Shop Unbanned" : "Shop Banned",
        description: `${selectedVendor.name} has been ${selectedVendor.shopBanned ? "unbanned" : "banned"} from selling.`,
      });

      setBanDialogOpen(false);
      setSelectedVendor(null);
    } catch (error: any) {
      console.error("Error updating shop ban status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update shop status",
        variant: "destructive",
      });
    }
  };

  const handleViewVendor = (vendor: VendorWithBan) => {
    setSelectedVendor(vendor);
    setSelectedVendorId(vendor.id);
    setViewDialogOpen(true);
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.ownerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: vendors.length,
    active: vendors.filter((v) => v.status === "active").length,
    banned: vendors.filter((v) => v.status === "banned").length,
    totalProducts: vendors.reduce((acc, v) => acc + v.productCount, 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="p-6 bg-card rounded-xl border border-border shadow-card">
          <p className="text-center text-destructive">
            Failed to load vendors. Please try again.
          </p>
        </div>
      </div>
    );
  }

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
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Ban className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.banned}</p>
            <p className="text-sm text-muted-foreground">Banned Vendors</p>
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
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((vendor) => (
          <div
            key={vendor.id}
            className={cn(
              "bg-card rounded-xl border p-6 shadow-card hover:shadow-card-hover transition-all duration-300",
              vendor.status === "banned"
                ? "border-destructive/20 bg-destructive/5"
                : "border-border",
            )}
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
              {vendor.status === "banned" ? (
                <Badge variant="destructive" className="capitalize">
                  <Ban className="w-3 h-3 mr-1" />
                  Banned
                </Badge>
              ) : (
                <Badge className="bg-success/10 text-success border-success/20 capitalize">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
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
                  {vendor.joinedDate || "N/A"}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 gap-2",
                  vendor.status === "banned"
                    ? "text-success hover:text-success"
                    : "text-primary hover:text-primary",
                )}
                onClick={() => {
                  setSelectedVendor(vendor);
                  setBanDialogOpen(true);
                }}
                disabled={banVendorMutation.isPending}
              >
                {vendor.status === "banned" ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Unban Shop
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    Ban Shop
                  </>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => handleViewVendor(vendor)}
              >
                <Eye className="w-4 h-4" />
                View
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

      {/* View Vendor Details Modal */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-125 md:max-w-137 bg-white p-0 gap-0">
          {/* Header with subtle gradient */}
          <div className="bg-linear-to-r from-gray-50 to-white px-6 py-4 border-b rounded-t-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900">
                <Store className="w-5 h-5 text-primary" />
                <span>Vendor Details</span>
                {selectedVendorDetails && (
                  <Badge
                    className={cn(
                      "ml-auto capitalize",
                      selectedVendorDetails.status === "active"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-red-100 text-red-700 border-red-200",
                    )}
                  >
                    {selectedVendorDetails.status === "active" ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <Ban className="w-3 h-3 mr-1" />
                    )}
                    {selectedVendorDetails.status}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Content - Compact spacing */}
          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : selectedVendorDetails ? (
            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Quick Info Row - Compact */}
              <div className="flex items-center gap-3 text-sm bg-primary/5 p-2 rounded-lg">
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500">Shop Name</p>
                  <p className="font-medium text-gray-900 truncate">
                    {selectedVendorDetails.name}
                  </p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="font-medium text-gray-900">
                    {selectedVendorDetails.joinedDate}
                  </p>
                </div>
              </div>

              {/* Owner Details - Compact Card */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Owner Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs">Full Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedVendorDetails.ownerName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Email</p>
                    <p className="font-medium text-gray-900 text-xs truncate">
                      {selectedVendorDetails.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Mobile</p>
                    <p className="font-medium text-gray-900 text-xs">
                      {selectedVendorDetails.mobileNumber || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Address - Compact */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Business Address
                </h4>
                <p className="text-sm text-gray-700 wrap-break-words">
                  {selectedVendorDetails.businessAddress}
                </p>
              </div>

              {/* Stats - Side by side layout */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 rounded-lg p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Products</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedVendorDetails.productCount}
                    </p>
                  </div>
                </div>
                <div className="bg-success/5 rounded-lg p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sales</p>
                    <p className="text-lg font-bold text-gray-900">
                      ₱{selectedVendorDetails.totalSales.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Footer - Simple */}
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

      {/* Ban Confirmation Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {selectedVendor?.status === "banned" ? "Unban Shop" : "Ban Shop"}
            </DialogTitle>
            <DialogDescription>
              {selectedVendor?.status === "banned"
                ? `Are you sure you want to unban ${selectedVendor?.name}? They will be able to sell products again.`
                : `Are you sure you want to ban ${selectedVendor?.name}? They will lose access to sell products.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBanDialogOpen(false);
                setSelectedVendor(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={
                selectedVendor?.status === "banned" ? "default" : "destructive"
              }
              onClick={handleBanVendor}
              disabled={banVendorMutation.isPending}
            >
              {banVendorMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : selectedVendor?.status === "banned" ? (
                "Unban Shop"
              ) : (
                "Ban Shop"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorManagement;
