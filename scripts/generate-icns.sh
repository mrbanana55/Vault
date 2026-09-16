#!/usr/bin/env bash
set -euo pipefail

# Script to generate assets/VaultLogo.icns from assets/VaultLogo.png using macOS native sips and iconutil

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

SOURCE_PNG="${ROOT_DIR}/assets/VaultLogo.png"
OUTPUT_ICNS="${ROOT_DIR}/assets/VaultLogo.icns"
ICONSET_DIR="${ROOT_DIR}/assets/VaultLogo.iconset"

if [[ ! -f "${SOURCE_PNG}" ]]; then
  echo "Error: Source image ${SOURCE_PNG} not found!" >&2
  exit 1
fi

echo "Generating macOS multi-resolution iconset from ${SOURCE_PNG}..."
rm -rf "${ICONSET_DIR}"
mkdir -p "${ICONSET_DIR}"

sips -z 16 16     "${SOURCE_PNG}" --out "${ICONSET_DIR}/icon_16x16.png" > /dev/null
sips -z 32 32     "${SOURCE_PNG}" --out "${ICONSET_DIR}/icon_16x16@2x.png" > /dev/null
sips -z 32 32     "${SOURCE_PNG}" --out "${ICONSET_DIR}/icon_32x32.png" > /dev/null
sips -z 64 64     "${SOURCE_PNG}" --out "${ICONSET_DIR}/icon_32x32@2x.png" > /dev/null
sips -z 128 128   "${SOURCE_PNG}" --out "${ICONSET_DIR}/icon_128x128.png" > /dev/null
sips -z 256 256   "${SOURCE_PNG}" --out "${ICONSET_DIR}/icon_128x128@2x.png" > /dev/null
sips -z 256 256   "${SOURCE_PNG}" --out "${ICONSET_DIR}/icon_256x256.png" > /dev/null
sips -z 512 512   "${SOURCE_PNG}" --out "${ICONSET_DIR}/icon_256x256@2x.png" > /dev/null
sips -z 512 512   "${SOURCE_PNG}" --out "${ICONSET_DIR}/icon_512x512.png" > /dev/null
sips -z 1024 1024 "${SOURCE_PNG}" --out "${ICONSET_DIR}/icon_512x512@2x.png" > /dev/null

echo "Converting iconset to ${OUTPUT_ICNS} via iconutil..."
iconutil -c icns "${ICONSET_DIR}" -o "${OUTPUT_ICNS}"

rm -rf "${ICONSET_DIR}"
echo "Successfully generated ${OUTPUT_ICNS}!"
