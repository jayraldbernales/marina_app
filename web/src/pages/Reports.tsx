// app/admin/user-reports.tsx
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
  Flag,
  User,
  Store,
  Bike,
  AlertTriangle,
  Eye,
  Ban,
  CheckCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Report {
  report_id: string;
  report_type: "buyer" | "seller" | "rider" | "order";
  reported_user_id: string;
  reported_by_user_id: string;
  reason: string;
  description: string;
  order_id: string;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
  reported_user_name?: string;
  reported_by_user_name?: string;
  order_number?: string;
}

interface ReportedEntity {
  id: string;
  name: string;
  role: "buyer" | "vendor" | "rider";
  email: string;
  mobile_number?: string;
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  dismissed_reports: number;
  is_banned: boolean;
  reports: Report[];
  // For vendors
  shop_name?: string;
  // For riders
  vehicle_type?: string;
  license_plate?: string;
}

const fetchReports = async (): Promise<Report[]> => {
  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      *,
      reported_user:reported_user_id(full_name),
      reported_by:reported_by_user_id(full_name),
      orders:order_id(order_number)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((report: any) => ({
    ...report,
    reported_user_name: report.reported_user?.full_name || "Unknown",
    reported_by_user_name: report.reported_by?.full_name || "Unknown",
    order_number: report.orders?.order_number,
  }));
};

const fetchReportedEntities = async (): Promise<ReportedEntity[]> => {
  const reports = await fetchReports();
  const entityMap = new Map<string, ReportedEntity>();

  // First, get all profiles to have user info
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, full_name, email, mobile_number");

  // Get all vendor profiles
  const { data: vendors } = await supabase
    .from("vendor_profiles")
    .select("user_id, shop_name, banned");

  // Get all rider profiles
  const { data: riders } = await supabase
    .from("rider_profiles")
    .select("user_id, vehicle_type, license_plate, banned");

  // Create vendor map for quick lookup
  const vendorMap = new Map();
  vendors?.forEach((v) => vendorMap.set(v.user_id, v));

  // Create rider map for quick lookup
  const riderMap = new Map();
  riders?.forEach((r) => riderMap.set(r.user_id, r));

  // Create profile map
  const profileMap = new Map();
  profiles?.forEach((p) => profileMap.set(p.user_id, p));

  // Process each report and create separate entities per role
  reports.forEach((report) => {
    if (!report.reported_user_id) return;

    let role: "buyer" | "vendor" | "rider" | null = null;
    if (report.report_type === "buyer") role = "buyer";
    else if (report.report_type === "seller") role = "vendor";
    else if (report.report_type === "rider") role = "rider";
    else return; // Skip order reports for entity list

    const entityKey = `${report.reported_user_id}-${role}`;
    const profile = profileMap.get(report.reported_user_id);
    const vendorInfo = vendorMap.get(report.reported_user_id);
    const riderInfo = riderMap.get(report.reported_user_id);

    if (!entityMap.has(entityKey)) {
      let name = profile?.full_name || "Unknown";
      let email = profile?.email || "";
      let mobileNumber = profile?.mobile_number;

      // For vendors, show shop name instead of personal name if available
      if (role === "vendor" && vendorInfo?.shop_name) {
        name = vendorInfo.shop_name;
      }

      entityMap.set(entityKey, {
        id: report.reported_user_id,
        name,
        role,
        email,
        mobile_number: mobileNumber,
        total_reports: 0,
        pending_reports: 0,
        resolved_reports: 0,
        dismissed_reports: 0,
        is_banned:
          role === "vendor"
            ? vendorInfo?.banned || false
            : role === "rider"
              ? riderInfo?.banned || false
              : profile?.banned || false,
        reports: [],
        shop_name: vendorInfo?.shop_name,
        vehicle_type: riderInfo?.vehicle_type,
        license_plate: riderInfo?.license_plate,
      });
    }

    const entity = entityMap.get(entityKey)!;
    entity.total_reports++;
    if (report.status === "pending") entity.pending_reports++;
    if (report.status === "resolved") entity.resolved_reports++;
    if (report.status === "dismissed") entity.dismissed_reports++;
    entity.reports.push(report);
  });

  return Array.from(entityMap.values()).sort(
    (a, b) => b.total_reports - a.total_reports,
  );
};

const updateReportStatus = async ({
  reportId,
  status,
}: {
  reportId: string;
  status: "resolved" | "dismissed";
}) => {
  const { error } = await supabase
    .from("reports")
    .update({
      status,
    })
    .eq("report_id", reportId);

  if (error) throw error;
};

