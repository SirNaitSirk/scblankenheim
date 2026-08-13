/**
 * Typed references to the CampConnect design-system tokens.
 *
 * The single source of truth for the values is `app/globals.css` (CSS custom
 * properties + Tailwind `@theme`). This module only names the tokens so TS code
 * can reference them without magic strings. Prefer Tailwind utilities
 * (`bg-accent`, `rounded-card`, ...) in components; use these where a raw
 * `var(...)` string is genuinely needed (e.g. inline styles).
 */

export const cssVar = {
  accent: "var(--accent)",
  accentStrong: "var(--accent-strong)",
  accentForeground: "var(--accent-foreground)",
  foreground: "var(--foreground)",
  mutedForeground: "var(--muted-foreground)",
  surface: "var(--surface)",
  surfaceInverse: "var(--surface-inverse)",
  border: "var(--border)",
  ring: "var(--ring)",
} as const;

export const radius = {
  sm: "var(--radius-sm)",
  input: "var(--radius-input)",
  card: "var(--radius-card)",
  pill: "var(--radius-pill)",
} as const;

export const motion = {
  easeOutExpo: "var(--ease-out-expo)",
  durFast: "150ms",
  dur: "250ms",
} as const;

export type CssVarToken = keyof typeof cssVar;
export type RadiusToken = keyof typeof radius;
