#!/usr/bin/env bash
# Builds the landing page hero video from the camp recap (specs/026-hero-video).
#
# Usage: scripts/build-hero-video.sh <path to recap video>
#
# For a new camp year: replace the cut list below with the new scenes (start and
# end in seconds on the decoded timeline), set YEAR, run the script, and update
# the file paths in lib/marketing/hero-video.ts. The source recording is never
# committed; only the generated files in public/videos are.
set -euo pipefail

YEAR=2026
SOURCE="${1:?usage: build-hero-video.sh <recap video>}"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/videos"

# Scene cut list in playback order: "start:end" in seconds.
CUTS=(
  "39.0:41.7"     # circle game in front of the coaches
  "127.6:130.5"   # volleyball on the meadow
  "126.15:127.45" # flip on the beach
  "171.95:173.45" # flip off the dune
  "65.45:66.75"   # worship, raised hands
  "84.4:85.6"     # stage with the band
  "173.55:174.9"  # party in the barn
  "177.85:179.4"  # rope pull on the car
)

# Size limits in bytes (research R3).
MAX_DESKTOP=$((4 * 1024 * 1024))
MAX_MOBILE=$((2500 * 1024))
MAX_POSTER=$((250 * 1024))

# Bitrate targets that keep the 14 second cut inside the limits.
DESKTOP_RATE=1900k
MOBILE_RATE=1150k

command -v ffmpeg >/dev/null || { echo "ffmpeg is missing (brew install ffmpeg)" >&2; exit 1; }
[[ -f "$SOURCE" ]] || { echo "Source not found: $SOURCE" >&2; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$OUT_DIR"

# 1. Cut and join the scenes once into a high quality master at source size.
#    The trim filter works on the decoded timeline, which matches the review.
filter=""
labels=""
i=0
for cut in "${CUTS[@]}"; do
  filter+="[0:v]trim=${cut%%:*}:${cut##*:},setpts=PTS-STARTPTS,fps=30[v${i}];"
  labels+="[v${i}]"
  i=$((i + 1))
done
ffmpeg -v error -y -i "$SOURCE" \
  -filter_complex "${filter}${labels}concat=n=${i}:v=1:a=0[out]" \
  -map "[out]" -an -c:v libx264 -preset veryfast -crf 12 -pix_fmt yuv420p \
  "$WORK/master.mp4"

DESKTOP_VF="scale=1920:1080:flags=lanczos"
MOBILE_VF="crop=ih*9/16:ih,scale=720:1280:flags=lanczos"

# 2. VP9 WebM, two pass.
encode_webm() {
  local vf="$1" rate="$2" out="$3"
  ffmpeg -v error -y -i "$WORK/master.mp4" -vf "$vf" -an -c:v libvpx-vp9 \
    -b:v "$rate" -row-mt 1 -deadline good -cpu-used 2 -pass 1 \
    -passlogfile "$WORK/vp9" -f null /dev/null
  ffmpeg -v error -y -i "$WORK/master.mp4" -vf "$vf" -an -c:v libvpx-vp9 \
    -b:v "$rate" -row-mt 1 -deadline good -cpu-used 2 -pass 2 \
    -passlogfile "$WORK/vp9" "$out"
}

# 3. H.264 MP4, two pass, moov atom first so playback starts early.
encode_mp4() {
  local vf="$1" rate="$2" out="$3"
  ffmpeg -v error -y -i "$WORK/master.mp4" -vf "$vf" -an -c:v libx264 \
    -profile:v high -preset slow -b:v "$rate" -pix_fmt yuv420p -pass 1 \
    -passlogfile "$WORK/x264" -f null /dev/null
  ffmpeg -v error -y -i "$WORK/master.mp4" -vf "$vf" -an -c:v libx264 \
    -profile:v high -preset slow -b:v "$rate" -pix_fmt yuv420p -pass 2 \
    -passlogfile "$WORK/x264" -movflags +faststart "$out"
}

encode_webm "$DESKTOP_VF" "$DESKTOP_RATE" "$OUT_DIR/hero-$YEAR-desktop.webm"
encode_mp4 "$DESKTOP_VF" "$DESKTOP_RATE" "$OUT_DIR/hero-$YEAR-desktop.mp4"
encode_webm "$MOBILE_VF" "$MOBILE_RATE" "$OUT_DIR/hero-$YEAR-mobile.webm"
encode_mp4 "$MOBILE_VF" "$MOBILE_RATE" "$OUT_DIR/hero-$YEAR-mobile.mp4"

# 4. Poster: the very first frame, so the switch to the video is seamless.
ffmpeg -v error -y -i "$WORK/master.mp4" -frames:v 1 -vf "$DESKTOP_VF" \
  -q:v 9 "$OUT_DIR/hero-$YEAR-poster.jpg"

# 5. Report sizes and enforce the limits.
failed=0
check_size() {
  local file="$1" max="$2" size
  size=$(wc -c <"$file" | tr -d ' ')
  printf '%-28s %7d kB (max %d kB)\n' "$(basename "$file")" $((size / 1024)) $((max / 1024))
  if ((size > max)); then failed=1; fi
}
check_size "$OUT_DIR/hero-$YEAR-desktop.webm" "$MAX_DESKTOP"
check_size "$OUT_DIR/hero-$YEAR-desktop.mp4" "$MAX_DESKTOP"
check_size "$OUT_DIR/hero-$YEAR-mobile.webm" "$MAX_MOBILE"
check_size "$OUT_DIR/hero-$YEAR-mobile.mp4" "$MAX_MOBILE"
check_size "$OUT_DIR/hero-$YEAR-poster.jpg" "$MAX_POSTER"

if ((failed)); then
  echo "At least one file is too large. Lower the rates at the top of this script." >&2
  exit 1
fi
