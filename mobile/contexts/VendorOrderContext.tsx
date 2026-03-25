import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type VendorOrderContextType = {
  pendingOrderCount: number;
  refreshPendingOrders: () => void;
};

const VendorOrderContext = createContext<VendorOrderContextType>({
  pendingOrderCount: 0,
  refreshPendingOrders: () => {},
});

export const VendorOrderProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  const fetchPendingOrders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setPendingOrderCount(0);
      return;
    }

    // Check if user is actually a vendor
    const { data: vendorProfile } = await supabase
      .from("vendor_profiles")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!vendorProfile) {
      setPendingOrderCount(0);
      return;
    }

    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("vendor_user_id", session.user.id)
      .eq("order_status", "pending");

    if (error) {
      console.error("Error fetching pending orders:", error);
      return;
    }

    setPendingOrderCount(count ?? 0);
  };

  useEffect(() => {
    fetchPendingOrders();

    // Re-fetch on auth state change
    const {
      data: { subscription: authSub },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchPendingOrders();
      } else {
        setPendingOrderCount(0);
      }
    });

    // Realtime subscription on orders table
    const realtimeSub = supabase
      .channel("vendor-orders-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchPendingOrders(),
      )
      .subscribe();

    return () => {
      authSub.unsubscribe();
      supabase.removeChannel(realtimeSub);
    };
  }, []);

  return (
    <VendorOrderContext.Provider
      value={{ pendingOrderCount, refreshPendingOrders: fetchPendingOrders }}
    >
      {children}
    </VendorOrderContext.Provider>
  );
};

export const useVendorOrderContext = () => useContext(VendorOrderContext);
