#!/usr/bin/env bash
# Encode local Apple signing files for GitHub Actions secrets.
# Run on your Mac. Prints secret NAMES + values to stdout — do not commit output.
# Usage:
#   bash atdd/ios/scripts/encode-signing-secrets.sh \
#     /path/to/distribution.p12 \
#     /path/to/AppStore.mobileprovision \
#     /path/to/AuthKey_XXXXXXXXXX.p8
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <distribution.p12> <AppStore.mobileprovision> <AuthKey.p8>" >&2
  exit 2
fi

P12=$1
PROFILE=$2
P8=$3

for f in "$P12" "$PROFILE" "$P8"; do
  if [[ ! -f "$f" ]]; then
    echo "Missing file: $f" >&2
    exit 1
  fi
done

echo "=== Paste into GitHub → Settings → Secrets and variables → Actions ==="
echo
echo "--- IOS_DISTRIBUTION_P12_BASE64 ---"
base64 < "$P12" | tr -d '\n'
echo
echo
echo "--- IOS_PROVISION_PROFILE_BASE64 ---"
base64 < "$PROFILE" | tr -d '\n'
echo
echo
echo "--- ASC_PRIVATE_KEY (raw .p8 text) ---"
cat "$P8"
echo
echo
echo "Also set (not from these files):"
echo "  ASC_ISSUER_ID"
echo "  ASC_KEY_ID"
echo "  IOS_TEAM_ID"
echo "  IOS_DISTRIBUTION_P12_PASSWORD"
echo
echo "Guide: docs/status-board/ATDD-TESTFLIGHT-CI-SECRETS.md"
