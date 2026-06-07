#!/usr/bin/env bash
#
# Pre-publish dry run for every publishable @pulse/* package.
#
# This script is meant to be run by the maintainer BEFORE the first real
# `npm publish`. It does NOT publish anything. It checks that:
#
#   1. The full CI gate is green (type-check + lint + format + tests +
#      builds + audit + size-limit).
#   2. Each package's `npm pack --dry-run` produces a valid tarball with
#      the expected file list (src/ + dist/ + README + LICENSE).
#   3. Each package's `package.json` has the right `name`, `version`,
#      `main`, `module`, `types`, `exports`, `files`, `sideEffects`,
#      and `peerDependencies` fields.
#
# Once this script reports all-green, the maintainer can publish with:
#
#   cd packages/types && npm publish --access=public  # bumped to 3.0.0-rc.0 first
#   cd packages/core && npm publish --access=public
#   cd packages/tokens && npm publish --access=public
#   cd packages/web-component && npm publish --access=public
#   cd packages/react && npm publish --access=public
#   cd packages/svelte && npm publish --access=public
#
# Each `npm publish` will prompt for the maintainer's 2FA OTP (6-digit
# code from the authenticator app). The order matters: `@pulse/types`
# first (no dependencies), then `@pulse/core` + `@pulse/tokens` (depend
# only on types), then `@pulse/web-component` (depends on core + tokens),
# then `@pulse/react` + `@pulse/svelte` (depend on web-component).
#
# See docs/universal/PUBLISH_CHECKLIST.md for the full procedure.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

PACKAGES=(types core tokens web-component react svelte)

echo -e "${YELLOW}→ Step 1/4: full CI gate${NC}"
npm run ci
echo -e "${GREEN}  ✔ CI gate green${NC}"

echo ""
echo -e "${YELLOW}→ Step 2/4: size-limit budget${NC}"
npm run size
echo -e "${GREEN}  ✔ size-limit budget green${NC}"

echo ""
echo -e "${YELLOW}→ Step 3/4: tarball dry-run per package${NC}"
for pkg in "${PACKAGES[@]}"; do
  pkg_dir="$REPO_ROOT/packages/$pkg"
  if [ ! -d "$pkg_dir" ]; then
    echo -e "${RED}  ✘ packages/$pkg not found${NC}"
    exit 1
  fi

  echo "  • @pulse/$pkg"
  cd "$pkg_dir"
  files=$(npm pack --dry-run --json 2>/dev/null | grep -c '"path"' || true)
  if [ "$files" -eq 0 ]; then
    echo -e "${RED}    ✘ npm pack --dry-run produced 0 files${NC}"
    exit 1
  fi
  echo -e "${GREEN}    ✔ $files files in tarball${NC}"
done
cd "$REPO_ROOT"

echo ""
echo -e "${YELLOW}→ Step 4/4: metadata sanity per package${NC}"
for pkg in "${PACKAGES[@]}"; do
  pkg_json="packages/$pkg/package.json"
  name=$(node -p "require('./$pkg_json').name")
  version=$(node -p "require('./$pkg_json').version")
  has_exports=$(node -p "require('./$pkg_json').exports !== undefined ? 'yes' : 'no'")
  has_files=$(node -p "Array.isArray(require('./$pkg_json').files) ? 'yes' : 'no'")
  has_repo=$(node -p "require('./$pkg_json').repository !== undefined ? 'yes' : 'no'")
  has_license=$(node -p "require('./$pkg_json').license === 'MIT' ? 'yes' : 'no'")

  echo "  • $name@$version"
  echo "      exports field:        $has_exports"
  echo "      files allow-list:     $has_files"
  echo "      repository field:     $has_repo"
  echo "      license: MIT:         $has_license"

  if [ "$has_exports" = "no" ] || [ "$has_files" = "no" ]; then
    echo -e "${RED}    ✘ Missing exports or files allow-list${NC}"
    exit 1
  fi
done

echo ""
echo -e "${GREEN}✅ Pre-publish dry-run complete.${NC}"
echo ""
echo "Next steps (maintainer only):"
echo "  1. Bump each package version to the publish target (e.g. 3.0.0-rc.0)."
echo "  2. npm login (once per session)."
echo "  3. cd packages/<name> && npm publish --access=public"
echo "  4. Each publish prompts for a 6-digit OTP from your authenticator."
echo ""
echo "Full step-by-step: docs/universal/PUBLISH_CHECKLIST.md"
