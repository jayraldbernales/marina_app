import { Stack } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">Page Not Found</ThemedText>
        <ThemedText style={styles.message}>
          The page you're looking for doesn't exist or has been moved.
        </ThemedText>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <ThemedText type="link" style={styles.buttonText}>
            Go Back
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 30,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
  },
});
