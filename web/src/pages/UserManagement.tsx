import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User, UserRole } from "@/types";
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
  Mail,
  Shield,
  Loader2,
  Ban,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserWithBan extends User {
  banned?: boolean;
}

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [users, setUsers] = useState<UserWithBan[]>([]);
  const [loading, setLoading] = useState(true);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithBan | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Fetch users from profiles table (excluding admins)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          user_id,
          full_name,
          email,
          role,
          banned,
          created_at
        `,
        )
        .neq("role", "admin") // 👈 Exclude admins
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedUsers: UserWithBan[] = (data || []).map((profile: any) => ({
        id: profile.user_id,
        name: profile.full_name || "Unnamed User",
        email: profile.email || "",
        role: profile.role as UserRole,
        banned: profile.banned || false,
        createdAt: profile.created_at,
      }));

      setUsers(mappedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBanUser = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      const newBanStatus = !selectedUser.banned;

      const { error } = await supabase
        .from("profiles")
        .update({ banned: newBanStatus })
        .eq("user_id", selectedUser.id);

      if (error) throw error;

      // Update local state
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, banned: newBanStatus } : u,
        ),
      );

      toast({
        title: newBanStatus ? "User Banned" : "User Unbanned",
        description: `${selectedUser.name} has been ${newBanStatus ? "banned" : "unbanned"} successfully.`,
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
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            placeholder="Search users by name or email..."
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
                  Email
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
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {user.email}
                      </span>
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
              disabled={isUpdating}
            >
              {isUpdating ? (
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
