import * as AuthSession from "expo-auth-session";

export function getMobileRedirectUri() {
  if (__DEV__) {
    return AuthSession.makeRedirectUri({ useProxy: true } as any);
  }
  return AuthSession.makeRedirectUri({
    scheme: "marina",
    path: "/auth/callback",
    preferLocalhost: false,
  });
}
