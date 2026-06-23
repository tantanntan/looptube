#!/usr/bin/env bash
set -euo pipefail

# Subset font files from INPUT_DIR and write .woff2 to static/fonts/.
# Usage: ./scripts/subset-fonts.sh [INPUT_FONTS_DIR]
# Default INPUT_FONTS_DIR: tmp/fonts/
#
# Expected input structure:
#   <INPUT_DIR>/Barlow/Barlow-SemiBold.ttf
#   <INPUT_DIR>/NotoSansJP/NotoSansJP-VariableFont_wght.ttf
#   <INPUT_DIR>/RobotoMono/RobotoMono-VariableFont_wght.ttf
#
# Prerequisites: pip install fonttools brotli

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
INPUT_DIR="${1:-${REPO_ROOT}/tmp/fonts}"
OUT_DIR="${REPO_ROOT}/static/fonts"

if ! command -v pyftsubset &>/dev/null; then
  echo "Error: pyftsubset not found. Install with: pip install fonttools brotli" >&2
  exit 1
fi

mkdir -p "${OUT_DIR}/barlow" "${OUT_DIR}/noto-sans-jp" "${OUT_DIR}/roboto-mono"

echo "==> Subsetting Barlow SemiBold (Latin Basic U+0020-007E)..."
pyftsubset \
  "${INPUT_DIR}/Barlow/Barlow-SemiBold.ttf" \
  --unicodes="U+0020-007E" \
  --flavor=woff2 \
  --output-file="${OUT_DIR}/barlow/barlow-semibold.woff2"

echo "==> Subsetting Roboto Mono (digits, colon, dot, space)..."
pyftsubset \
  "${INPUT_DIR}/RobotoMono/RobotoMono-VariableFont_wght.ttf" \
  --unicodes="U+0020-003A,U+002E" \
  --flavor=woff2 \
  --output-file="${OUT_DIR}/roboto-mono/roboto-mono-regular.woff2"

echo "==> Extracting CJK codepoints from ja.json..."
UNICODES=$(REPO_ROOT="$REPO_ROOT" python3 - <<'PYEOF'
import json, sys, os

repo = os.environ['REPO_ROOT']
ja_json = os.path.join(repo, 'src', 'lib', 'i18n', 'ja.json')
with open(ja_json, encoding='utf-8') as f:
    text = f.read()

chars = set()
for ch in text:
    cp = ord(ch)
    # Hiragana, Katakana, CJK Unified Ideographs, fullwidth/halfwidth, CJK punctuation
    if (0x3000 <= cp <= 0x9FFF or
        0xF900 <= cp <= 0xFAFF or
        0xFF00 <= cp <= 0xFFEF or
        0x20000 <= cp <= 0x2A6DF or
        0x2A700 <= cp <= 0x2CEAF):
        chars.add(cp)

if chars:
    print(','.join(f'U+{cp:04X}' for cp in sorted(chars)))
else:
    print('U+3000-9FFF')
PYEOF
)

echo "    Unicode range: ${UNICODES}"
echo "==> Subsetting Noto Sans JP (CJK characters from ja.json)..."
pyftsubset \
  "${INPUT_DIR}/NotoSansJP/NotoSansJP-VariableFont_wght.ttf" \
  --unicodes="${UNICODES}" \
  --flavor=woff2 \
  --output-file="${OUT_DIR}/noto-sans-jp/noto-sans-jp-regular.woff2"

echo ""
echo "==> Output files:"
ls -lh "${OUT_DIR}/barlow/" "${OUT_DIR}/noto-sans-jp/" "${OUT_DIR}/roboto-mono/"

# SC-002: warn if any font file exceeds 50 KB
MAX_BYTES=51200
for f in \
  "${OUT_DIR}/barlow/barlow-semibold.woff2" \
  "${OUT_DIR}/noto-sans-jp/noto-sans-jp-regular.woff2" \
  "${OUT_DIR}/roboto-mono/roboto-mono-regular.woff2"; do
  size=$(wc -c < "$f")
  if [ "$size" -gt "${MAX_BYTES}" ]; then
    echo "WARNING: $(basename "${f}") is ${size} bytes — exceeds 50 KB SC-002 limit" >&2
  fi
done
