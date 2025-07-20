import { Platform } from "react-native";

type FontWeight = "400" | "500" | "600" | "700";

export const TYPOGRAPHY = {
  heading1: {
    fontSize: 32,
    fontWeight: "700" as FontWeight,
    lineHeight: 40,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as FontWeight,
    lineHeight: 24,
  },
  button: Platform.select({
    ios: { fontSize: 16, fontFamily: "System", fontWeight: "600" },
    android: { fontSize: 16, fontFamily: "sans-serif-medium" },
  }),
} as const;
