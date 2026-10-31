/**
 * Real camp photos below the hero (specs/027-camp-photos). Files are built by
 * scripts/build-camp-photos.sh; alt texts live in `marketingMessages.photos`.
 * The focus class sets the object position so the motif (fire, hands, ball)
 * stays in frame when the box is much wider or taller than the photo. It is a
 * literal Tailwind class so the build picks it up.
 */

export type CampPhotoKey = "worship" | "inputs" | "sport" | "community" | "campfire";

export type CampPhoto = {
  src: string;
  focusClass: string;
};

export const CAMP_PHOTOS: Record<CampPhotoKey, CampPhoto> = {
  worship: { src: "/images/camp/2026-worship.jpg", focusClass: "object-[center_40%]" },
  inputs: { src: "/images/camp/2026-inputs.jpg", focusClass: "object-[center_35%]" },
  sport: { src: "/images/camp/2026-sport.jpg", focusClass: "object-[center_30%]" },
  community: { src: "/images/camp/2026-community.jpg", focusClass: "object-[center_45%]" },
  campfire: { src: "/images/camp/2026-campfire.jpg", focusClass: "object-[center_70%]" },
};
