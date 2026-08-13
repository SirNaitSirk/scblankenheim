import { ClerkProvider } from "@clerk/nextjs";
import { deDE } from "@clerk/localizations";
import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampConnect — FCG Blankenheim Summercamp",
  description:
    "Online-Anmeldung und Verwaltung für das FCG Blankenheim Summercamp.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${archivo.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-foreground">
        <ClerkProvider localization={deDE} appearance={clerkAppearance}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}