# music-metadata 11.15.0

Locally bundled MP3 tag reader for Webamp, from https://github.com/Borewit/music-metadata. MIT licensed. Rebuild with tooling/music-metadata/build.mjs after installing its locked dependencies. The browser adapter supports direct-file XMLHttpRequest reads and HTTP byte-buffer reads (independent of browser stream-reader support).

The local adapter also caches album artist, title, album, year and embedded artwork for song introductions via `getTrackDetails(url)`, and announces completed reads with `mcguckin-track-metadata`. This uses the same fetch as Webamp; rebuild the bundle after adapter edits.
