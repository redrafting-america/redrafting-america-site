# Repository-contained ReDrafting America music player

## Purpose

The ReDrafting America player is a self-contained static-site component derived
from the verified player on `mcguckin.name`. It has no visitor package-manager,
framework, database, application server, or external media dependency.

The initial RDA presentation exposes exactly four controls: Previous,
Play/Pause, Stop, and Next. Music Info, playback-order, track presentation, and
visualization behavior remain inside the component so a later release can enable
them deliberately without rebuilding the playback engine.

The component behavior is synchronized with the verified `mcguckin.name`
package. RDA-specific names, its approved two-track catalog, the `assets/audio/`
location, and the four-button display configuration are integration boundaries;
they do not replace or disable packaged player behavior.

## Package boundary

- `assets/scripts/music-player.js` owns initialization, Webamp integration,
  playback state, autoplay recovery, cross-tab ownership, persistence/privacy,
  media-session actions, responsive controls, and the public player API.
- `assets/scripts/listening-queue.js` owns shuffle/sequential ordering, history,
  migration, and serializable queue state.
- `assets/scripts/music-catalog.js` describes the approved RDA audio library.
- `assets/styles/music-player.css` owns every rendered player element.
- `assets/vendor/webamp/` and `assets/vendor/music-metadata/` contain pinned local
  runtime dependencies and their license notices.
- `assets/audio/` remains the authoritative RDA music library. No McGuckin audio
  files are part of this package.

The shared site shell supplies only `[data-rda-music-player]`, loads the component,
and moves the same mounted player between the desktop panel and mobile drawer.
Other site code may use only `window.RDA_LISTENING`: `getState()`,
`playFile(file)`, `setMode(mode)`, and `setVisualizations(enabled)`.

`assets/scripts/navigation.js` is site integration rather than player internals.
It progressively replaces page content while leaving the mounted player and live
audio graph in place. Ordinary HTML navigation remains the fallback.

## Acceptance requirements

The four visible buttons retain the original 44-pixel size, 3-pixel gaps, icons,
press feedback, focus treatment, and active states. Exactly those four controls
must be visible at this release. Playback must preserve the original queue,
Previous/Next, Pause, Stop/reset, natural endings, blocked-autoplay recovery,
cross-page continuity, cross-tab ownership, saved preference, and media-session
behavior using the two RDA tracks.

Run the structural and queue checks before every production build:

```text
node tooling/test-music-player-package.mjs
node tooling/test-listening-queue.cjs
node tooling/test-music-player-browser.cjs
```

Browser acceptance must cover desktop and mobile layouts, keyboard operation,
all four transport controls, a natural track transition, persistent navigation,
full reload, reduced motion, and isolated component failure. Dependency updates
are a separate change and require the complete acceptance suite again.
