/**
 * Complete Ocean Theme Color System
 * Converted from Tailwind CSS config to React Native
 * All colors preserved in original HSL format
 */

// Light Mode Colors
export const LIGHT_COLORS = {
  // Core
  background: "hsl(210, 40%, 98%)",
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

// Dark Mode Colors
export const DARK_COLORS = {
  background: "hsl(222.2, 84%, 4.9%)",
  foreground: "hsl(210, 40%, 98%)",
  card: "hsl(222.2, 84%, 4.9%)",
  cardForeground: "hsl(210, 40%, 98%)",
  popover: "hsl(222.2, 84%, 4.9%)",
  popoverForeground: "hsl(210, 40%, 98%)",
  primary: "hsl(210, 40%, 98%)",
  primaryForeground: "hsl(222.2, 47.4%, 11.2%)",
  secondary: "hsl(217.2, 32.6%, 17.5%)",
  secondaryForeground: "hsl(210, 40%, 98%)",
  muted: "hsl(217.2, 32.6%, 17.5%)",
  mutedForeground: "hsl(215, 20.2%, 65.1%)",
  accent: "hsl(217.2, 32.6%, 17.5%)",
  accentForeground: "hsl(210, 40%, 98%)",
  destructive: "hsl(0, 62.8%, 30.6%)",
  destructiveForeground: "hsl(210, 40%, 98%)",
  border: "hsl(217.2, 32.6%, 17.5%)",
  input: "hsl(217.2, 32.6%, 17.5%)",
  ring: "hsl(212.7, 26.8%, 83.9%)",

  // Sidebar (Dark)
  sidebarBackground: "hsl(240, 5.9%, 10%)",
  sidebarForeground: "hsl(240, 4.8%, 95.9%)",
  sidebarPrimary: "hsl(224.3, 76.3%, 48%)",
  sidebarPrimaryForeground: "hsl(0, 0%, 100%)",
  sidebarAccent: "hsl(240, 3.7%, 15.9%)",
  sidebarAccentForeground: "hsl(240, 4.8%, 95.9%)",
  sidebarBorder: "hsl(240, 3.7%, 15.9%)",
  sidebarRing: "hsl(217.2, 91.2%, 59.8%)",
} as const;

// Common colors (not theme-specific)
export const COMMON_COLORS = {
  white: "hsl(0, 0%, 100%)",
  black: "hsl(0, 0%, 0%)",
  transparent: "transparent",
} as const;

// Combined color system
export const COLORS = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
  common: COMMON_COLORS,
} as const;

// Type exports for type-safe usage
export type LightColorKeys = keyof typeof LIGHT_COLORS;
export type DarkColorKeys = keyof typeof DARK_COLORS;
export type CommonColorKeys = keyof typeof COMMON_COLORS;
