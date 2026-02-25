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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error } as AuthResult;
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
            // Retry on transient errors
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

            return { error } as AuthResult;
          }

          return { data } as AuthResult;
        } catch (err) {
          lastError = err;
          attempt++;
          if (attempt <= retries) await new Promise((r) => setTimeout(r, 2000));
        }
      }

      return { error: lastError } as AuthResult;
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

        if (accessToken) {
          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken ?? undefined,
            } as any);

          if (sessionError) return { error: sessionError };
          return { data: sessionData };
        }

        // If not tokens, assume code flow and exchange
        let urlWithCode = returnedUrl;
        if (urlWithCode.includes("?") && !urlWithCode.includes("#")) {
          const [base, query] = urlWithCode.split("?");
          urlWithCode = `${base}#${query}`;
        }

        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(urlWithCode);

        if (sessionError) return { error: sessionError };
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
