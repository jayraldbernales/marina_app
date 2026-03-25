import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type RiderDeliveryContextType = {
  pendingDeliveryCount: number;
  refreshPendingDeliveries: () => void;
};

const RiderDeliveryContext = createContext<RiderDeliveryContextType>({
  pendingDeliveryCount: 0,
  refreshPendingDeliveries: () => {},
});

export const RiderDeliveryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [pendingDeliveryCount, setPendingDeliveryCount] = useState(0);

  const fetchPendingDeliveries = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setPendingDeliveryCount(0);
      return;
    }

    // Check if user is actually a rider
    const { data: riderProfile } = await supabase
      .from("rider_profiles")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!riderProfile) {
      setPendingDeliveryCount(0);
      return;
    }

    // Count deliveries with status "pending" assigned to this rider
    const { count, error } = await supabase
      .from("deliveries")
      .select("*", { count: "exact", head: true })
      .eq("rider_user_id", session.user.id)
      .eq("status", "pending");

    if (error) {
      console.error("Error fetching pending deliveries:", error);
      return;
    }

    setPendingDeliveryCount(count ?? 0);
  };

  useEffect(() => {
    fetchPendingDeliveries();
    const pollInterval = setInterval(fetchPendingDeliveries, 30000);
    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchPendingDeliveries();
      } else {
        setPendingDeliveryCount(0);
      }
    });

    const realtimeSub = supabase
      .channel("rider-deliveries-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deliveries" },
        () => fetchPendingDeliveries(),
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      authSub.unsubscribe();
      supabase.removeChannel(realtimeSub);
    };
  }, []);

  return (
    <RiderDeliveryContext.Provider
      value={{
        pendingDeliveryCount,
        refreshPendingDeliveries: fetchPendingDeliveries,
      }}
    >
      {children}
    </RiderDeliveryContext.Provider>
  );
};

export const useRiderDeliveryContext = () => useContext(RiderDeliveryContext);
