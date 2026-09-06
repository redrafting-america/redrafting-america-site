#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIRECTORY}/.." && pwd)"
OUTPUT_DIRECTORY="${PROJECT_ROOT}/dist"

required_paths=(
    "index.html"
    "404.html"
    "robots.txt"
    "rss.xml"
    "sitemap.xml"
    "assets"
    "pages"
)

for required_path in "${required_paths[@]}"; do
    if [ ! -e "${PROJECT_ROOT}/${required_path}" ]; then
        printf 'ERROR: Required public path is missing: %s\n' "$required_path" >&2
        exit 1
    fi
done

rm -rf -- "$OUTPUT_DIRECTORY"
mkdir -p -- "$OUTPUT_DIRECTORY"

for public_file in index.html 404.html robots.txt rss.xml sitemap.xml; do
    cp -p -- "${PROJECT_ROOT}/${public_file}" "${OUTPUT_DIRECTORY}/${public_file}"
done

cp -R -- "${PROJECT_ROOT}/assets" "${OUTPUT_DIRECTORY}/assets"
cp -R -- "${PROJECT_ROOT}/pages" "${OUTPUT_DIRECTORY}/pages"

# Finder metadata is not website content and must never be uploaded.
find "$OUTPUT_DIRECTORY" -type f -name '.DS_Store' -delete

# Preserve the stable public paths that were previously implemented as Vercel
# rewrites. These are build-output copies; the source tree remains authoritative.
legacy_file_routes=(
    "mission.html:pages/about/mission.html"
    "bylaws.html:pages/about/bylaws.html"
    "careers.html:pages/get-involved/careers.html"
    "social-media.html:pages/community/social-media.html"
    "cultural-influences.html:pages/newsroom/cultural-influences.html"
    "drafting-room.css:assets/styles/drafting-room.css"
    "drafting-room.js:assets/scripts/drafting-room.js"
)

for route in "${legacy_file_routes[@]}"; do
    destination="${route%%:*}"
    source="${route#*:}"
    if [ ! -f "${PROJECT_ROOT}/${source}" ]; then
        printf 'ERROR: Stable-route source is missing: %s\n' "$source" >&2
        exit 1
    fi
    cp -p -- "${PROJECT_ROOT}/${source}" "${OUTPUT_DIRECTORY}/${destination}"
done

mkdir -p -- \
    "${OUTPUT_DIRECTORY}/drafting-room/papers" \
    "${OUTPUT_DIRECTORY}/drafting-room/drafting-notes"

cp -p -- "${PROJECT_ROOT}/pages/community/drafting-room/index.html" \
    "${OUTPUT_DIRECTORY}/the-drafting-room.html"
for paper in "${PROJECT_ROOT}"/pages/community/drafting-room/papers/*.html; do
    cp -p -- "$paper" "${OUTPUT_DIRECTORY}/drafting-room/papers/$(basename -- "$paper")"
done
for drafting_note in "${PROJECT_ROOT}"/pages/community/drafting-room/drafting-notes/*.html; do
    cp -p -- "$drafting_note" "${OUTPUT_DIRECTORY}/drafting-room/drafting-notes/$(basename -- "$drafting_note")"
done

# Retain the old short asset paths without publishing non-public directories.
cp -R -- "${PROJECT_ROOT}/assets/images" "${OUTPUT_DIRECTORY}/images"
cp -R -- "${PROJECT_ROOT}/assets/audio" "${OUTPUT_DIRECTORY}/audio"
cp -R -- "${PROJECT_ROOT}/assets/data" "${OUTPUT_DIRECTORY}/data"

printf 'Cloudflare static site prepared at %s\n' "$OUTPUT_DIRECTORY"
