import { describe, expect, it } from "vitest";
import {
  pickHeroVideoSource,
  shouldPlayHeroVideo,
  type HeroVideoEnvironment,
} from "@/lib/marketing/hero-video";

const base: HeroVideoEnvironment = {
  reducedMotion: false,
  saveData: false,
  effectiveType: "4g",
  portrait: false,
  canPlayWebm: true,
};

describe("shouldPlayHeroVideo", () => {
  it("plays by default", () => {
    expect(shouldPlayHeroVideo(base)).toBe(true);
  });

  it("stops for reduced motion", () => {
    expect(shouldPlayHeroVideo({ ...base, reducedMotion: true })).toBe(false);
  });

  it("stops for save data", () => {
    expect(shouldPlayHeroVideo({ ...base, saveData: true })).toBe(false);
  });

  it.each(["slow-2g", "2g"])("stops on a %s connection", (effectiveType) => {
    expect(shouldPlayHeroVideo({ ...base, effectiveType })).toBe(false);
  });

  it.each(["3g", "4g", null])("plays on connection %s", (effectiveType) => {
    expect(shouldPlayHeroVideo({ ...base, effectiveType })).toBe(true);
  });
});

describe("pickHeroVideoSource", () => {
  it("picks the desktop WebM on landscape screens", () => {
    expect(pickHeroVideoSource(base)).toEqual({
      src: "/videos/hero-2026-desktop.webm",
      type: "video/webm",
    });
  });

  it("picks the desktop MP4 without WebM support", () => {
    expect(pickHeroVideoSource({ ...base, canPlayWebm: false })).toEqual({
      src: "/videos/hero-2026-desktop.mp4",
      type: "video/mp4",
    });
  });

  it("picks the mobile WebM on portrait screens", () => {
    expect(pickHeroVideoSource({ ...base, portrait: true })).toEqual({
      src: "/videos/hero-2026-mobile.webm",
      type: "video/webm",
    });
  });

  it("picks the mobile MP4 on portrait screens without WebM support", () => {
    expect(pickHeroVideoSource({ ...base, portrait: true, canPlayWebm: false })).toEqual({
      src: "/videos/hero-2026-mobile.mp4",
      type: "video/mp4",
    });
  });
});
