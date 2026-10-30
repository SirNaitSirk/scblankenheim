import { TeamClerkProvider } from "@/components/clerk-provider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <TeamClerkProvider>{children}</TeamClerkProvider>;
}
