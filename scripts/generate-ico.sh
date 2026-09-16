#!/usr/bin/env bash
set -euo pipefail

# Generate multi-resolution assets/VaultLogo.ico from assets/VaultLogo.png
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

SOURCE_PNG="${ROOT_DIR}/assets/VaultLogo.png"
OUTPUT_ICO="${ROOT_DIR}/assets/VaultLogo.ico"
TMP_DIR="${ROOT_DIR}/assets/.tmp_ico"

if [[ ! -f "${SOURCE_PNG}" ]]; then
  echo "Error: Source image ${SOURCE_PNG} not found!" >&2
  exit 1
fi

rm -rf "${TMP_DIR}"
mkdir -p "${TMP_DIR}"

SIZES=(256 128 64 48 32 16)

for sz in "${SIZES[@]}"; do
  sips -z "${sz}" "${sz}" "${SOURCE_PNG}" --out "${TMP_DIR}/icon_${sz}.png" > /dev/null
done

node -e '
const fs = require("fs");
const path = require("path");

const tmpDir = process.argv[1];
const outputFile = process.argv[2];
const sizes = [256, 128, 64, 48, 32, 16];

const images = sizes.map((sz) => {
  const buf = fs.readFileSync(path.join(tmpDir, `icon_${sz}.png`));
  return {
    size: sz,
    width: sz === 256 ? 0 : sz,
    height: sz === 256 ? 0 : sz,
    buffer: buf
  };
});

const headerSize = 6;
const dirEntrySize = 16;
let offset = headerSize + dirEntrySize * images.length;

const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type 1 = ICO
header.writeUInt16LE(images.length, 4); // image count

const entries = [];
for (const img of images) {
  const entry = Buffer.alloc(dirEntrySize);
  entry.writeUInt8(img.width, 0);
  entry.writeUInt8(img.height, 1);
  entry.writeUInt8(0, 2); // color count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(img.buffer.length, 8); // size
  entry.writeUInt32LE(offset, 12); // offset
  entries.push(entry);
  offset += img.buffer.length;
}

const finalBuffer = Buffer.concat([
  header,
  ...entries,
  ...images.map((img) => img.buffer)
]);

fs.writeFileSync(outputFile, finalBuffer);
console.log(`Successfully generated ${outputFile} with ${images.length} resolutions!`);
' "${TMP_DIR}" "${OUTPUT_ICO}"

rm -rf "${TMP_DIR}"
