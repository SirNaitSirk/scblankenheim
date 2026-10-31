import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { appBaseUrl } from "@/lib/email/links";
import { marketingMessages } from "@/lib/marketing/messages";
import "./globals.css";

// Pre-hydration theme resolution for the admin surface: set `data-admin-theme`
// on <html> before first paint so the admin dark theme never flashes. Scoped to
// /admin via the pathname guard, so public pages never carry the attribute.
// Mirrors hooks/use-admin-theme.ts (key `cc-admin-theme`, values light|dark|system).
const adminThemeInitScript = `(function(){try{if(!location.pathname.startsWith("/admin"))return;var c=localStorage.getItem("cc-admin-theme");var d=c==="dark"||((!c||c==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-admin-theme",d?"dark":"light");}catch(e){}})();`;

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

const baseUrl = appBaseUrl();

// Default for every page without its own metadata; link previews read it too.
export const metadata: Metadata = {
  ...(baseUrl ? { metadataBase: new URL(baseUrl) } : {}),
  title: marketingMessages.share.fallbackName,
  description: marketingMessages.share.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${archivo.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-foreground">
        <Script id="admin-theme-init" strategy="beforeInteractive">
          {adminThemeInitScript}
        </Script>
        {children}
      </body>
    </html>
  );
}