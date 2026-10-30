"use client";

import { ArrowClockwise, CheckCircle, CloudSlash, XCircle } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { scanBusTicket } from "@/app/admin/bus/actions";
import { Button } from "@/components/ui/button";
import { parseTicketCode } from "@/lib/bus/code";
import { DECODE_INTERVAL_MS, RESULT_DISPLAY_MS } from "@/lib/bus/limits";
import { busMessages as copy } from "@/lib/bus/messages";
import { cn } from "@/lib/cn";
import { formatTimeBerlin } from "@/lib/format";
import type { ScanOutcome, Trip } from "@/lib/bus/types";

type CameraState = "starting" | "running" | "denied" | "missing" | "insecure" | "error";

type Shown = { tone: "ok" | "bad" | "offline"; title: string; name: string | null; reference: string | null; paymentOpen: boolean };

type Decode = (frame: HTMLVideoElement) => Promise<string | null>;

// Minimal typing of the native detector, which TypeScript's DOM lib does not ship.
type NativeDetector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type NativeDetectorClass = {
  new (options: { formats: string[] }): NativeDetector;
  getSupportedFormats?: () => Promise<string[]>;
};

const MAX_FRAME_WIDTH = 640;

/** Native `BarcodeDetector` where it reads QR codes, otherwise `jsqr` on a canvas (research R3). */
async function createDecoder(): Promise<Decode> {
  const Native = (window as unknown as { BarcodeDetector?: NativeDetectorClass }).BarcodeDetector;
  if (Native) {
    const formats = (await Native.getSupportedFormats?.().catch(() => [])) ?? [];
    if (formats.includes("qr_code")) {
      const detector = new Native({ formats: ["qr_code"] });
      return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
    }
  }
  const jsQR = (await import("jsqr")).default;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  return async (video) => {
    if (!context || video.videoWidth === 0) return null;
    const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" })?.data ?? null;
  };
}

function toShown(outcome: ScanOutcome): Shown {
  switch (outcome.kind) {
    case "boarded":
      return { tone: "ok", title: copy.outcome.boarded, name: outcome.name, reference: outcome.reference, paymentOpen: outcome.paymentOpen };
    case "already":
      return { tone: "bad", title: copy.outcome.already(formatTimeBerlin(outcome.at)), name: outcome.name, reference: outcome.reference, paymentOpen: false };
    case "no_ticket":
    case "cancelled":
      return { tone: "bad", title: copy.outcome[outcome.kind], name: outcome.name, reference: outcome.reference, paymentOpen: false };
    default:
      return { tone: "bad", title: copy.outcome[outcome.kind], name: null, reference: null, paymentOpen: false };
  }
}

const OFFLINE: Shown = { tone: "offline", title: copy.outcome.offline, name: null, reference: null, paymentOpen: false };

/**
 * Camera scanner of the bus page (specs/021-bus-ticket, US2). Decoding pauses
 * while a request runs and while a result is shown; the server alone decides
 * the result, and without an answer nothing is guessed (FR-020).
 */
