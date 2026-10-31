#!/usr/bin/env bash
# Builds the landing page camp photos from the original camera files
# (specs/027-camp-photos).
#
# Usage: scripts/build-camp-photos.sh <folder with the original JPGs>
#
# For a new camp year: pick photos without clearly recognizable people, replace
# the source list below, set YEAR, run the script, and update the paths in
# lib/marketing/camp-photos.ts. The originals are never committed; only the
# generated files in public/images/camp are.
set -euo pipefail

YEAR=2026
SOURCE_DIR="${1:?usage: build-camp-photos.sh <folder with originals>}"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/images/camp"

# Output key and original file name.
PHOTOS=(
  "worship:_MG_3076.JPG"   # raised hands from behind in the barn
  "inputs:_MG_2528.JPG"    # prayer room with the verse garland
  "sport:IMG_3330.JPG"     # volleyball against the clouds
  "community:IMG_3491.JPG" # worship crowd from behind
  "campfire:_MG_3632.JPG"  # campfire at night
)

LONG_EDGE=2400
MAX_SIZE=$((600 * 1024))

command -v ffmpeg >/dev/null || { echo "ffmpeg is missing (brew install ffmpeg)" >&2; exit 1; }
[[ -d "$SOURCE_DIR" ]] || { echo "Folder not found: $SOURCE_DIR" >&2; exit 1; }
mkdir -p "$OUT_DIR"

# ffmpeg applies the EXIF rotation; -map_metadata -1 drops camera serial and
# timestamps so they never become public.
SCALE="scale='if(gt(iw,ih),$LONG_EDGE,-2)':'if(gt(iw,ih),-2,$LONG_EDGE)':flags=lanczos"

failed=0
for photo in "${PHOTOS[@]}"; do
  key="${photo%%:*}"
  src="$SOURCE_DIR/${photo##*:}"
  out="$OUT_DIR/$YEAR-$key.jpg"
  [[ -f "$src" ]] || { echo "Source not found: $src" >&2; exit 1; }
  ffmpeg -v error -y -i "$src" -vf "$SCALE" -map_metadata -1 -q:v 4 "$out"
  size=$(wc -c <"$out" | tr -d ' ')
  printf '%-22s %5d kB (max %d kB)\n' "$(basename "$out")" $((size / 1024)) $((MAX_SIZE / 1024))
  if ((size > MAX_SIZE)); then failed=1; fi
done

if ((failed)); then
  echo "At least one file is too large. Raise the -q:v value in this script." >&2
  exit 1
fi
