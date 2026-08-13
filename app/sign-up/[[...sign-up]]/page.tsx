import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { de } from "@/lib/admin/messages";

export const metadata: Metadata = {
  title: "Registrieren — CampConnect",
};

export default function SignUpPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-canvas px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          {de.brand.name}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {de.brand.panel}
        </span>
      </div>
      <SignUp forceRedirectUrl="/admin" signInUrl="/sign-in" />
    </main>
  );
}
