import { COLORS } from "@/constants/colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof COLORS.light
) {
  // Always use "light" since no dark mode exists yet
  const theme = "light";
  const colorFromProps = props[theme];

  return colorFromProps ?? COLORS[theme][colorName];
}
