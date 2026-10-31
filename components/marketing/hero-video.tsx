"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react";
import {
  pickHeroVideoSource,
  shouldPlayHeroVideo,
  type HeroVideoEnvironment,
} from "@/lib/marketing/hero-video";
import { marketingMessages } from "@/lib/marketing/messages";
import { cn } from "@/lib/cn";

/** idle: poster only · playing · paused: stopped by hand or autoplay blocked. */
type PlayerState = "idle" | "playing" | "paused";

/** The parts of the Network Information API we read; not in every browser. */
type ConnectionInfo = { saveData?: boolean; effectiveType?: string };

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const PORTRAIT_QUERY = "(orientation: portrait), (max-width: 767px)";

function readEnvironment(video: HTMLVideoElement): HeroVideoEnvironment {
  const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection;
  return {
    reducedMotion: window.matchMedia(REDUCED_MOTION_QUERY).matches,
    saveData: connection?.saveData === true,
    effectiveType: connection?.effectiveType ?? null,
    portrait: window.matchMedia(PORTRAIT_QUERY).matches,
    canPlayWebm: video.canPlayType('video/webm; codecs="vp9"') !== "",
  };
}

/**
 * Background video of the hero (specs/026-hero-video). The server HTML has no
 * source, so nothing downloads without JavaScript; on mount the playback rules
 * decide whether a source is attached. The video sits behind the scrims (the
 * hero section isolates the stacking) and fades in over the poster once it
 * really plays. Off screen it pauses; the pause control satisfies WCAG 2.2.2.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedByHand = useRef(false);
  const [state, setState] = useState<PlayerState>("idle");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const env = readEnvironment(video);
    if (!shouldPlayHeroVideo(env)) return;

    let active = true;

    const fail = () => {
      active = false;
      video.removeAttribute("src");
      video.load();
      setVisible(false);
      setState("idle");
    };
    const onPlaying = () => {
      setVisible(true);
      setState("playing");
    };
    const tryPlay = () => {
      video.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "NotAllowedError") {
          // Autoplay blocked: keep the poster, offer the play button.
          pausedByHand.current = true;
          setState("paused");
        } else if (!(error instanceof DOMException && error.name === "AbortError")) {
          fail();
        }
      });
    };

    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", fail);

    video.muted = true;
    video.src = pickHeroVideoSource(env).src;
    video.load();
    tryPlay();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!active) return;
        if (!entry.isIntersecting) video.pause();
        else if (!pausedByHand.current) tryPlay();
      },
      { threshold: 0.1 },
    );
    observer.observe(video);

    const motionQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const onMotionChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      active = false;
      video.pause();
      setState("idle");
    };
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      active = false;
      observer.disconnect();
      motionQuery.removeEventListener("change", onMotionChange);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", fail);
      video.pause();
    };
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (state === "playing") {
      pausedByHand.current = true;
      video.pause();
      setState("paused");
    } else {
      pausedByHand.current = false;
      video.play().catch(() => setState("paused"));
    }
  };

  const paused = state === "paused";

  return (
    <>
      <video
        ref={videoRef}
        muted
        playsInline
        loop
        preload="none"
        aria-hidden
        tabIndex={-1}
        className={cn(
          "absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-[400ms]",
          visible ? "opacity-100" : "opacity-0",
        )}
      />
      {state !== "idle" && (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={paused}
          aria-label={
            paused ? marketingMessages.hero.playVideo : marketingMessages.hero.pauseVideo
          }
          className="absolute bottom-8 right-6 z-10 flex h-11 w-11 items-center justify-center rounded-pill bg-ink-950/40 text-on-inverse/80 backdrop-blur-sm transition-colors hover:text-on-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 md:right-10"
        >
          {paused ? <Play size={18} weight="fill" /> : <Pause size={18} weight="fill" />}
        </button>
      )}
    </>
  );
}
