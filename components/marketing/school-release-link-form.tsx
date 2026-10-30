"use client";

import { CheckCircle } from "@phosphor-icons/react";
import { useActionState } from "react";
import { requestParticipantLinkAction, type ParticipantLinkState } from "@/app/actions/participant-link";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { releaseMessages } from "@/lib/school-release/messages";

const copy = releaseMessages.landing;

/** Email field of the landing release section; the answer is always neutral. */
export function SchoolReleaseLinkForm() {
  const [state, action, pending] = useActionState<ParticipantLinkState, FormData>(
    requestParticipantLinkAction,
    { status: "idle" },
  );

  if (state.status === "done") {
    return (
      <p
        role="status"
        className="mt-5 flex items-start gap-3 rounded-input border border-amber-100 bg-sand-50 px-4 py-3 text-sm leading-relaxed text-foreground"
      >
        <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
        {copy.done}
      </p>
    );
  }

  return (
    <form action={action} className="mt-5 flex flex-col gap-4">
      <input type="hidden" name="target" value="school_release" />
      <Field
        label={copy.email}
        htmlFor="release-link-email"
        error={state.status === "error" ? state.error : undefined}
      >
        <Input
          id="release-link-email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          inputMode="email"
          className="h-12 text-base"
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? copy.submitting : copy.submit}
      </Button>
    </form>
  );
}