export function BusScanner({
  trip,
  active,
  pendingCode,
  onCodeHandled,
  onChange,
}: {
  trip: Trip;
  active: boolean;
  pendingCode: string | null;
  onCodeHandled: () => void;
  onChange: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const busyRef = useRef(false);
  const [camera, setCamera] = useState<CameraState>("starting");
  const [attempt, setAttempt] = useState(0);
  const [shown, setShown] = useState<Shown | null>(null);
  const [checking, setChecking] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
    setShown(null);
    busyRef.current = false;
  }, []);

  const check = useCallback(
    async (code: string) => {
      busyRef.current = true;
      setChecking(true);
      let next: Shown;
      try {
        const result = await scanBusTicket({ code, trip });
        next = result.ok ? toShown(result.outcome) : { ...OFFLINE, title: result.error };
      } catch {
        next = OFFLINE;
      }
      setChecking(false);
      setShown(next);
      navigator.vibrate?.(next.tone === "ok" ? 80 : [60, 60, 60]);
      onChange();
      hideTimer.current = window.setTimeout(dismiss, RESULT_DISPLAY_MS);
    },
    [trip, onChange, dismiss],
  );

  // The camera loop reads the latest `check` through a ref, so a new trip does not restart the camera.
  const checkRef = useRef(check);
  useEffect(() => {
    checkRef.current = check;
  }, [check]);

  // A code from the URL (phone camera opened the page) is checked once.
  useEffect(() => {
    if (!pendingCode) return;
    const timer = window.setTimeout(() => {
      onCodeHandled();
      void check(pendingCode);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pendingCode, onCodeHandled, check]);

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let timer: number | null = null;
    let stopped = false;

    async function start() {
      // Browsers hide the camera API on plain http (for example a dev server opened by its network address).
      if (!window.isSecureContext) {
        setCamera("insecure");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamera("missing");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "";
        setCamera(name === "NotAllowedError" ? "denied" : name === "NotFoundError" ? "missing" : "error");
        return;
      }
      if (stopped || !videoRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => undefined);
      setCamera("running");
      const decode = await createDecoder();
      timer = window.setInterval(async () => {
        const video = videoRef.current;
        if (busyRef.current || !video || document.visibilityState !== "visible") return;
        busyRef.current = true;
        try {
          const text = await decode(video);
          const code = text ? parseTicketCode(text) : null;
          if (text && !stopped) {
            if (code) {
              await checkRef.current(code);
              return;
            }
            setShown(toShown({ kind: "unknown" }));
            hideTimer.current = window.setTimeout(dismiss, RESULT_DISPLAY_MS);
            return;
          }
        } catch {
          // A failed frame is skipped; the next one is tried.
        }
        busyRef.current = false;
      }, DECODE_INTERVAL_MS);
    }

    void start();
    return () => {
      stopped = true;
      if (timer) window.clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [active, attempt, dismiss]);

  useEffect(() => () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
  }, []);

  const cameraHint =
    camera === "denied"
      ? copy.camera.denied
      : camera === "missing"
        ? copy.camera.missing
        : camera === "insecure"
          ? copy.camera.insecure
          : camera === "error"
            ? copy.camera.prompt
            : null;

  // Fixed colors: the viewfinder stays dark in light and dark mode, so the white text stays readable.
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-card bg-[#0a0a0b]">
      <video ref={videoRef} className="h-full w-full object-cover" playsInline muted aria-hidden="true" />

      {camera === "running" && !shown && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-3/5 w-3/5 rounded-card border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          {checking && <span className="absolute bottom-4 rounded-pill bg-black/60 px-3 py-1 text-xs text-white">…</span>}
        </div>
      )}

      {camera === "starting" && (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-white/80">{copy.camera.starting}</p>
      )}

      {cameraHint && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center text-sm text-white/90">
          <p>{cameraHint}</p>
          {camera !== "insecure" && (
            <Button type="button" variant="ghost" size="sm" className="border border-white/40 text-white! hover:bg-white/10!" onClick={() => {
                setCamera("starting");
                setAttempt((count) => count + 1);
              }}>
              <ArrowClockwise size={14} weight="bold" />
              {copy.camera.retry}
            </Button>
          )}
        </div>
      )}

      {shown && (
        <button
          type="button"
          onClick={dismiss}
          aria-live="assertive"
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white",
            shown.tone === "ok" ? "bg-success" : shown.tone === "bad" ? "bg-danger" : "bg-[#3a3a40]",
          )}
        >
          {shown.tone === "ok" ? (
            <CheckCircle size={72} weight="fill" />
          ) : shown.tone === "bad" ? (
            <XCircle size={72} weight="fill" />
          ) : (
            <CloudSlash size={72} weight="fill" />
          )}
          <span className="font-display text-2xl font-bold leading-tight">{shown.title}</span>
          {shown.name && <span className="text-xl font-semibold leading-tight">{shown.name}</span>}
          {shown.reference && <span className="text-sm tabular-nums text-white/80">{shown.reference}</span>}
          {shown.paymentOpen && (
            <span className="rounded-pill bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
              {copy.outcome.paymentOpen}
            </span>
          )}
          <span className="mt-2 text-xs text-white/70">{copy.outcome.next}</span>
        </button>
      )}
    </div>
  );
}
