import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { User, UserRole } from "@/types";

export interface UserWithBan extends User {
  banned?: boolean;
  mobile_number?: string;
  avatar_url?: string;
}

export interface UserDetails extends UserWithBan {
  addresses?: Array<{
    address_id: string;
    full_address: string;
    purok: string;
    barangay: string;
    municipality: string;
    address_type: string;
    is_default: boolean;
  }>;
  orders?: Array<{
    order_id: string;
    order_number: string;
    total_amount: number;
    order_status: string;
    created_at: string;
  }>;
  stats?: {
    totalOrders: number;
    totalSpent: number;
    completedOrders: number;
  };
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          user_id,
          full_name,
          email,
          role,
          banned,
          created_at,
          mobile_number,
          avatar_url
        `,
        )
        .neq("role", "admin")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((profile: any) => ({
        id: profile.user_id,
        name: profile.full_name || "Unnamed User",
        email: profile.email || "",
        role: profile.role as UserRole,
        banned: profile.banned || false,
        createdAt: profile.created_at,
        mobile_number: profile.mobile_number,
        avatar_url: profile.avatar_url,
      })) as UserWithBan[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useUserDetails(userId: string | null) {
  return useQuery({
    queryKey: ["userDetails", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError) throw profileError;

      // Fetch user addresses
      const { data: addresses, error: addressesError } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });

      if (addressesError) throw addressesError;

      // Fetch user orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          order_id,
          order_number,
          total_amount,
          order_status,
          created_at
        `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;

      // Calculate stats
      const totalOrders = orders?.length || 0;
      const totalSpent =
        orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const completedOrders =
        orders?.filter((o) => o.order_status === "delivered").length || 0;

      return {
        id: userId,
        name: profile.full_name || "Unnamed User",
        email: profile.email || "",
        role: profile.role as UserRole,
        banned: profile.banned || false,
        createdAt: profile.created_at,
        mobile_number: profile.mobile_number,
        avatar_url: profile.avatar_url,
        addresses: addresses || [],
        orders: orders || [],
        stats: {
          totalOrders,
          totalSpent,
          completedOrders,
        },
      } as UserDetails;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      banned,
    }: {
      userId: string;
      banned: boolean;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ banned })
        .eq("user_id", userId);

      if (error) throw error;
      return { userId, banned };
    },
    onSuccess: (data) => {
      // Update the users cache
      queryClient.setQueryData(
        ["users"],
        (oldData: UserWithBan[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((user) =>
            user.id === data.userId ? { ...user, banned: data.banned } : user,
          );
        },
      );

      // Also update user details cache if it exists
      queryClient.setQueryData(
        ["userDetails", data.userId],
        (oldData: UserDetails | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, banned: data.banned };
        },
      );
    },
  });
}
