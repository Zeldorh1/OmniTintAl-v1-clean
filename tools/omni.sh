#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$HOME/projects/LuxHair_AllInOne/client"
DL="/sdcard/Download"
NAME="OmniTintAI"
TMP="${PREFIX:-/data/data/com.termux/files/usr}/tmp/omni_restore"

ensure_storage() {
  # Termux storage access (safe if already done)
  command -v termux-setup-storage >/dev/null 2>&1 && termux-setup-storage || true
}

backup() {
  ensure_storage
  cd "$APP_DIR"
  ts="$(date +%Y%m%d-%H%M)"
  zipname="${NAME}_${ts}.zip"
  echo "→ Backing up to $DL/$zipname"
  # exclude heavy/regen stuff
  zip -qr "$DL/$zipname" . \
    -x "node_modules/*" ".git/*" "android/build/*" "ios/build/*" ".expo/*" "*~" "*.log"
  echo "✅ Backup saved: $DL/$zipname"
}

restore_from_zip() {
  local zip="$1"
  [ -f "$zip" ] || { echo "❌ Zip not found: $zip"; exit 1; }
  rm -rf "$TMP" && mkdir -p "$TMP"
  echo "→ Extracting $zip"
  unzip -q "$zip" -d "$TMP"

  # Find the folder that actually contains package.json
  local SRC
  SRC="$(find "$TMP" -maxdepth 3 -type f -name package.json -print -quit)"
  [ -n "$SRC" ] || { echo "❌ package.json not found inside zip"; exit 1; }
  SRC="$(dirname "$SRC")"

  echo "→ Restoring into $APP_DIR"
  cd "$APP_DIR"
  # keep node_modules & .git to speed things up; we’ll still run npm install
  find . -mindepth 1 -maxdepth 1 ! -name node_modules ! -name .git -exec rm -rf {} +

  cp -a "$SRC"/. .

  echo "→ Installing dependencies"
  (npm ci || npm install)

  echo "→ Launching Expo (cleans Metro cache)"
  npx expo start -c
}

restore() {
  ensure_storage
  local mode="${1:-stable}"
  local zip=""

  case "$mode" in
    stable)
      zip="$DL/${NAME}_Stable.zip"
      ;;
    latest)
      # newest OmniTintAI_*.zip that is not the icon packs
      zip="$(ls -1t "$DL"/${NAME}_*.zip 2>/dev/null | grep -v -E 'AppIcon|WebIcon' | head -n1 || true)"
      ;;
    from)
      zip="${2:-}"
      ;;
    *)
      echo "Usage: $0 restore {stable|latest|from <zip>}"
      exit 1
      ;;
  esac

  [ -n "${zip:-}" ] || { echo "❌ No backup zip found for mode: $mode"; exit 1; }
  restore_from_zip "$zip"
}

cmd="${1:-}"
case "$cmd" in
  backup)  backup ;;
  restore) shift; restore "$@" ;;
  *)
    cat <<HELP
Usage:
  $0 backup
  $0 restore stable
  $0 restore latest
  $0 restore from /sdcard/Download/OmniTintAI_2025xxxx-xxxx.zip
HELP
    ;;
esac
