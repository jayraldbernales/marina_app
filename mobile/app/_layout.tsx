import * as WebBrowser from "expo-web-browser";
import Toast from "react-native-toast-message";
import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function Layout() {
  return (
    <>
      <View style={styles.toastContainer}>
        <Toast topOffset={60} />
      </View>

      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen
            name="forgot-password"
            options={{ headerShown: true }}
          />
          <Stack.Screen name="reset-password" options={{ headerShown: true }} />
          <Stack.Screen name="terms" options={{ headerShown: true }} />
          <Stack.Screen name="privacy" options={{ headerShown: true }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(seller-tabs)" />
          <Stack.Screen name="(rider-tabs)" />
        </Stack>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999999,
    elevation: 999999,
  },
});
