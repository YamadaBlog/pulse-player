#!/usr/bin/env bash
#
# Replace the documented-as-do-not-ship audio + cover placeholders under
# `public/audio/` with curated CC0 / open-licence content.
#
# Reads from a small replacement manifest (below) and writes:
#   public/audio/track1.webm
#   public/audio/track2.webm
#   public/audio/cover.webp
#   public/audio/cover2.webp
#
# Requirements:
#   - bash + curl (every dev box has these)
#   - ffmpeg + cwebp (for conversion to WebM/Opus + WebP)
#
# Install on Ubuntu/Debian:   sudo apt install ffmpeg webp curl
# Install on macOS (Homebrew): brew install ffmpeg webp curl
# Install on Windows:           scoop install ffmpeg webp curl
#
# Usage:
#   bash scripts/setup-demo-audio.sh
#
# Idempotent: re-running overwrites the same target files. The script
# DOES NOT touch tracked-binary placeholders unless the destination is
# explicitly writeable.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="$REPO_ROOT/public/audio"

# Manifest — replace these URLs if Pixabay / Unsplash rotate the
# canonical demo asset. Sources listed here are CC0 or covered by the
# Unsplash License (free for commercial use, attribution appreciated
# but not required). See NOTICE.md §3 for the full provenance table.
declare -A AUDIO_URLS=(
  [track1]="https://cdn.pixabay.com/audio/2024/02/15/audio_3a5fcbfb27.mp3"
  [track2]="https://cdn.pixabay.com/audio/2024/01/02/audio_d0bb29be7b.mp3"
)

declare -A COVER_URLS=(
  [cover]="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=85&fm=jpg"
  [cover2]="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=85&fm=jpg"
)

check_tool() {
  if ! command -v "$1" &>/dev/null; then
    echo "❌ Missing required tool: $1" >&2
    echo "   See header of this script for install instructions." >&2
    exit 1
  fi
}

check_tool curl
check_tool ffmpeg
check_tool cwebp

mkdir -p "$TARGET_DIR"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "→ Fetching audio tracks…"
for name in "${!AUDIO_URLS[@]}"; do
  url="${AUDIO_URLS[$name]}"
  echo "  $name ← $url"
  curl -fsSL "$url" -o "$TMP_DIR/$name.mp3"
  ffmpeg -y -i "$TMP_DIR/$name.mp3" \
    -c:a libopus -b:a 96k -ac 1 \
    "$TARGET_DIR/$name.webm" \
    2>/dev/null
done

echo "→ Fetching cover images…"
for name in "${!COVER_URLS[@]}"; do
  url="${COVER_URLS[$name]}"
  echo "  $name ← $url"
  curl -fsSL "$url" -o "$TMP_DIR/$name.jpg"
  cwebp -q 85 "$TMP_DIR/$name.jpg" -o "$TARGET_DIR/$name.webp"
done

echo ""
echo "✅ Done. Replaced placeholders:"
ls -lh "$TARGET_DIR"/{track1.webm,track2.webm,cover.webp,cover2.webp}

echo ""
echo "Next step:"
echo "  1. Verify playback: npm run dev (then open http://localhost:5174)"
echo "  2. If you keep this content for redistribution, double-check each"
echo "     source URL is still under the same licence — Pixabay and"
echo "     Unsplash sometimes update terms. NOTICE.md documents the rule."
