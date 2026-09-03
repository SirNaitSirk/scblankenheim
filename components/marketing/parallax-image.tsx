"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/cn";

/**
 * Full-cover photo that drifts slower than the scroll for depth, with an
 * optional slow ken-burns zoom layered on top. The image is over-sized (top/
 * bottom bleed) so the parallax translate never exposes an edge.
 *
 * Continuous scroll value comes from Motion's useScroll/useTransform — never
 * React state per frame. Reduced-motion renders a static, correctly-framed
 * image (no parallax, no ken-burns).
 */
export function ParallaxImage({
  src,
  alt,
  priority = false,
  sizes = "100vw",
  /** Vertical drift range in px across the element's scroll span. */
  strength = 80,
  kenBurns = false,
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  strength?: number;
  kenBurns?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength]);

  return (
    <div ref={ref} className={cn("absolute inset-0 overflow-hidden", className)}>
      <motion.div
        style={reduce ? undefined : { y }}
        className="absolute inset-x-0 -inset-y-[12%]"
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={cn(
            "object-cover",
            !reduce && kenBurns && "animate-ken-burns",
            imageClassName,
          )}
        />
      </motion.div>
    </div>
  );
}
