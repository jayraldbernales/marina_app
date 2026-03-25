import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Rider } from "@/types";

export interface RiderWithBan extends Rider {
  riderBanned?: boolean;
}

export function useRiders() {
  return useQuery({
    queryKey: ["riders"],
    queryFn: async () => {
      // First get all rider profiles
      const { data: riderData, error: riderError } = await supabase
        .from("rider_profiles")
        .select(
          `
          user_id,
          vehicle_type,
          license_plate,
          approval_status,
          is_available,
          banned,
          created_at
        `,
        )
        .order("created_at", { ascending: false });

      if (riderError) throw riderError;

      if (!riderData || riderData.length === 0) {
        return [];
      }

      // Get user profile data separately
      const userIds = riderData.map((r) => r.user_id);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, email, full_name, mobile_number")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      // Create a map of profiles by user_id
      const profileMap = new Map();
      profileData?.forEach((profile) => {
        profileMap.set(profile.user_id, profile);
      });

      // Get delivery counts for each rider
      const deliveryCounts = new Map();

      if (userIds.length > 0) {
        const { data: deliveries } = await supabase
          .from("deliveries")
          .select("rider_user_id")
          .in("rider_user_id", userIds)
          .eq("status", "delivered");

        deliveries?.forEach((d) => {
          deliveryCounts.set(
            d.rider_user_id,
            (deliveryCounts.get(d.rider_user_id) || 0) + 1,
          );
        });
      }

      return riderData.map((rider: any) => {
        const profile = profileMap.get(rider.user_id) || {};

        // Determine status
        let status: "active" | "pending" | "banned" = "pending";
        if (rider.banned) {
          status = "banned";
        } else if (rider.approval_status === "approved") {
          status = "active";
        }

        return {
          id: rider.user_id,
          name: profile?.full_name || "Unnamed Rider",
          email: profile?.email || "",
          mobileNumber: profile?.mobile_number,
          status,
          vehicleType: rider.vehicle_type || "Not specified",
          licensePlate: rider.license_plate || "Not specified",
          isAvailable: rider.is_available || false,
          joinedDate: rider.created_at
            ? new Date(rider.created_at).toLocaleDateString()
            : "",
          deliveryCount: deliveryCounts.get(rider.user_id) || 0,
          totalEarnings: 0,
          riderBanned: rider.banned,
        } as RiderWithBan;
      });
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useRiderDetails(riderId: string | null) {
  return useQuery({
    queryKey: ["riderDetails", riderId],
    queryFn: async () => {
      if (!riderId) return null;

      // Fetch rider profile
      const { data: riderData, error: riderError } = await supabase
        .from("rider_profiles")
        .select(
          `
          user_id,
          vehicle_type,
          license_plate,
          approval_status,
          is_available,
          banned,
          created_at
        `,
        )
        .eq("user_id", riderId)
        .single();

      if (riderError) throw riderError;

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email, full_name, mobile_number")
        .eq("user_id", riderId)
        .single();

      if (profileError) throw profileError;

      // Get delivery count
      const { data: deliveries } = await supabase
        .from("deliveries")
        .select("rider_user_id")
        .eq("rider_user_id", riderId)
        .eq("status", "delivered");

      const deliveryCount = deliveries?.length || 0;

      // Determine status
      let status: "active" | "pending" | "banned" = "pending";
      if (riderData.banned) {
        status = "banned";
      } else if (riderData.approval_status === "approved") {
        status = "active";
      }

      return {
        id: riderData.user_id,
        name: profileData?.full_name || "Unnamed Rider",
        email: profileData?.email || "",
        mobileNumber: profileData?.mobile_number,
        status,
        vehicleType: riderData.vehicle_type || "Not specified",
        licensePlate: riderData.license_plate || "Not specified",
        isAvailable: riderData.is_available || false,
        joinedDate: riderData.created_at
          ? new Date(riderData.created_at).toLocaleDateString()
          : "",
        deliveryCount,
        totalEarnings: 0,
        riderBanned: riderData.banned,
      } as RiderWithBan;
    },
    enabled: !!riderId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useBanRider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      riderId,
      banned,
    }: {
      riderId: string;
      banned: boolean;
    }) => {
      const { error } = await supabase
        .from("rider_profiles")
        .update({ banned })
        .eq("user_id", riderId);

      if (error) throw error;
      return { riderId, banned };
    },
    onSuccess: (data) => {
      // Update riders list cache
      queryClient.setQueryData(
        ["riders"],
        (oldData: RiderWithBan[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((rider) => {
            if (rider.id === data.riderId) {
              const newStatus = data.banned ? "banned" : "active";
              return {
                ...rider,
                status: newStatus,
                riderBanned: data.banned,
              };
            }
            return rider;
          });
        },
      );

      // Update rider details cache if it exists
      queryClient.setQueryData(
        ["riderDetails", data.riderId],
        (oldData: RiderWithBan | undefined) => {
          if (!oldData) return oldData;
          const newStatus = data.banned ? "banned" : "active";
          return {
            ...oldData,
            status: newStatus,
            riderBanned: data.banned,
          };
        },
      );
    },
  });
}
