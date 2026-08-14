import { CheckCircle, EnvelopeSimple, Warning } from "@phosphor-icons/react/dist/ssr";
import { currentUser } from "@clerk/nextjs/server";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageBody } from "@/components/admin/page-header";
import { getCurrentProfile, provisionInvitedProfile } from "@/lib/admin/data";
import { de } from "@/lib/admin/messages";
import type { InvitationMetadata } from "@/lib/admin/types";

// Reads the access grant Clerk transferred from the invitation onto the accepted
// user's public metadata. Returns null when it is absent or malformed (the data
// layer then falls back to the pending `admin_invitations` row by e-mail).
function readInvitationMeta(
  publicMetadata: Record<string, unknown>,
): InvitationMetadata | null {
  const role = publicMetadata.role;
  if (role !== "admin" && role !== "superadmin") return null;
  const asStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  return {
    role,
    permissions: asStringArray(publicMetadata.permissions),
    visibleTabs: asStringArray(publicMetadata.visibleTabs),
  };
}

export default async function AcceptInvitationPage() {
  const clerkUser = await currentUser();
  const t = de.users.accept;

  if (!clerkUser) {
    return (
      <AcceptCard
        icon="mail"
        title={t.title}
        body={t.signInRequired}
        cta={{ href: "/sign-in", label: t.signInCta }}
      />
    );
  }

  // Already linked → nothing to provision.
  const existing = await getCurrentProfile();
  if (existing) {
    return (
      <AcceptCard
        icon="check"
        title={t.alreadyTitle}
        body={t.alreadyBody}
        cta={{ href: "/admin", label: t.cta }}
      />
    );
  }

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const name = clerkUser.fullName || clerkUser.username || null;
  const meta = readInvitationMeta(
    (clerkUser.publicMetadata ?? {}) as Record<string, unknown>,
  );

  const provisioned = email
    ? await provisionInvitedProfile(clerkUser.id, email, name, meta)
    : false;

  if (!provisioned) {
    return (
      <AcceptCard
        icon="warn"
        title={t.noneTitle}
        body={t.noneBody}
        cta={{ href: "/admin", label: t.cta }}
      />
    );
  }

  return (
    <AcceptCard
      icon="check"
      title={t.successTitle}
      body={t.successBody}
      cta={{ href: "/admin", label: t.cta }}
    />
  );
}

function AcceptCard({
  icon,
  title,
  body,
  cta,
}: {
  icon: "check" | "warn" | "mail";
  title: string;
  body: string;
  cta: { href: string; label: string };
}) {
  const Glyph =
    icon === "check" ? CheckCircle : icon === "warn" ? Warning : EnvelopeSimple;
  const tone =
    icon === "check"
      ? "bg-success/10 text-success"
      : icon === "warn"
        ? "bg-danger/10 text-danger"
        : "bg-ink-100 text-ink-500";

  return (
    <PageBody>
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Card className="flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-pill ${tone}`}
          >
            <Glyph size={26} weight="fill" />
          </span>
          <div className="flex flex-col gap-1.5">
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
          <ButtonLink href={cta.href} size="sm" className="mt-1">
            {cta.label}
          </ButtonLink>
        </Card>
      </div>
    </PageBody>
  );
}
