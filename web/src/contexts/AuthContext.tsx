import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "admin" | "viewer" | "user";

type AuthContextType = {
  user: any;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
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

  // Restore session on refresh and enforce web roles
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const user = data.session.user;
        const roleValue = await loadRole(user.id);
        // Only allow admin or viewer on web; otherwise sign out
        if (roleValue !== "admin" && roleValue !== "viewer") {
          console.warn("Unauthorized role for web app:", roleValue);
          await supabase.auth.signOut();
          setUser(null);
          setRole(null);
        } else {
          setUser(user);
        }
      }
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
          }
        } else {
          setUser(null);
          setRole(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

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

    if (data) {
      const roleValue = data.role as Role | string;
      setRole(roleValue as Role);
      return roleValue;
    }
    return null;
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const user = (data as any)?.user;
    if (!user) {
      return { success: false, error: "Could not retrieve user after login." };
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
    return { success: true };
  };

  const logout = async () => {
    try {
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
