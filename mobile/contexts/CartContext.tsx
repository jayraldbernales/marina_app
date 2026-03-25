import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type CartContextType = {
  cartItemCount: number;
  refreshCartCount: () => void;
  updateCartCount: (delta: number) => void; // ← add this
};

const CartContext = createContext<CartContextType>({
  cartItemCount: 0,
  refreshCartCount: () => {},
  updateCartCount: () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItemCount, setCartItemCount] = useState(0);

  const fetchCartCount = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: carts } = await supabase
      .from("carts")
      .select("cart_id")
      .eq("user_id", session.user.id);

    if (!carts || carts.length === 0) {
      setCartItemCount(0);
      return;
    }

    const cartIds = carts.map((c) => c.cart_id);

    const { data: items } = await supabase
      .from("cart_items")
      .select("quantity")
      .in("cart_id", cartIds);

    const total = items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    setCartItemCount(total);
  };

  // Optimistically adjust count by a delta (positive or negative)
  const updateCartCount = (delta: number) => {
    setCartItemCount((prev) => Math.max(0, prev + delta));
  };

  useEffect(() => {
    fetchCartCount();

    const subscription = supabase
      .channel("cart-count-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cart_items" },
        () => fetchCartCount(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "carts" },
        () => fetchCartCount(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItemCount,
        refreshCartCount: fetchCartCount,
        updateCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => useContext(CartContext);
