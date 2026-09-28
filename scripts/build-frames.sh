#!/usr/bin/env bash
# Usage : bash scripts/build-frames.sh <video> <nom> <nombre_images> <largeur>
set -e
V="$1"; N="$2"; C="$3"; W="$4"
D="public/seq/$N/$W"; T="$(mktemp -d)"
mkdir -p "$D"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
FPS=$(awk "BEGIN{print $C/$DUR}")
ffmpeg -v error -i "$V" -vf "fps=$FPS,scale=$W:-2:flags=lanczos" -frames:v "$C" "$T/%03d.png" -y
for f in "$T"/*.png; do
  cwebp -quiet -q 55 -m 6 "$f" -o "$D/$(basename "${f%.png}").webp"
done
rm -rf "$T"
echo "{\"count\":$(ls "$D"/*.webp | wc -l),\"width\":$W}" > "$D/manifest.json"
echo "== $D =="; ls "$D"/*.webp | wc -l; du -sh "$D"
