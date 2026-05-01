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
  Bike,
  Calendar,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  Loader2,
  User,
  Car,
  Clock,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useRiders,
  useRiderDetails,
  useBanRider,
  type RiderWithBan,
} from "@/hooks/useRiders";

const RiderManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState<RiderWithBan | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const { toast } = useToast();

  // React Query hooks
  const { data: riders = [], isLoading, error } = useRiders();

  const { data: selectedRiderDetails, isLoading: loadingDetails } =
    useRiderDetails(selectedRiderId);

  const banRiderMutation = useBanRider();

  const handleViewRider = (rider: RiderWithBan) => {
    setSelectedRider(rider);
    setSelectedRiderId(rider.id);
    setViewDialogOpen(true);
  };

  const handleBanRider = async () => {
    if (!selectedRider) return;

    try {
      await banRiderMutation.mutateAsync({
        riderId: selectedRider.id,
        banned: !selectedRider.riderBanned,
      });

      toast({
        title: selectedRider.riderBanned ? "Rider Unbanned" : "Rider Banned",
        description: `${selectedRider.name} has been ${selectedRider.riderBanned ? "unbanned" : "banned"} from delivering.`,
      });

      setBanDialogOpen(false);
      setSelectedRider(null);
    } catch (error: any) {
      console.error("Error updating rider ban status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update rider status",
        variant: "destructive",
      });
    }
  };

  const filteredRiders = riders.filter((rider) => {
    const matchesSearch =
      rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.vehicleType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || rider.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: riders.length,
    active: riders.filter((r) => r.status === "active").length,
    pending: riders.filter((r) => r.status === "pending").length,
    banned: riders.filter((r) => r.status === "banned").length,
    available: riders.filter((r) => r.isAvailable).length,
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
            Failed to load riders. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bike className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Riders</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.active}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.pending}
            </p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Ban className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.banned}</p>
            <p className="text-sm text-muted-foreground">Banned</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-aqua-bright/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-ocean-medium" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.available}
            </p>
            <p className="text-sm text-muted-foreground">Available Now</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search riders by name, email, vehicle..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Riders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRiders.map((rider) => (
          <div
            key={rider.id}
            className={cn(
              "bg-card rounded-xl border p-6 shadow-card hover:shadow-card-hover transition-all duration-300",
              rider.status === "banned"
                ? "border-destructive/20 bg-destructive/5"
                : rider.status === "pending"
                  ? "border-amber-200 bg-amber-50/50"
                  : "border-border",
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Bike className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-foreground truncate">
                    {rider.name}
                  </h4>
                  <p
                    className="text-sm text-muted-foreground truncate"
                    title={rider.email}
                  >
                    {rider.email}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {rider.status === "banned" ? (
                  <Badge
                    variant="destructive"
                    className="capitalize whitespace-nowrap"
                  >
                    <Ban className="w-3 h-3 mr-1" />
                    Banned
                  </Badge>
                ) : rider.status === "pending" ? (
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-700 border-amber-200 capitalize whitespace-nowrap"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-700 border-green-200 capitalize whitespace-nowrap"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {rider.isAvailable ? "Available" : "Active"}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Car className="w-4 h-4" />
                  Vehicle
                </span>
                <span className="font-medium text-foreground">
                  {rider.vehicleType}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  License
                </span>
                <span className="font-medium text-foreground">
                  {rider.licensePlate}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Joined
                </span>
                <span className="font-medium text-foreground">
                  {rider.joinedDate || "N/A"}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 gap-2",
                  rider.status === "banned"
                    ? "text-green-600 hover:text-green-700"
                    : "text-destructive hover:text-destructive",
                )}
                onClick={() => {
                  setSelectedRider(rider);
                  setBanDialogOpen(true);
                }}
                disabled={banRiderMutation.isPending}
              >
                {rider.status === "banned" ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Unban
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    Ban
                  </>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => handleViewRider(rider)}
              >
                <Eye className="w-4 h-4" />
                View
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredRiders.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <Bike className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No riders found matching your criteria.
          </p>
        </div>
      )}

      {/* View Rider Details Modal */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-125 md:max-w-137 bg-white p-0 gap-0">
          {/* Header with subtle gradient */}
          <div className="bg-linear-to-r from-gray-50 to-white px-6 py-4 border-b rounded-t-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900">
                <Bike className="w-5 h-5 text-primary" />
                <span>Rider Details</span>
                {selectedRiderDetails && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "ml-auto capitalize",
                      selectedRiderDetails.status === "active"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : selectedRiderDetails.status === "pending"
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : "bg-red-100 text-red-700 border-red-200",
                    )}
                  >
                    {selectedRiderDetails.status === "active" ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : selectedRiderDetails.status === "pending" ? (
                      <Clock className="w-3 h-3 mr-1" />
                    ) : (
                      <Ban className="w-3 h-3 mr-1" />
                    )}
                    {selectedRiderDetails.status}
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
          ) : selectedRiderDetails ? (
            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Quick Info Row */}
              <div className="flex items-center gap-3 text-sm bg-primary/5 p-2 rounded-lg">
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500">Availability</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-1",
                      selectedRiderDetails.isAvailable
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-700 border-gray-200",
                    )}
                  >
                    {selectedRiderDetails.isAvailable
                      ? "Available"
                      : "On Delivery"}
                  </Badge>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="font-medium text-gray-900">
                    {selectedRiderDetails.joinedDate}
                  </p>
                </div>
              </div>

              {/* Personal Details */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs">Full Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedRiderDetails.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Email</p>
                    <p className="font-medium text-gray-900 text-xs truncate">
                      {selectedRiderDetails.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Mobile</p>
                    <p className="font-medium text-gray-900 text-xs">
                      {selectedRiderDetails.mobileNumber || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" />
                  Vehicle Information
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-gray-500 text-xs">Vehicle Type</p>
                    <p className="font-medium text-gray-900">
                      {selectedRiderDetails.vehicleType}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">License Plate</p>
                    <p className="font-medium text-gray-900">
                      {selectedRiderDetails.licensePlate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 rounded-lg p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bike className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Deliveries</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedRiderDetails.deliveryCount}
                    </p>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-green-600">₱</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Earnings</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedRiderDetails.totalEarnings.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

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

      {/* Ban Confirmation Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {selectedRider?.status === "banned" ? "Unban Rider" : "Ban Rider"}
            </DialogTitle>
            <DialogDescription>
              {selectedRider?.status === "banned"
                ? `Are you sure you want to unban ${selectedRider?.name}? They will be able to accept deliveries again.`
                : `Are you sure you want to ban ${selectedRider?.name}? They will lose access to accept deliveries.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBanDialogOpen(false);
                setSelectedRider(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={
                selectedRider?.status === "banned" ? "default" : "destructive"
              }
              onClick={handleBanRider}
              disabled={banRiderMutation.isPending}
            >
              {banRiderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : selectedRider?.status === "banned" ? (
                "Unban Rider"
              ) : (
                "Ban Rider"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RiderManagement;
