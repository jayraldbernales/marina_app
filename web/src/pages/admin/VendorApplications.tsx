import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchVendorApplications,
  updateVendorApplicationStatus,
} from "@/lib/applicationService";
import { ApplicationCard } from "@/components/admin/ApplicationCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Store } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type TabStatus = "all" | "pending" | "approved" | "rejected";

export default function VendorApplications() {
  const [activeTab, setActiveTab] = useState<TabStatus>("pending");
  const queryClient = useQueryClient();

  // Fetch all vendor applications
  const { data: allApplications = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ["vendor-applications"],
    queryFn: async () => {
      try {
        return await fetchVendorApplications();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch vendor applications",
        });
        return [];
      }
    },
  });

  // Filter applications based on active tab
  const applications =
    activeTab === "all"
      ? allApplications
      : allApplications.filter((app) => app.approval_status === activeTab);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ userId, notes }: { userId: string; notes?: string }) =>
      updateVendorApplicationStatus(userId, "approved", notes),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor application approved successfully",
      });
      queryClient.invalidateQueries({
        queryKey: ["vendor-applications"],
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to approve vendor application",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ userId, notes }: { userId: string; notes?: string }) =>
      updateVendorApplicationStatus(userId, "rejected", notes),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor application rejected successfully",
      });
      queryClient.invalidateQueries({
        queryKey: ["vendor-applications"],
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to reject vendor application",
      });
    },
  });

  // Calculate statistics
  const stats = {
    total: allApplications.length,
    pending: allApplications.filter((a) => a.approval_status === "pending")
      .length,
    approved: allApplications.filter((a) => a.approval_status === "approved")
      .length,
    rejected: allApplications.filter((a) => a.approval_status === "rejected")
      .length,
  };

  if (isLoadingAll) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Store className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Vendor Applications</h1>
          <p className="text-muted-foreground">
            Review and manage vendor registration applications
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {stats.approved}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications List with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabStatus)}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({stats.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({stats.rejected})
              </TabsTrigger>
            </TabsList>

            {/* All Tab */}
            <TabsContent value="all" className="space-y-4 mt-4">
              {applications.length > 0 ? (
                <div className="grid gap-4">
                  {applications.map((app) => (
                    <ApplicationCard
                      key={app.user_id}
                      application={app}
                      type="vendor"
                      onApprove={(userId, notes) =>
                        approveMutation.mutateAsync({ userId, notes })
                      }
                      onReject={(userId, notes) =>
                        rejectMutation.mutateAsync({ userId, notes })
                      }
                      isLoading={
                        approveMutation.isPending || rejectMutation.isPending
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No vendor applications found
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Pending Tab */}
            <TabsContent value="pending" className="space-y-4 mt-4">
              {applications.length > 0 ? (
                <div className="grid gap-4">
                  {applications.map((app) => (
                    <ApplicationCard
                      key={app.user_id}
                      application={app}
                      type="vendor"
                      onApprove={(userId, notes) =>
                        approveMutation.mutateAsync({ userId, notes })
                      }
                      onReject={(userId, notes) =>
                        rejectMutation.mutateAsync({ userId, notes })
                      }
                      isLoading={
                        approveMutation.isPending || rejectMutation.isPending
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No pending vendor applications
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Approved Tab */}
            <TabsContent value="approved" className="space-y-4 mt-4">
              {applications.length > 0 ? (
                <div className="grid gap-4">
                  {applications.map((app) => (
                    <ApplicationCard
                      key={app.user_id}
                      application={app}
                      type="vendor"
                      onApprove={(userId, notes) =>
                        approveMutation.mutateAsync({ userId, notes })
                      }
                      onReject={(userId, notes) =>
                        rejectMutation.mutateAsync({ userId, notes })
                      }
                      isLoading={
                        approveMutation.isPending || rejectMutation.isPending
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No approved vendor applications
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Rejected Tab */}
            <TabsContent value="rejected" className="space-y-4 mt-4">
              {applications.length > 0 ? (
                <div className="grid gap-4">
                  {applications.map((app) => (
                    <ApplicationCard
                      key={app.user_id}
                      application={app}
                      type="vendor"
                      onApprove={(userId, notes) =>
                        approveMutation.mutateAsync({ userId, notes })
                      }
                      onReject={(userId, notes) =>
                        rejectMutation.mutateAsync({ userId, notes })
                      }
                      isLoading={
                        approveMutation.isPending || rejectMutation.isPending
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No rejected vendor applications
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