const banEntity = async ({
  userId,
  role,
  banned,
}: {
  userId: string;
  role: "buyer" | "vendor" | "rider";
  banned: boolean;
}) => {
  if (role === "vendor") {
    const { error } = await supabase
      .from("vendor_profiles")
      .update({ banned })
      .eq("user_id", userId);
    if (error) throw error;
  } else if (role === "rider") {
    const { error } = await supabase
      .from("rider_profiles")
      .update({ banned })
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("profiles")
      .update({ banned })
      .eq("user_id", userId);
    if (error) throw error;
  }
};

const UserReports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedEntity, setSelectedEntity] = useState<ReportedEntity | null>(
    null,
  );
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entities = [], isLoading } = useQuery({
    queryKey: ["reported-entities"],
    queryFn: fetchReportedEntities,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["reports"],
    queryFn: fetchReports,
  });

  const updateReportMutation = useMutation({
    mutationFn: updateReportStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["reported-entities"] });
      toast({
        title: "Success",
        description: "Report updated successfully",
      });
      setReportDialogOpen(false);
      setSelectedReport(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update report",
        variant: "destructive",
      });
    },
  });

  const banEntityMutation = useMutation({
    mutationFn: banEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reported-entities"] });
      toast({
        title: "Success",
        description: `${selectedEntity?.name} has been ${selectedEntity?.is_banned ? "unbanned" : "banned"} as a ${selectedEntity?.role}`,
      });
      setBanDialogOpen(false);
      setSelectedEntity(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "buyer":
        return <User className="w-4 h-4" />;
      case "vendor":
        return <Store className="w-4 h-4" />;
      case "rider":
        return <Bike className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "buyer":
        return "bg-primary/10 text-primary border-primary/20";
      case "vendor":
        return "bg-ocean-medium/10 text-ocean-medium border-ocean-medium/20";
      case "rider":
        return "bg-warning/10 text-warning border-warning/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "buyer":
        return <User className="w-3 h-3" />;
      case "seller":
        return <Store className="w-3 h-3" />;
      case "rider":
        return <Bike className="w-3 h-3" />;
      default:
        return <Flag className="w-3 h-3" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            Pending
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            Resolved
          </Badge>
        );
      case "dismissed":
        return <Badge variant="secondary">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredEntities = entities.filter((entity) => {
    const matchesSearch =
      entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entity.mobile_number || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || entity.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    totalEntities: entities.length,
    totalReports: reports.length,
    pendingReports: reports.filter((r) => r.status === "pending").length,
    highRisk: entities.filter((e) => e.total_reports >= 3).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Flag className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.totalReports}
            </p>
            <p className="text-sm text-muted-foreground">Total Reports</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.pendingReports}
            </p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Ban className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.highRisk}
            </p>
            <p className="text-sm text-muted-foreground">
              High Risk (3+ reports)
            </p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-ocean-medium/20 flex items-center justify-center">
            <User className="w-6 h-6 text-ocean-medium" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.totalEntities}
            </p>
            <p className="text-sm text-muted-foreground">Reported Entities</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="buyer">Buyers</SelectItem>
            <SelectItem value="vendor">Vendors</SelectItem>
            <SelectItem value="rider">Riders</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entities Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reports
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Resolved
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Dismissed
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEntities.map((entity) => (
                <tr
                  key={`${entity.id}-${entity.role}`}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    entity.total_reports >= 3 && "bg-destructive/5",
                    entity.is_banned && "bg-destructive/10",
                  )}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        {getRoleIcon(entity.role)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {entity.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entity.email}
                        </p>
                        {entity.shop_name && (
                          <p className="text-xs text-muted-foreground">
                            Shop: {entity.shop_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      className={cn(
                        "capitalize",
                        getRoleBadgeColor(entity.role),
                      )}
                    >
                      {getRoleIcon(entity.role)}
                      <span className="ml-1 capitalize">{entity.role}</span>
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Badge
                      className={cn(
                        "text-base px-3 py-1",
                        entity.total_reports >= 3
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : entity.total_reports >= 1
                            ? "bg-warning/10 text-warning border-warning/20"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {entity.total_reports}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-warning">
                      {entity.pending_reports}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-success">
                      {entity.resolved_reports}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {entity.dismissed_reports}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {entity.is_banned ? (
                      <Badge variant="destructive">
                        <Ban className="w-3 h-3 mr-1" />
                        Banned
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-success/10 text-success"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedEntity(entity);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          entity.is_banned
                            ? "text-success hover:text-success"
                            : "text-destructive hover:text-destructive",
                        )}
                        onClick={() => {
                          setSelectedEntity(entity);
                          setBanDialogOpen(true);
                        }}
                      >
                        {entity.is_banned ? (
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
        {filteredEntities.length === 0 && (
          <div className="p-8 text-center">
            <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reported entities found.</p>
          </div>
        )}
      </div>

      {/* View Reports Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getRoleIcon(selectedEntity?.role || "buyer")}
              <span>Reports for {selectedEntity?.name}</span>
              {selectedEntity && (
                <Badge
                  className={cn(
                    "ml-2 capitalize",
                    getRoleBadgeColor(selectedEntity.role),
                  )}
                >
                  {selectedEntity.role}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Total reports: {selectedEntity?.total_reports} | Pending:{" "}
              {selectedEntity?.pending_reports}
            </DialogDescription>
          </DialogHeader>

          {selectedEntity && (
            <div className="space-y-4 mt-4">
              {selectedEntity.reports.map((report) => (
                <div
                  key={report.report_id}
                  className={cn(
                    "border rounded-lg p-4",
                    report.status === "pending"
                      ? "border-warning/30 bg-warning/5"
                      : report.status === "resolved"
                        ? "border-success/30 bg-success/5"
                        : "border-border bg-muted/10",
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getReportTypeIcon(report.report_type)}
                      <Badge variant="outline" className="capitalize">
                        {report.report_type}
                      </Badge>
                      {getStatusBadge(report.status)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="font-medium text-foreground mb-1">
                    Reason: {report.reason}
                  </p>
                  {report.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {report.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Reported by: {report.reported_by_user_name}
                  </p>
                  {report.order_number && (
                    <p className="text-xs text-muted-foreground">
                      Order: #{report.order_number}
                    </p>
                  )}

                  {report.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReport(report);
                          setReportDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Review Dialog - Compact Design */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-primary" />
              Review Report
            </DialogTitle>
            <DialogDescription>
              Review the details and take action
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-3 mt-2">
              {/* Report Type Badge */}
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="outline" className="capitalize">
                  {getReportTypeIcon(selectedReport.report_type)}
                  <span className="ml-1">{selectedReport.report_type}</span>
                </Badge>
              </div>

              {/* Reason */}
              <div className="py-2 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Reason</p>
                <p className="font-medium text-foreground">
                  {selectedReport.reason}
                </p>
              </div>

              {/* Description - only if exists */}
              {selectedReport.description && (
                <div className="py-2 border-b border-border">
                  <p className="text-sm text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              {/* Reported By */}
              <div className="py-2 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">
                  Reported By
                </p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {selectedReport.reported_by_user_name}
                  </span>
                </div>
              </div>

              {/* Reported User */}
              <div className="py-2 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">
                  Reported User
                </p>
                <div className="flex items-center gap-2">
                  {getReportTypeIcon(selectedReport.report_type)}
                  <span className="text-sm font-medium text-foreground">
                    {selectedReport.reported_user_name}
                  </span>
                </div>
              </div>

              {/* Order Info - if exists */}
              {selectedReport.order_number && (
                <div className="py-2 border-b border-border">
                  <p className="text-sm text-muted-foreground mb-1">Order</p>
                  <p className="text-sm font-mono text-foreground">
                    #{selectedReport.order_number}
                  </p>
                </div>
              )}

              {/* Date */}
              <div className="py-2">
                <p className="text-sm text-muted-foreground mb-1">
                  Reported On
                </p>
                <p className="text-sm text-foreground">
                  {new Date(selectedReport.created_at).toLocaleString()}
                </p>
              </div>

              {/* Action Buttons */}
              <DialogFooter className="gap-2 mt-4 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    updateReportMutation.mutate({
                      reportId: selectedReport.report_id,
                      status: "dismissed",
                    });
                  }}
                  disabled={updateReportMutation.isPending}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Dismiss
                </Button>
                <Button
                  onClick={() => {
                    updateReportMutation.mutate({
                      reportId: selectedReport.report_id,
                      status: "resolved",
                    });
                  }}
                  disabled={updateReportMutation.isPending}
                  className="flex-1"
                >
                  {updateReportMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Resolve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban Confirmation Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {selectedEntity?.is_banned ? "Unban" : "Ban"}{" "}
              {selectedEntity?.role || "User"}
            </DialogTitle>
            <DialogDescription>
              {selectedEntity?.is_banned
                ? `Are you sure you want to unban ${selectedEntity?.name} as a ${selectedEntity?.role}? They will be able to use the platform again.`
                : `Are you sure you want to ban ${selectedEntity?.name} as a ${selectedEntity?.role}? They have ${selectedEntity?.total_reports || 0} total reports (${selectedEntity?.pending_reports || 0} pending).`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBanDialogOpen(false);
                setSelectedEntity(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={selectedEntity?.is_banned ? "default" : "destructive"}
              onClick={() => {
                if (selectedEntity) {
                  banEntityMutation.mutate({
                    userId: selectedEntity.id,
                    role: selectedEntity.role,
                    banned: !selectedEntity.is_banned,
                  });
                }
              }}
              disabled={banEntityMutation.isPending || !selectedEntity}
            >
              {banEntityMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : selectedEntity?.is_banned ? (
                `Unban ${selectedEntity.role}`
              ) : (
                `Ban ${selectedEntity?.role || "User"}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserReports;
