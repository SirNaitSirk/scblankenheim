"use client";

import { FilePdf, FloppyDisk, Plus, Trash, UploadSimple, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  removeSignatureAction,
  saveReleaseSettingsAction,
  uploadSignatureAction,
} from "@/app/admin/camps/[campId]/infomails/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { de } from "@/lib/admin/messages";
import { cn } from "@/lib/cn";
import { ADDRESS_KEYS_MAX, RELEASE_DATES_MAX, SIGNER_MAX } from "@/lib/school-release/limits";
import { releaseMessages } from "@/lib/school-release/messages";
import { missingForEnable, type AddressFieldOption } from "@/lib/school-release/settings";
import type { ReleaseSettings } from "@/lib/school-release/types";

const t = de.schoolRelease.settings;

/**
 * Per camp settings of the school release letter (specs/020-school-release,
 * US3): switch, dates, signer, address fields and the signature image. The
 * switch stays locked until signature, a date and the signer name exist.
 */
export function ReleaseSettingsCard({
  campId,
  startDate,
  endDate,
  initial,
  signatureUrl,
  addressOptions,
  canWrite,
}: {
  campId: string;
  startDate: string | null;
  endDate: string | null;
  initial: ReleaseSettings;
  signatureUrl: string | null;
  addressOptions: AddressFieldOption[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [dates, setDates] = useState<string[]>(initial.dates);
  const [signerName, setSignerName] = useState(initial.signerName ?? "");
  const [signerRole, setSignerRole] = useState(initial.signerRole ?? "");
  const [addressKeys, setAddressKeys] = useState<string[]>(initial.addressKeys);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [uploading, startUploading] = useTransition();

  const filledDates = dates.filter((date) => date !== "");
  const missing = missingForEnable({
    ...initial,
    enabled,
    dates: filledDates,
    signerName: signerName.trim() || null,
  });
  const locked = missing.length > 0;
  const hasPeriod = Boolean(startDate && endDate);
  const labels = new Map(addressOptions.map((option) => [option.key, option.label]));

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }

  function save() {
    startSaving(async () => {
      const result = await saveReleaseSettingsAction(campId, {
        enabled: enabled && !locked,
        dates: filledDates,
        signerName,
        signerRole,
        addressKeys,
      });
      if (result.ok) {
        setErrors({});
        showToast(t.toast.saved);
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        showToast(result.error);
      }
    });
  }

  function upload(file: File) {
    const formData = new FormData();
    formData.set("signature", file);
    startUploading(async () => {
      const result = await uploadSignatureAction(campId, formData);
      showToast(result.ok ? t.toast.uploaded : result.error);
      if (result.ok) router.refresh();
      if (fileInput.current) fileInput.current.value = "";
    });
  }

  function removeSignature() {
    startUploading(async () => {
      const result = await removeSignatureAction(campId);
      showToast(result.ok ? t.toast.removed : result.error);
      if (result.ok) {
        setEnabled(false);
        router.refresh();
      }
    });
  }

  function toggleAddressKey(key: string) {
    setAddressKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : current.length < ADDRESS_KEYS_MAX
          ? [...current, key]
          : current,
    );
  }

  return (
    <section aria-labelledby="release-settings" className="mt-4 flex flex-col gap-4 pb-24 sm:pb-0">
      <h2 id="release-settings" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t.title}
      </h2>
      <Card className="flex flex-col gap-6 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="font-display text-lg font-bold tracking-tight text-foreground">{t.title}</h3>
            <p className="max-w-prose text-sm text-muted-foreground">{t.intro}</p>
          </div>
          <Switch
            id="release-enabled"
            checked={enabled && !locked}
            onCheckedChange={setEnabled}
            label={t.enabled}
            disabled={!canWrite || locked}
          />
        </div>

        {!canWrite && <p className="text-sm text-muted-foreground">{t.readOnly}</p>}

        {locked && (
          <div className="rounded-input border border-border bg-ink-50 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">{t.lockedTitle}</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {missing.map((item) => (
                <li key={item}>{releaseMessages.missing[item]}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label={t.dates} hint={hasPeriod ? t.datesHint : t.noPeriod} error={errors.dates}>
            <div className="flex flex-col gap-2">
              {dates.map((date, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={date}
                    min={startDate ?? undefined}
                    max={endDate ?? undefined}
                    disabled={!canWrite || !hasPeriod}
                    onChange={(event) =>
                      setDates((current) => current.map((item, i) => (i === index ? event.target.value : item)))
                    }
                    aria-label={`${t.dates} ${index + 1}`}
                  />
                  {canWrite && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      aria-label={t.removeDate}
                      onClick={() => setDates((current) => current.filter((_, i) => i !== index))}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              ))}
              {canWrite && hasPeriod && dates.length < RELEASE_DATES_MAX && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => setDates((current) => [...current, startDate ?? ""])}
                >
                  <Plus size={14} weight="bold" />
                  {t.addDate}
                </Button>
              )}
            </div>
          </Field>

          <div className="flex flex-col gap-4">
            <Field label={t.signerName} htmlFor="release-signer-name">
              <Input
                id="release-signer-name"
                value={signerName}
                maxLength={SIGNER_MAX}
                placeholder={t.signerNamePlaceholder}
                disabled={!canWrite}
                onChange={(event) => setSignerName(event.target.value)}
              />
            </Field>
            <Field label={t.signerRole} htmlFor="release-signer-role">
              <Input
                id="release-signer-role"
                value={signerRole}
                maxLength={SIGNER_MAX}
                placeholder={t.signerRolePlaceholder}
                disabled={!canWrite}
                onChange={(event) => setSignerRole(event.target.value)}
              />
            </Field>
          </div>
        </div>

        <Field label={t.addressKeys} hint={t.addressKeysHint} error={errors.addressKeys}>
          {addressOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noQuestionFields}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {addressOptions.map((option) => {
                const position = addressKeys.indexOf(option.key);
                const selected = position >= 0;
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={selected}
                    disabled={!canWrite || (!selected && addressKeys.length >= ADDRESS_KEYS_MAX)}
                    onClick={() => toggleAddressKey(option.key)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                      selected
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-ink-200 text-muted-foreground hover:border-ink-300",
                    )}
                  >
                    {selected && (
                      <span className="grid h-5 w-5 place-items-center rounded-pill bg-accent text-xs font-semibold text-accent-foreground">
                        {position + 1}
                      </span>
                    )}
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
          {addressKeys.some((key) => !labels.has(key)) && (
            <p className="text-xs text-danger">{t.toast.unknownField}</p>
          )}
        </Field>

        <Field label={t.signature} hint={t.signatureHint}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid h-20 w-48 shrink-0 place-items-center rounded-input border border-dashed border-ink-200 bg-paper p-2">
              {signatureUrl ? (
                // Signed URL of a private object; next/image would cache it beyond its lifetime.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={signatureUrl} alt={t.signatureAlt} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="px-2 text-center text-xs text-muted-foreground">{t.noSignature}</span>
              )}
            </div>
            {canWrite && (
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  id="release-signature"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  <UploadSimple size={14} weight="bold" />
                  {uploading ? t.uploading : initial.signaturePath ? t.replace : t.upload}
                </Button>
                {initial.signaturePath && (
                  <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={removeSignature}>
                    <Trash size={14} />
                    {t.remove}
                  </Button>
                )}
              </div>
            )}
          </div>
        </Field>

        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <ButtonLink
            href={`/api/admin/school-release/preview/${campId}`}
            target="_blank"
            rel="noopener"
            variant="outline"
            size="sm"
            className="self-start"
          >
            <FilePdf size={14} weight="bold" />
            {t.preview}
          </ButtonLink>
          {canWrite && (
            <Button type="button" onClick={save} disabled={saving} className="w-full sm:w-auto">
              <FloppyDisk size={16} weight="bold" />
              {saving ? t.saving : t.save}
            </Button>
          )}
        </div>
      </Card>

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-pill bg-surface-inverse px-4 py-2 text-sm text-on-inverse shadow-pop sm:bottom-6"
        >
          {toast}
        </div>
      )}
    </section>
  );
}
