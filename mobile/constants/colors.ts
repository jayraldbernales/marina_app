export const LIGHT_COLORS = {
  // Core
  background: "#D3EAF2",
  foreground: "hsl(210, 40%, 12%)",
  card: "hsl(0, 0%, 100%)",
  cardForeground: "hsl(210, 40%, 12%)",
  popover: "hsl(0, 0%, 100%)",
  popoverForeground: "hsl(210, 40%, 12%)",

  // Primary
  primary: "hsl(210, 100%, 20%)",
  primaryForeground: "hsl(0, 0%, 100%)",
  secondary: "hsl(180, 100%, 85%)",
  secondaryForeground: "hsl(210, 100%, 20%)",
  muted: "hsl(180, 40%, 95%)",
  mutedForeground: "hsl(210, 20%, 50%)",
  accent: "hsl(180, 100%, 70%)",
  accentForeground: "hsl(210, 100%, 20%)",
  destructive: "hsl(14, 85%, 60%)",
  destructiveForeground: "hsl(0, 0%, 100%)",

  // Borders
  border: "hsl(180, 20%, 90%)",
  input: "hsl(180, 20%, 90%)",
  ring: "hsl(180, 100%, 70%)",

  // Ocean Theme
  oceanDeep: "hsl(210, 100%, 15%)",
  oceanPrimary: "hsl(210, 100%, 20%)",
  oceanMedium: "hsl(210, 80%, 35%)",
  oceanLight: "hsl(210, 60%, 85%)",
  ocean: "#0E6280",
  aquaBright: "hsl(180, 100%, 70%)",
  aquaSoft: "hsl(180, 100%, 85%)",
  seafoam: "hsl(180, 40%, 95%)",
  coral: "hsl(14, 85%, 60%)",
  pearl: "hsl(0, 0%, 98%)",

  // Sidebar (Light)
  sidebarBackground: "hsl(0, 0%, 98%)",
  sidebarForeground: "hsl(240, 5.3%, 26.1%)",
  sidebarPrimary: "hsl(240, 5.9%, 10%)",
  sidebarPrimaryForeground: "hsl(0, 0%, 98%)",
  sidebarAccent: "hsl(240, 4.8%, 95.9%)",
  sidebarAccentForeground: "hsl(240, 5.9%, 10%)",
  sidebarBorder: "hsl(220, 13%, 91%)",
  sidebarRing: "hsl(217.2, 91.2%, 59.8%)",
} as const;

// Common colors (not theme-specific)
export const COMMON_COLORS = {
  white: "hsl(0, 0%, 100%)",
  black: "hsl(0, 0%, 0%)",
  transparent: "transparent",
  facebook: "#1877F2",
  gray: "#F5F2F2",
  yellow: "#FFFF00",
} as const;

// Combined color system
export const COLORS = {
  light: LIGHT_COLORS,
  common: COMMON_COLORS,
} as const;

// Type exports for type-safe usage
export type LightColorKeys = keyof typeof LIGHT_COLORS;
export type CommonColorKeys = keyof typeof COMMON_COLORS;
