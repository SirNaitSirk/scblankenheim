/**
 * Playback rules and files of the hero video (specs/026-hero-video). Pure and
 * isomorphic: the server uses the poster path, the client decides whether the
 * video may load at all and which variant fits the screen.
 */

export const HERO_POSTER_SRC = "/videos/hero-2026-poster.jpg";

const HERO_VIDEO_FILES = {
  desktop: { webm: "/videos/hero-2026-desktop.webm", mp4: "/videos/hero-2026-desktop.mp4" },
  mobile: { webm: "/videos/hero-2026-mobile.webm", mp4: "/videos/hero-2026-mobile.mp4" },
} as const;

/** Connection types too slow for a background video. */
const SLOW_CONNECTIONS: ReadonlySet<string> = new Set(["slow-2g", "2g"]);

export type HeroVideoEnvironment = {
  reducedMotion: boolean;
  saveData: boolean;
  /** `navigator.connection.effectiveType`, null where the browser does not report it. */
  effectiveType: string | null;
  portrait: boolean;
  canPlayWebm: boolean;
};

export type HeroVideoSource = {
  src: string;
  type: "video/webm" | "video/mp4";
};

/** The video loads only when motion is welcome and the visitor is not saving data. */
export function shouldPlayHeroVideo(env: HeroVideoEnvironment): boolean {
  if (env.reducedMotion || env.saveData) return false;
  return env.effectiveType === null || !SLOW_CONNECTIONS.has(env.effectiveType);
}

/** Portrait screens get the cropped phone cut; WebM wins where it plays. */
export function pickHeroVideoSource(env: HeroVideoEnvironment): HeroVideoSource {
  const files = env.portrait ? HERO_VIDEO_FILES.mobile : HERO_VIDEO_FILES.desktop;
  return env.canPlayWebm
    ? { src: files.webm, type: "video/webm" }
    : { src: files.mp4, type: "video/mp4" };
}
