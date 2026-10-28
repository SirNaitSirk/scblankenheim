import type { RoomGender } from "@/lib/admin/types";

/**
 * Gender tones for room planning (tokens `--female` / `--male` in globals.css).
 * Color always travels with a text label; it is never the only signal.
 */
export const GENDER_TONE: Record<"female" | "male" | "none", {
  text: string;
  soft: string;
  dot: string;
  ring: string;
  border: string;
}> = {
  female: {
    text: "text-female",
    soft: "bg-female-soft",
    dot: "bg-female",
    ring: "ring-female/40",
    border: "border-female/35",
  },
  male: {
    text: "text-male",
    soft: "bg-male-soft",
    dot: "bg-male",
    ring: "ring-male/40",
    border: "border-male/35",
  },
  none: {
    text: "text-muted-foreground",
    soft: "bg-ink-50",
    dot: "bg-ink-300",
    ring: "ring-ink-300",
    border: "border-border",
  },
};

export function toneFor(gender: RoomGender) {
  return GENDER_TONE[gender ?? "none"];
}
