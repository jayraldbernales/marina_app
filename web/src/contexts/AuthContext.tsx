import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "admin" | "viewer" | "user";

type AuthContextType = {
  user: any;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isInitializingRef = useRef(true);
  const isLoggingOutRef = useRef(false);
  const listenerLockRef = useRef(false);

  const loadRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();
    if (error) {
      console.error("Error loading role:", error);
      return null;
    }
    return data?.role as Role | null;
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        if (data.session?.user) {
          const sessionUser = data.session.user;
          const roleValue = await loadRole(sessionUser.id);
          if (!mounted) return;

          if (roleValue !== "admin" && roleValue !== "viewer") {
            console.warn("Unauthorized role:", roleValue);
            await supabase.auth.signOut();
            setUser(null);
            setRole(null);
          } else {
            setUser(sessionUser);
            setRole(roleValue);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) {
          isInitializingRef.current = false;
          setIsLoading(false); // ← only set false here, NEVER set true again after this
        }
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isInitializingRef.current) return;
        if (isLoggingOutRef.current) return;
        if (listenerLockRef.current) return;

        // TOKEN_REFRESHED: just update the user object, don't re-fetch role
        // The role hasn't changed — avoid a DB round-trip that causes loading flicker
        if (event === "TOKEN_REFRESHED") {
          if (session?.user) {
            setUser(session.user); // update user with fresh token data
          }
          return; // ← exit early, no DB call, no loading state change
        }

        if (event === "SIGNED_OUT") {
          setUser(null);
          setRole(null);
          return;
        }

        // Only lock for events that need a DB call (SIGNED_IN, USER_UPDATED, etc.)
        listenerLockRef.current = true;
        try {
          console.log("Auth state changed:", event, session?.user?.email);

          if (session?.user) {
            const sessionUser = session.user;
            const roleValue = await loadRole(sessionUser.id);

            if (!mounted) return;

            if (roleValue !== "admin" && roleValue !== "viewer") {
              console.warn("Unauthorized role:", roleValue);
              await supabase.auth.signOut();
              setUser(null);
              setRole(null);
            } else {
              setUser(sessionUser);
              setRole(roleValue);
            }
          } else {
            setUser(null);
            setRole(null);
          }
        } catch (error) {
          console.error("Auth state change error:", error);
        } finally {
          listenerLockRef.current = false;
          // NOTE: never set isLoading here — init already completed
        }
      },
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { success: false, error: error.message };

      const sessionUser = data?.user;
      if (!sessionUser) {
        return {
          success: false,
          error: "Could not retrieve user after login.",
        };
      }

      const roleValue = await loadRole(sessionUser.id);
      if (roleValue !== "admin" && roleValue !== "viewer") {
        await supabase.auth.signOut();
        return {
          success: false,
          error: "Access denied: only admin or viewer can sign in.",
        };
      }

      setUser(sessionUser);
      setRole(roleValue);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Login failed" };
    }
  };

  const logout = async () => {
    try {
      isLoggingOutRef.current = true; // block listener BEFORE signOut fires events
      const { error } = await supabase.auth.signOut();

      setUser(null);
      setRole(null);

      if (error) {
        console.error("Error signing out:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      setUser(null);
      setRole(null);
      return { success: false, error: err?.message || String(err) };
    } finally {
      isLoggingOutRef.current = false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
