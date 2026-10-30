import { ClerkProvider } from "@clerk/nextjs";
import { deDE } from "@clerk/localizations";

// Clerk appearance mapped to the CampConnect design tokens (see app/globals.css).
const clerkAppearance = {
  variables: {
    colorPrimary: "#e8933a", // --amber-500
    colorText: "#0a0a0b", // --ink-950
    colorTextSecondary: "#6b6b73", // --ink-500
    colorBackground: "#ffffff", // --paper
    colorInputBackground: "#ffffff",
    colorDanger: "#b23b3b", // --danger
    borderRadius: "10px", // --radius-input
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  },
  elements: {
    card: "shadow-none border border-border rounded-card",
    formButtonPrimary:
      "rounded-pill font-medium normal-case hover:opacity-90",
    footerActionLink: "text-accent-strong hover:text-accent-strong",
  },
} as const;

// Wraps only the team surfaces (admin, sign in, sign up), so public pages load
// no Clerk script and set no Clerk cookies. proxy.ts still reads the session
// on the server for the prelaunch gate.
export function TeamClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={deDE} appearance={clerkAppearance}>
      {children}
    </ClerkProvider>
  );
}
