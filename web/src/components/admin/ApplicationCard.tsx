import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";
import type {
  VendorApplication,
  RiderApplication,
} from "@/lib/applicationService";
import { cn } from "@/lib/utils";

interface ApplicationCardProps {
  application: VendorApplication | RiderApplication;
  type: "vendor" | "rider";
  onApprove: (userId: string, notes?: string) => Promise<void>;
  onReject: (userId: string, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "approved":
      return "bg-green-100 text-green-800 border-green-300";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="w-4 h-4" />;
    case "approved":
      return <CheckCircle2 className="w-4 h-4" />;
    case "rejected":
      return <XCircle className="w-4 h-4" />;
    default:
      return null;
  }
};

export const ApplicationCard = ({
  application,
  type,
  onApprove,
  onReject,
  isLoading,
}: ApplicationCardProps) => {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectError, setRejectError] = useState("");
  const [approveError, setApproveError] = useState("");

  const isPending = application.approval_status === "pending";

  const handleApprove = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setApproveError("");

    try {
      console.log(
        `Approving ${type} application for user:`,
        application.user_id,
      );
      await onApprove(application.user_id, approveNotes);
      setShowApproveDialog(false);
      setApproveNotes("");
    } catch (error: any) {
      console.error("Approve error:", error);
      setApproveError(error.message || "Failed to approve application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (isSubmitting) return;

    // Validate reject notes
    if (!rejectNotes.trim()) {
      setRejectError("Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);
    setRejectError("");

    try {
      console.log(
        `Rejecting ${type} application for user:`,
        application.user_id,
      );
      await onReject(application.user_id, rejectNotes);
      setShowRejectDialog(false);
      setRejectNotes("");
    } catch (error: any) {
      console.error("Reject error:", error);
      setRejectError(error.message || "Failed to reject application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name?: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "NA"
    );
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={application.avatar_url} />
                <AvatarFallback className="bg-primary/10 font-semibold">
                  {getInitials(
                    "full_name" in application
                      ? application.full_name
                      : undefined,
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">
                  {type === "vendor"
                    ? (application as VendorApplication).shop_name
                    : (application as RiderApplication).full_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {type === "vendor" ? "Vendor" : "Rider"} Application • ID:{" "}
                  {application.user_id.substring(0, 8)}...
                </p>
              </div>
            </div>
            <Badge
              className={cn(
                "ml-2",
                getStatusStyles(application.approval_status),
              )}
            >
              <span className="mr-1.5 flex">
                {getStatusIcon(application.approval_status)}
              </span>
              {application.approval_status.charAt(0).toUpperCase() +
                application.approval_status.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </div>
              <p className="text-sm font-medium truncate">
                {application.email || "Not provided"}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>Phone</span>
              </div>
              <p className="text-sm font-medium">
                {application.mobile_number || "Not provided"}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-muted-foreground">
                {application.barangay || "No barangay"}
                {application.barangay && application.municipality && ", "}
                {application.municipality || "No municipality"}
                {type === "vendor" &&
                  "purok" in application &&
                  application.purok && (
                    <span className="block text-xs mt-1">
                      Purok: {application.purok}
                    </span>
                  )}
              </p>
            </div>
          </div>

          {/* Type-Specific Information */}
          <div className="space-y-2 pt-2 border-t">
            {type === "vendor" ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GCash Number</span>
                  <span className="font-medium">
                    {(application as VendorApplication).gcash_number}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    Approval Notes
                  </p>
                  <p className="text-sm bg-muted p-2 rounded min-h-10">
                    {application.approval_notes || "No notes yet"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vehicle Type</span>
                  <span className="font-medium">
                    {(application as RiderApplication).vehicle_type}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">License Plate</span>
                  <span className="font-medium uppercase">
                    {(application as RiderApplication).license_plate}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Emergency Contact
                    </span>
                    <p className="font-medium">
                      {(application as RiderApplication).emergency_contact_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Contact Number
                    </span>
                    <p className="font-medium">
                      {
                        (application as RiderApplication)
                          .emergency_contact_number
                      }
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    Approval Notes
                  </p>
                  <p className="text-sm bg-muted p-2 rounded min-h-10">
                    {application.approval_notes || "No notes yet"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Application Date */}
          <div className="text-xs text-muted-foreground pt-2">
            Applied on{" "}
            {new Date(application.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          {/* Actions */}
          {isPending && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setRejectError("");
                  setRejectNotes("");
                  setShowRejectDialog(true);
                }}
                disabled={isLoading || isSubmitting}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  setApproveError("");
                  setApproveNotes("");
                  setShowApproveDialog(true);
                }}
                disabled={isLoading || isSubmitting}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this {type} application? They
              will be able to access their account immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes for the applicant..."
                value={approveNotes}
                onChange={(e) => {
                  setApproveNotes(e.target.value);
                  if (approveError) setApproveError("");
                }}
                className="mt-2"
                rows={3}
              />
            </div>
            {approveError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span>{approveError}</span>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isSubmitting}
              onClick={() => {
                setApproveError("");
                setApproveNotes("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog
        open={showRejectDialog}
        onOpenChange={(open) => {
          setShowRejectDialog(open);
          if (!open) {
            setRejectError("");
            setRejectNotes("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Application</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this {type} application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Reason for Rejection *
              </label>
              <Textarea
                placeholder="Explain why this application is being rejected..."
                value={rejectNotes}
                onChange={(e) => {
                  setRejectNotes(e.target.value);
                  if (rejectError) setRejectError("");
                }}
                className="mt-2"
                rows={3}
                required
              />
            </div>
            {rejectError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span>{rejectError}</span>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isSubmitting}
              onClick={() => {
                setRejectError("");
                setRejectNotes("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Rejecting..." : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
