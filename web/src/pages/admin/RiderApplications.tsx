import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRiderApplications,
  updateRiderApplicationStatus,
} from "@/lib/applicationService";
import { ApplicationCard } from "@/components/admin/ApplicationCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type TabStatus = "all" | "pending" | "approved" | "rejected";

export default function RiderApplications() {
  const [activeTab, setActiveTab] = useState<TabStatus>("pending");
  const queryClient = useQueryClient();

  // Fetch all rider applications
  const {
    data: allApplications = [],
    isLoading: isLoadingAll,
    error,
  } = useQuery({
    queryKey: ["rider-applications"],
    queryFn: async () => {
      try {
        return await fetchRiderApplications();
      } catch (error) {
        console.error("Error fetching rider applications:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Filter applications based on active tab
  const applications =
    activeTab === "all"
      ? allApplications
      : allApplications.filter((app) => app.approval_status === activeTab);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ userId, notes }: { userId: string; notes?: string }) =>
      updateRiderApplicationStatus(userId, "approved", notes),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Rider application approved successfully",
      });
      queryClient.invalidateQueries({
        queryKey: ["rider-applications"],
      });
      queryClient.invalidateQueries({
        queryKey: ["riders"],
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to approve rider application",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ userId, notes }: { userId: string; notes?: string }) =>
      updateRiderApplicationStatus(userId, "rejected", notes),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Rider application rejected successfully",
      });
      queryClient.invalidateQueries({
        queryKey: ["rider-applications"],
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to reject rider application",
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
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p className="text-destructive">Failed to load rider applications</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Rider Applications</h1>
          <p className="text-muted-foreground">
            Review and manage rider registration applications
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

            {["all", "pending", "approved", "rejected"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
                {applications.length > 0 ? (
                  <div className="grid gap-4">
                    {applications.map((app) => (
                      <ApplicationCard
                        key={app.user_id}
                        application={app}
                        type="rider"
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
                      No {tab === "all" ? "" : tab} rider applications found
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
