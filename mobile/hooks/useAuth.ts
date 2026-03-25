// hooks/useAuth.ts
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { supabase } from "../lib/supabase";
import { useCallback, useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";

WebBrowser.maybeCompleteAuthSession();

export type AuthResult<T = any> = {
  data?: T | null;
  error?: any;
};

// Build redirect URI based on environment
function makeRedirectUri() {
  if (__DEV__) {
    return AuthSession.makeRedirectUri({ useProxy: true } as any);
  }

  return AuthSession.makeRedirectUri({
    scheme: "marina",
    path: "/auth/callback",
    preferLocalhost: false,
  });
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ Centralized ban check (used everywhere)
  const checkIfBanned = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("banned")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      await supabase.auth.signOut();
      return { error };
    }

    if (profile?.banned) {
      await supabase.auth.signOut();
      return { error: new Error("Your account has been banned.") };
    }

    return { success: true };
  };

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };
      if (!data?.user) return { error: new Error("Authentication failed.") };

      // 🔎 Check ban
      const banCheck = await checkIfBanned(data.user.id);
      if ((banCheck as any)?.error) return banCheck;

      return { data };
    },
    [],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      options?: { fullName?: string; redirectTo?: string },
      retries = 2,
    ) => {
      const redirectTo = options?.redirectTo ?? makeRedirectUri();

      let attempt = 0;
      let lastError: any = null;

      while (attempt <= retries) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectTo,
              data: { full_name: options?.fullName },
            },
          });

          if (error) {
            lastError = error;
            const errStr = (error.message || "").toLowerCase();

            if (
              attempt < retries &&
              (errStr.includes("timeout") ||
                errStr.includes("temporarily unavailable") ||
                error.status === 504)
            ) {
              attempt++;
              await new Promise((r) => setTimeout(r, 2000));
              continue;
            }

            return { error };
          }

          // 🔍 Check if user already exists (no error but user is null)
          if (!data?.user && data?.session === null) {
            // This usually means the user already exists
            return {
              error: new Error(
                "This email is already registered. Please sign in instead.",
              ),
            };
          }

          // Check if user already has an identity (another way to check)
          if (data?.user?.identities?.length === 0) {
            return {
              error: new Error(
                "This email is already registered. Please sign in instead.",
              ),
            };
          }

          return { data };
        } catch (err) {
          lastError = err;
          attempt++;
          if (attempt <= retries) await new Promise((r) => setTimeout(r, 2000));
        }
      }

      return { error: lastError };
    },
    [],
  );
  const signInWithOAuth = useCallback(async (provider: string) => {
    try {
      const redirectTo = makeRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error) return { error };
      if (!data?.url)
        return { error: new Error("No OAuth URL returned from provider") };

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );

      if (result.type === "success" && result.url) {
        const returnedUrl = result.url;
        const fragment = (returnedUrl.split("#")[1] || "").trim();
        const queryFragment = fragment || returnedUrl.split("?")[1] || "";
        const params = new URLSearchParams(queryFragment);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        let sessionData: any = null;
        let sessionError: any = null;

        if (accessToken) {
          const response = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? undefined,
          } as any);

          sessionData = response.data;
          sessionError = response.error;
        } else {
          // Code flow
          let urlWithCode = returnedUrl;
          if (urlWithCode.includes("?") && !urlWithCode.includes("#")) {
            const [base, query] = urlWithCode.split("?");
            urlWithCode = `${base}#${query}`;
          }

          const response =
            await supabase.auth.exchangeCodeForSession(urlWithCode);

          sessionData = response.data;
          sessionError = response.error;
        }

        if (sessionError) return { error: sessionError };

        const user = sessionData?.session?.user;
        if (!user)
          return { error: new Error("No user returned from session.") };

        // 🔎 Check ban after OAuth login
        const banCheck = await checkIfBanned(user.id);
        if ((banCheck as any)?.error) return banCheck;

        return { data: sessionData };
      }

      return { error: new Error("OAuth flow cancelled or failed") };
    } catch (err) {
      return { error: err };
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return {
    user,
    session,
    loading,
    signInWithPassword,
    signUp,
    signInWithOAuth,
    signOut,
    makeRedirectUri,
  };
}
