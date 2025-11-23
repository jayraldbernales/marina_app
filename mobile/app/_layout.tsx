import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();

import { Stack } from "expo-router";

export default function Layout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="terms" options={{ headerShown: true }} />
        <Stack.Screen name="privacy" options={{ headerShown: true }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
