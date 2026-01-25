import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

type RegistrationStatus = {
  isVendorApproved: boolean;
  isRiderApproved: boolean;
  vendorStatus: "pending" | "approved" | "rejected" | "not_registered";
  riderStatus: "pending" | "approved" | "rejected" | "not_registered";
  vendorNotes: string;
  riderNotes: string;
  isLoading: boolean;
};

export const useRegistrationStatus = (): RegistrationStatus => {
  const [status, setStatus] = useState<RegistrationStatus>({
    isVendorApproved: false,
    isRiderApproved: false,
    vendorStatus: "not_registered",
    riderStatus: "not_registered",
    vendorNotes: "",
    riderNotes: "",
    isLoading: true,
  });

  useEffect(() => {
    const fetchRegistrationStatus = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          setStatus((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        const userId = session.user.id;

        // Fetch both vendor and rider status in parallel
        const [vendorResponse, riderResponse] = await Promise.all([
          supabase
            .from("vendor_profiles")
            .select("approval_status, approval_notes") // ADD approval_notes
            .eq("user_id", userId)
            .maybeSingle(),

          supabase
            .from("rider_profiles")
            .select("approval_status, approval_notes") // ADD approval_notes
            .eq("user_id", userId)
            .maybeSingle(),
        ]);

        const vendorStatus =
          vendorResponse.data?.approval_status || "not_registered";
        const riderStatus =
          riderResponse.data?.approval_status || "not_registered";
        const vendorNotes = vendorResponse.data?.approval_notes || "";
        const riderNotes = riderResponse.data?.approval_notes || "";

        setStatus({
          isVendorApproved: vendorStatus === "approved",
          isRiderApproved: riderStatus === "approved",
          vendorStatus,
          riderStatus,
          vendorNotes,
          riderNotes,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching registration status:", error);
        setStatus((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchRegistrationStatus();
  }, []);

  return status;
};
