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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Mail,
  Shield,
  Loader2,
  Ban,
  CheckCircle,
  AlertTriangle,
  User as UserIcon,
  Calendar,
  ShoppingBag,
  MapPin,
  Phone,
  Eye,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useUsers,
  useUserDetails,
  useBanUser,
  type UserWithBan,
} from "@/hooks/useUserManagement";

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithBan | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { toast } = useToast();

  // React Query hooks
  const { data: users = [], isLoading, error } = useUsers();
  const { data: selectedUserDetails, isLoading: loadingDetails } =
    useUserDetails(selectedUserId);
  const banUserMutation = useBanUser();

  const handleViewDetails = (user: UserWithBan) => {
    setSelectedUser(user);
    setSelectedUserId(user.id);
    setDetailsDialogOpen(true);
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    try {
      await banUserMutation.mutateAsync({
        userId: selectedUser.id,
        banned: !selectedUser.banned,
      });

      toast({
        title: selectedUser.banned ? "User Unbanned" : "User Banned",
        description: `${selectedUser.name} has been ${selectedUser.banned ? "unbanned" : "banned"} successfully.`,
      });

      setBanDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error("Error updating user ban status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.mobile_number || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "banned" && user.banned) ||
      (statusFilter === "active" && !user.banned);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleColors: Record<string, string> = {
    viewer: "bg-muted text-muted-foreground border-border",
    user: "bg-muted text-muted-foreground border-border",
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-warning/10 text-warning border-warning/20",
      processing: "bg-primary/10 text-primary border-primary/20",
      delivered: "bg-success/10 text-success border-success/20",
      cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return colors[status] || "bg-muted text-muted-foreground border-border";
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
            Failed to load users. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    user.banned && "bg-destructive/5",
                  )}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground truncate max-w-50">
                          {user.email}
                        </span>
                      </div>
                      {user.mobile_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {user.mobile_number}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={cn("capitalize", roleColors[user.role])}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.banned ? (
                      <Badge variant="destructive" className="capitalize">
                        <Ban className="w-3 h-3 mr-1" />
                        Banned
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-success/10 text-success border-success/20"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-muted-foreground">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          user.banned
                            ? "text-success hover:text-success"
                            : "text-destructive hover:text-destructive",
                        )}
                        onClick={() => {
                          setSelectedUser(user);
                          setBanDialogOpen(true);
                        }}
                      >
                        {user.banned ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Unban
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4 mr-2" />
                            Ban
                          </>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              No users found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          Showing {filteredUsers.length} of {users.length} users
        </span>
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-success rounded-full" />
            Active: {users.filter((u) => !u.banned).length}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-destructive rounded-full" />
            Banned: {users.filter((u) => u.banned).length}
          </span>
        </span>
      </div>

      {/* User Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about the user account
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : selectedUserDetails ? (
            <Tabs defaultValue="profile" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
                <TabsTrigger value="orders">Order History</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={selectedUserDetails.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                          {selectedUserDetails.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {selectedUserDetails.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            className={cn(
                              "capitalize",
                              roleColors[selectedUserDetails.role],
                            )}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            {selectedUserDetails.role}
                          </Badge>
                          {selectedUserDetails.banned ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-success/10 text-success"
                            >
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">
                          Email
                        </label>
                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedUserDetails.email}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">
                          Phone
                        </label>
                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {selectedUserDetails.mobile_number ||
                              "Not provided"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">
                          Member Since
                        </label>
                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {selectedUserDetails.createdAt
                              ? new Date(
                                  selectedUserDetails.createdAt,
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">
                          User ID
                        </label>
                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                          <span className="font-mono text-xs">
                            {selectedUserDetails.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        Total Orders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {selectedUserDetails.stats?.totalOrders || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        Total Spent
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        ₱
                        {(
                          selectedUserDetails.stats?.totalSpent || 0
                        ).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        Completed Orders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {selectedUserDetails.stats?.completedOrders || 0}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Addresses Tab */}
              <TabsContent value="addresses" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Saved Addresses
                    </CardTitle>
                    <CardDescription>
                      {selectedUserDetails.addresses?.length || 0} address(es)
                      on file
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedUserDetails.addresses?.map((address) => (
                        <div
                          key={address.address_id}
                          className="p-4 border border-border rounded-lg relative"
                        >
                          {address.is_default && (
                            <Badge
                              className="absolute top-2 right-2"
                              variant="secondary"
                            >
                              Default
                            </Badge>
                          )}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {address.address_type}
                              </Badge>
                            </div>
                            <p className="text-sm">
                              {address.full_address}
                              {address.purok && `, ${address.purok}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.barangay}, {address.municipality}
                            </p>
                          </div>
                        </div>
                      ))}
                      {selectedUserDetails.addresses?.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          No addresses saved
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5" />
                      Recent Orders
                    </CardTitle>
                    <CardDescription>
                      Last {selectedUserDetails.orders?.length || 0} orders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedUserDetails.orders?.map((order) => (
                        <div
                          key={order.order_id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              Order #{order.order_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              className={cn(
                                "mb-1",
                                getStatusBadge(order.order_status),
                              )}
                            >
                              {order.order_status}
                            </Badge>
                            <p className="text-sm font-semibold">
                              ₱{order.total_amount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {selectedUserDetails.orders?.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          No orders found
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
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
              {selectedUser?.banned ? "Unban User" : "Ban User"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.banned
                ? `Are you sure you want to unban ${selectedUser?.name}? They will be able to access the platform again.`
                : `Are you sure you want to ban ${selectedUser?.name}? They will lose access to the platform immediately.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBanDialogOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={selectedUser?.banned ? "default" : "destructive"}
              onClick={handleBanUser}
              disabled={banUserMutation.isPending}
            >
              {banUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : selectedUser?.banned ? (
                "Unban User"
              ) : (
                "Ban User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
