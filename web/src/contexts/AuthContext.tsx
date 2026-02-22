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
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isHandlingAuthRef = useRef(false);
  const isInitializingRef = useRef(true); // 👈 NEW: tracks if init is still running

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
          const user = data.session.user;
          const roleValue = await loadRole(user.id);
          if (!mounted) return;

          if (roleValue !== "admin" && roleValue !== "viewer") {
            console.warn("Unauthorized role for web app:", roleValue);
            await supabase.auth.signOut();
            setUser(null);
            setRole(null);
          } else {
            setUser(user);
            setRole(roleValue);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) {
          isInitializingRef.current = false; // 👈 Mark init as done
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // 👇 Skip listener entirely while initializeAuth is still running
        if (isInitializingRef.current) return;
        if (isHandlingAuthRef.current) return;

        isHandlingAuthRef.current = true;

        try {
          console.log("Auth state changed:", event, session?.user?.email);

          if (event === "SIGNED_OUT") {
            setUser(null);
            setRole(null);
            setIsLoading(false);
            return;
          }

          if (session?.user) {
            const user = session.user;
            const roleValue = await loadRole(user.id);

            if (roleValue !== "admin" && roleValue !== "viewer") {
              console.warn("Unauthorized role for web app:", roleValue);
              await supabase.auth.signOut();
              setUser(null);
              setRole(null);
            } else {
              setUser(user);
              setRole(roleValue);
            }
          } else {
            setUser(null);
            setRole(null);
          }
        } catch (error) {
          console.error("Auth state change error:", error);
        } finally {
          isHandlingAuthRef.current = false;
          setIsLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      try {
        listener?.subscription?.unsubscribe();
      } catch (err) {
        // ignore
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const user = data?.user;
      if (!user) {
        return {
          success: false,
          error: "Could not retrieve user after login.",
        };
      }

      const roleValue = await loadRole(user.id);
      if (roleValue !== "admin" && roleValue !== "viewer") {
        await supabase.auth.signOut();
        return {
          success: false,
          error:
            "Access denied: only admin or viewer can sign in on the web app.",
        };
      }

      setUser(user);
      setRole(roleValue);
      return { success: true };
    } catch (err: any) {
      console.error("Login error:", err);
      return { success: false, error: err?.message || "Login failed" };
    }
  };

  const logout = async () => {
    try {
      isHandlingAuthRef.current = true;
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setRole(null);

      if (error) {
        console.error("Error signing out:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error("Logout failed:", err);
      setUser(null);
      setRole(null);
      return { success: false, error: err?.message || String(err) };
    } finally {
      isHandlingAuthRef.current = false;
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
