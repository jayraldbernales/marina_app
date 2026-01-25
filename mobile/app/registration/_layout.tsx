import { Stack } from "expo-router";

export default function RegistrationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="pending-vendor" />
      <Stack.Screen name="rejected-vendor" />
      <Stack.Screen name="pending-rider" />
      <Stack.Screen name="rejected-rider" />
      <Stack.Screen name="rider-registration" />
      <Stack.Screen name="vendor-registration" />
      <Stack.Screen name="welcome-rider" />
      <Stack.Screen name="welcome-vendor" />
    </Stack>
  );
}
