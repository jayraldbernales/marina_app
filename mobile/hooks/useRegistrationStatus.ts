// hooks/useRegistrationStatus.ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

type RegistrationStatus = {
  isVendorApproved: boolean;
  isRiderApproved: boolean;
  vendorStatus:
    | "pending"
    | "approved"
    | "rejected"
    | "not_registered"
    | "banned";
  riderStatus:
    | "pending"
    | "approved"
    | "rejected"
    | "not_registered"
    | "banned";
  vendorNotes: string;
  riderNotes: string;
  isVendorBanned: boolean;
  isRiderBanned: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

export const useRegistrationStatus = (): RegistrationStatus => {
  const [status, setStatus] = useState<Omit<RegistrationStatus, "refetch">>({
    isVendorApproved: false,
    isRiderApproved: false,
    vendorStatus: "not_registered",
    riderStatus: "not_registered",
    vendorNotes: "",
    riderNotes: "",
    isVendorBanned: false,
    isRiderBanned: false,
    isLoading: true,
  });

  const fetchRegistrationStatus = async () => {
    try {
      setStatus((prev) => ({ ...prev, isLoading: true }));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        setStatus((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const userId = session.user.id;

      const [vendorResponse, riderResponse] = await Promise.all([
        supabase
          .from("vendor_profiles")
          .select("approval_status, approval_notes, banned") // ADD banned field
          .eq("user_id", userId)
          .maybeSingle(),

        supabase
          .from("rider_profiles")
          .select("approval_status, approval_notes, banned") // ADD banned field
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      // Check if banned first - this overrides approval_status
      let vendorStatus =
        vendorResponse.data?.approval_status || "not_registered";
      let riderStatus = riderResponse.data?.approval_status || "not_registered";

      // If banned, override the status
      if (vendorResponse.data?.banned) {
        vendorStatus = "banned";
      }

      if (riderResponse.data?.banned) {
        riderStatus = "banned";
      }

      const vendorNotes = vendorResponse.data?.approval_notes || "";
      const riderNotes = riderResponse.data?.approval_notes || "";

      setStatus({
        isVendorApproved:
          vendorStatus === "approved" && !vendorResponse.data?.banned, // Check not banned
        isRiderApproved:
          riderStatus === "approved" && !riderResponse.data?.banned, // Check not banned
        vendorStatus,
        riderStatus,
        vendorNotes,
        riderNotes,
        isVendorBanned: vendorResponse.data?.banned || false, // ADD THIS
        isRiderBanned: riderResponse.data?.banned || false, // ADD THIS
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching registration status:", error);
      setStatus({
        isVendorApproved: false,
        isRiderApproved: false,
        vendorStatus: "not_registered",
        riderStatus: "not_registered",
        vendorNotes: "",
        riderNotes: "",
        isVendorBanned: false, // ADD THIS
        isRiderBanned: false, // ADD THIS
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    fetchRegistrationStatus();
  }, []);

  return { ...status, refetch: fetchRegistrationStatus };
};
