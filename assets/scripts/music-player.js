// Repository-contained Music Player component. Owns Webamp integration,
// playback and queue state, persistence/privacy, Settings synchronization,
// Music Info, responsive controls, recovery and the documented public API.
(() => {
  "use strict";

  /*
   * Repository-contained player lifecycle
   * 1. Resolve every dependency from this script so nested and file:// pages work.
   * 2. Project stored privacy and playback choices into any current Settings page.
   * 3. Mount one Webamp instance and one accessible responsive companion.
   * 4. Expose only RDA_LISTENING to Search and other site features.
   *
   * Playback state is deliberately centralized below. Callers must not operate on
   * Webamp internals because Stop, Pause, recovery, queue history and tab ownership
   * need to remain one transaction from the visitor's point of view.
   */
  const componentScript = [...document.scripts].find(item => item.src.endsWith("/assets/scripts/music-player.js"));
  const root = componentScript ? new URL("../../", componentScript.src) : new URL("./", location.href);
  const compactPlayerQuery = "all";
  // RDA initially exposes the four primary transport controls. The Music Info,
  // order and visualization implementations remain packaged for later activation.
  const exposedControls = Object.freeze(["previous", "play", "stop", "next"]);

  // Load presentation beside behavior while preserving the site's static URL model.
  if (!document.querySelector('link[data-music-player-styles]')) {
    const styles = document.createElement('link');
    styles.rel = 'stylesheet';
    styles.dataset.musicPlayerStyles = 'true';
    styles.href = new URL('assets/styles/music-player.css', root).href;
    document.head.append(styles);
  }

  const listeningPreferenceKey = "rda-remember-listening";
  const listeningRecordKeys = ["rda-listening-v2", "rda-webamp-playback-v1"];
  // The newest valid preference wins because some browsers may deny one storage type.
  const storedPreference = () => {
    const records = ['localStorage', 'sessionStorage'].map(kind => {
      try { return JSON.parse(window[kind].getItem(listeningPreferenceKey)); } catch { return null; }
    }).filter(item => item && typeof item.enabled === 'boolean');
    return records.sort((a,b) => b.updated - a.updated)[0]?.enabled ?? true;
  };
  let rememberListening = storedPreference();
  // Disabling remembering deletes queue/history records but never interrupts audio.
  const deleteListeningRecords = () => {
    for (const kind of ['localStorage', 'sessionStorage']) for (const key of listeningRecordKeys) {
      try { window[kind].removeItem(key); } catch {}
    }
  };
  if (!rememberListening) deleteListeningRecords();
  const syncPrivacyControls = (message = '') => {
    document.querySelectorAll('[data-remember-listening]').forEach(input => { input.checked = rememberListening; });
    document.querySelectorAll('[data-listening-privacy-status]').forEach(node => { node.textContent = message; });
  };
  const setRememberListening = enabled => {
    rememberListening = enabled;
    const value = JSON.stringify({enabled, updated: Date.now()});
    for (const kind of ['localStorage', 'sessionStorage']) {
      try { window[kind].setItem(listeningPreferenceKey, value); } catch {}
    }
    if (!enabled) deleteListeningRecords();
    syncPrivacyControls(enabled ? 'Remembering is on. Your progress will be saved.' : 'Remembering is off. Saved listening history has been deleted. Your music keeps playing.');
    document.dispatchEvent(new CustomEvent('rda:listening-preference', {detail:{enabled}}));
  };
  document.addEventListener('change', event => {
    if (event.target.matches('[data-remember-listening]')) setRememberListening(event.target.checked);
  });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-clear-listening]')) setRememberListening(false);
  });
  addEventListener('storage', event => {
    if (event.key !== listeningPreferenceKey && event.key !== null) return;
    try {
      rememberListening = event.newValue ? JSON.parse(event.newValue).enabled !== false : storedPreference();
      if (event.newValue) sessionStorage.setItem(listeningPreferenceKey, event.newValue);
    } catch { return; }
    if (!rememberListening) deleteListeningRecords();
    syncPrivacyControls('Listening privacy settings changed in another tab.');
  });
  document.addEventListener('rda:page', () => syncPrivacyControls());
  const privacyControls = suffix => `<fieldset class="listening-privacy-controls"><legend>Listening privacy</legend><label class="setting-switch"><input type="checkbox" role="switch" data-remember-listening checked aria-describedby="listening-help-${suffix}"><span class="switch-track" aria-hidden="true"><span class="switch-state-off">Off</span><span class="switch-state-on">On</span><span class="switch-thumb"></span></span><span>Remember my listening progress</span></label><p id="listening-help-${suffix}">On by default. Turn off to delete saved history. Music keeps playing; progress lasts only until you reload or close this page.</p><button type="button" data-clear-listening>Clear history and turn off remembering</button><p role="status" data-listening-privacy-status></p></fieldset>`;

  const playbackControls = () => `<fieldset class="playback-preferences"><legend>Playback controls</legend><label>Playback order <select data-playback-order aria-label="Playback order"><option value="shuffle">Shuffle</option><option value="sequential">Sequential</option></select></label><p>Shuffle avoids repeats until every song has been selected. Sequential follows the numbered song order and starts again after the last song. Changing order keeps your current song playing.</p><label class="setting-switch"><input type="checkbox" role="switch" data-visualizations checked><span class="switch-track" aria-hidden="true"><span class="switch-state-off">Off</span><span class="switch-state-on">On</span><span class="switch-thumb"></span></span><span>Music visualizations</span></label><p>Controls the music-reactive footer only. Pausing site animations or using reduced motion also pauses these effects. These choices are saved only when remembering is on.</p></fieldset>`;
  // Project component state into both footer buttons and Settings-page controls.
  const syncPlaybackControls = () => {
    const state = window.RDA_LISTENING?.getState();
    if (!state) return;
    document.querySelectorAll('[data-playback-order]').forEach(el => { el.value = state.mode; });
    document.querySelectorAll('[data-toggle-order]').forEach(el => { el.dataset.mode = state.mode; el.textContent = state.mode === 'shuffle' ? 'Shuffle' : 'Sequential'; el.setAttribute('aria-label', `Playback order: ${el.textContent}. Switch to ${state.mode === 'shuffle' ? 'Sequential' : 'Shuffle'}`); });
    document.querySelectorAll('[data-visualizations]').forEach(el => { el.checked = state.visualizations; });
    document.querySelectorAll('[data-toggle-visualizations]').forEach(el => { el.setAttribute('aria-pressed', String(state.visualizations)); el.innerHTML = `<span>Visuals</span><span>${state.visualizations ? 'ON' : 'OFF'}</span>`; });
  };
  document.addEventListener('change', event => {
    if (event.target.matches('[data-playback-order]')) window.RDA_LISTENING?.setMode(event.target.value);
    if (event.target.matches('[data-visualizations]')) window.RDA_LISTENING?.setVisualizations(event.target.checked);
  });
  document.addEventListener('click', event => {
    const api = window.RDA_LISTENING;
    if (event.target.closest('[data-toggle-order]') && api) api.setMode(api.getState().mode === 'shuffle' ? 'sequential' : 'shuffle');
    if (event.target.closest('[data-toggle-visualizations]') && api) api.setVisualizations(!api.getState().visualizations);
  });
  document.addEventListener('rda:page', syncPlaybackControls);

  function loadMusicCatalog() {
    if (window.RDA_MUSIC_CATALOG) return Promise.resolve();
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = new URL('assets/scripts/music-catalog.js', root).href;
      script.onload = resolve;
      script.onerror = resolve; // Runtime tags remain a fallback if the catalog is unavailable.
      document.head.append(script);
    });
  }
  const presentationTags = url => {
    const file = decodeURIComponent(new URL(url, root).pathname.split('/').pop());
    const item = window.RDA_MUSIC_CATALOG?.[file];
    return item ? {...item, artwork: item.artwork ? new URL(item.artwork, root).href : ''}
      : window.McGuckinMusicMetadata?.getTrackDetails?.(url) || {};
  };

  /** Load the locally vendored Webamp bundle once per document. */
  function loadWebamp() {
    if (window.Webamp) return Promise.resolve(window.Webamp);
    return new Promise((resolve, reject) => {
      const bundle = document.createElement("script");
      bundle.src = new URL("assets/vendor/webamp/webamp-2.3.1.lazy.min.js", root).href;
      bundle.onload = () => resolve(window.Webamp);
      bundle.onerror = () => reject(new Error("The Webamp bundle could not be loaded."));
      document.head.append(bundle);
    });
  }

  function loadListeningQueue() {
    if (window.RdaListeningQueue) return Promise.resolve(window.RdaListeningQueue);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL("assets/scripts/listening-queue.js", root).href;
      script.onload = () => resolve(window.RdaListeningQueue);
      script.onerror = () => reject(new Error("The listening queue could not be loaded."));
      document.head.append(script);
    });
  }

  /** Accessible shared presentation backed by the same Webamp instance and audio graph. */
  function initializeMobileCompanion(webamp, container, mobileQuery, initialTrack) {
    const panel = document.createElement("section");
    panel.className = "mobile-player";
    panel.dataset.exposedControls = exposedControls.join(" ");
    panel.setAttribute("aria-label", "Music controls");
    const icons = {
      previous: '<path d="M6 5v14M19 5 8 12l11 7Z"/>',
      play: '<path d="m7 4 13 8-13 8Z"/>',
      pause: '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>',
      stop: '<path d="M5 5h14v14H5z"/>',
      next: '<path d="M18 5v14M5 5l11 7-11 7Z"/>',
    };
    const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
    panel.innerHTML = `
      <div class="mobile-track">
        <span class="mobile-track-viewport"><span class="mobile-track-text">Loading music…</span></span>
        <span class="mobile-track-time" aria-hidden="true">0:00</span>
      </div>
      <div class="mobile-transport">
        <canvas class="mobile-spectrum" aria-hidden="true"></canvas>
        <button type="button" data-transport="previous" aria-label="Previous track">${icon("previous")}</button>
        <button type="button" data-transport="play" aria-label="Play" class="mobile-play-toggle">${icon("play")}</button>
        <button type="button" data-transport="stop" aria-label="Stop">${icon("stop")}</button>
        <button type="button" data-transport="next" aria-label="Next track">${icon("next")}</button>
        <button type="button" data-music-info aria-label="Music Info" title="Music Info" aria-expanded="false" aria-controls="mobile-track-details"><span class="music-info-symbol" aria-hidden="true">i</span></button>
        <button type="button" class="extra-playback-control" data-toggle-order>Shuffle</button>
        <button type="button" class="extra-playback-control" data-toggle-visualizations aria-label="Music visualizations" aria-pressed="true"><span>Visuals</span><span>ON</span></button>
      </div>
      <div class="mobile-track-details" id="mobile-track-details" hidden><div class="track-introduction"><div class="track-artwork"><span aria-hidden="true">♪</span><img hidden alt="" /></div><div class="track-details-text"><strong class="track-album-artist"></strong><em class="track-song-title" tabindex="0" aria-label="Song title"></em><span class="track-album-title" tabindex="0" aria-label="Album and year"></span></div><p class="track-personal-comment" tabindex="0" aria-label="Personal comment" hidden></p></div></div>
      <span class="mobile-player-status" role="status" aria-live="polite"></span>`;
    container.append(panel);
    document.dispatchEvent(new Event("rda:player-ready"));
    const feedbackTimers = new WeakMap();
    panel.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      clearTimeout(feedbackTimers.get(button));
      button.classList.add('press-feedback');
      feedbackTimers.set(button, setTimeout(() => button.classList.remove('press-feedback'), 220));
    });
    const audio = webamp.media?._source?._audio;
    const trackButton = panel.querySelector("[data-music-info]");
    const trackDisplay = panel.querySelector(".mobile-track");
    const titleViewport = panel.querySelector(".mobile-track-viewport");
    const titleText = panel.querySelector(".mobile-track-text");
    const trackDetails = panel.querySelector(".mobile-track-details");
    syncPrivacyControls();
    const personalComment = panel.querySelector(".track-personal-comment");
    const albumArtist = panel.querySelector(".track-album-artist");
    const songTitle = panel.querySelector(".track-song-title");
    const albumTitle = panel.querySelector(".track-album-title");
    const artwork = panel.querySelector(".track-artwork img");
    const artworkFallback = panel.querySelector(".track-artwork span");
    const introduction = panel.querySelector(".track-introduction");
    const introductionText = panel.querySelector(".track-details-text");
    let introductionSizingFrame = 0;
    // Begin each measurement at the 68px minimum, then allow up to three
    // wrapping passes because wider artwork can narrow the metadata column.
    const syncIntroductionGeometry = () => {
      cancelAnimationFrame(introductionSizingFrame);
      if (trackDetails.hidden) return;
      introduction.style.setProperty("--track-art-size", "68px");
      let passes = 0;
      const measure = () => {
        const target = Math.min(100, Math.max(68, Math.ceil(introductionText.scrollHeight)));
        introduction.style.setProperty("--track-art-size", `${target}px`);
        if (++passes < 3) introductionSizingFrame = requestAnimationFrame(measure);
      };
      introductionSizingFrame = requestAnimationFrame(measure);
    };
    const updateIntroduction = track => {
      const tags = presentationTags(track.url);
      albumArtist.textContent = tags.artists?.length ? tags.artists.join(" & ") : (track.metaData?.artist || tags.albumArtist || "Artist not specified").split(/;\s*/).join(" & ");
      songTitle.textContent = tags.title || track.metaData?.title || track.defaultName || "Loading song…";
      albumTitle.textContent = `${tags.album || "Album not specified"}${tags.year ? ` (${tags.year})` : ""}`;
      personalComment.textContent = tags.comment || "";
      personalComment.hidden = !tags.comment;
      artwork.hidden = !tags.artwork;
      artworkFallback.hidden = !!tags.artwork;
      if (tags.artwork) {
        if (artwork.getAttribute("src") !== tags.artwork) artwork.src = tags.artwork;
      } else artwork.removeAttribute("src");
      syncIntroductionGeometry();
    };
    artwork.addEventListener("error", () => { artwork.hidden = true; artworkFallback.hidden = false; });
    let motionPaused = false;
    try { motionPaused = localStorage.getItem("rda-motion-paused") === "true"; } catch {}
    const time = panel.querySelector(".mobile-track-time");
    const playButton = panel.querySelector(".mobile-play-toggle");
    const status = panel.querySelector(".mobile-player-status");
    const canvas = panel.querySelector("canvas");
    canvas.classList.add("footer-spectrum");
    container.closest(".full-footer")?.prepend(canvas);
    const context = canvas.getContext("2d");
    // Version-pinned media adapter: reuse the existing analyser, never connect a second audio output.
    const analyser = webamp.media?.getAnalyser?.();
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let clockTimer = 0;
    let lastPaint = 0;
    let bins = new Uint8Array(analyser?.frequencyBinCount || 0);
    let title = "Music";
    const visualizerStyles = ["bars", "mirror", "wave", "dots"];
    let visualizerStyle = "";
    let visualizerTrack = "";
    let waveform = new Uint8Array(analyser?.fftSize || 0);
    const chooseVisualizer = () => {
      let previous = visualizerStyle;
      try { previous ||= sessionStorage.getItem("rda-footer-visualizer"); } catch {}
      const choices = visualizerStyles.filter(style => style !== previous);
      visualizerStyle = choices[Math.floor(Math.random() * choices.length)];
      panel.dataset.visualizer = visualizerStyle;
      try { sessionStorage.setItem("rda-footer-visualizer", visualizerStyle); } catch {}
    };

    const updateMarquee = () => {
      const viewportStyle = getComputedStyle(titleViewport);
      const contentWidth = titleViewport.clientWidth - parseFloat(viewportStyle.paddingLeft) - parseFloat(viewportStyle.paddingRight);
      // Round outward and travel two extra pixels so fractional font metrics can
      // never hide the final dot-matrix character at the far endpoint.
      const overflow = Math.max(0, Math.ceil(titleText.scrollWidth - contentWidth) + 2);
      titleViewport.classList.toggle("has-overflow", overflow > 1);
      titleViewport.style.setProperty("--title-travel", `${-overflow}px`);
      titleViewport.style.setProperty("--title-duration", `${Math.max(9, overflow / 18 + 5)}s`);
    };
    const setTrack = track => {
      if (!track) return;
      const tags = presentationTags(track.url);
      if (tags.title) track = {...track, metaData:{title:tags.title, artist:tags.artists?.join(" & ") || tags.albumArtist}};
      title = [track.metaData?.title || track.defaultName || (track.url ? decodeURIComponent(new URL(track.url, location.href).pathname.split("/").pop()).replace(/\.mp3$/i, "") : "Music"), track.metaData?.artist].filter(Boolean).join(" — ");
      const trackKey = track.url || title;
      if (trackKey !== visualizerTrack) {
        visualizerTrack = trackKey;
        chooseVisualizer();
      }
      titleText.textContent = title;
      updateIntroduction(track);
      trackButton.setAttribute("aria-label", `Show song details: ${title}`);
      if (trackDisplay.hasAttribute("role")) trackDisplay.setAttribute("aria-label", `Show song details: ${title}`);
      status.textContent = title;
      titleViewport.classList.remove("has-overflow");
      requestAnimationFrame(updateMarquee);
    };
    setTrack(initialTrack);
    webamp.onTrackDidChange(setTrack);
    // Metadata can finish after the track-change event (notably in Safari).
    // Update only changed labels so the marquee and visualizer keep their state.
    const syncTrackTags = () => {
      const track = Object.values(webamp.store.getState().tracks).find(item => item.url === visualizerTrack);
      if (!track?.title) return;
      const tags = presentationTags(track.url);
      const taggedTitle = tags.title ? [tags.title, tags.artists?.join(" & ") || tags.albumArtist].filter(Boolean).join(" — ") : [track.title, track.artist].filter(Boolean).join(" — ");
      if (taggedTitle !== title) setTrack({url:track.url, metaData:{title:track.title, artist:track.artist}});
    };
    window.addEventListener("rda-track-metadata", event => {
      if (event.detail.url === visualizerTrack) updateIntroduction({url: visualizerTrack});
    });
    webamp.store.subscribe(syncTrackTags);
    syncTrackTags();
    const positionIntroduction = () => {
      const footer = container.closest(".full-footer");
      if (footer) trackDetails.style.bottom = `${panel.getBoundingClientRect().bottom - footer.getBoundingClientRect().top}px`;
    };
    new ResizeObserver(positionIntroduction).observe(container.closest(".full-footer") || container);
    const setDetailsOpen = open => {
      positionIntroduction();
      trackDetails.hidden = !open;
      if (open) syncIntroductionGeometry();
      trackButton.setAttribute("aria-expanded", String(open));
    };
    let introductionWidth = 0;
    // Width changes alter wrapping. Ignore height-only observations created by
    // the artwork adjustment itself so the sizing loop remains finite.
    new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      if (Math.abs(width - introductionWidth) < .5) return;
      introductionWidth = width;
      syncIntroductionGeometry();
    }).observe(panel);
    const toggleDetails = () => setDetailsOpen(trackDetails.hidden);
    trackButton.addEventListener("click", toggleDetails);
    document.addEventListener("pointerdown", event => {
      // Mirroring can precede a real tap with an out-of-page (-1, -1) event.
      if (event.clientX < 0 || event.clientY < 0) return;
      if (!panel.contains(event.target)) {
        setDetailsOpen(false);
      }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !trackDetails.hidden) {
        setDetailsOpen(false);
        // Every responsive layout now uses the dedicated Music Info control.
        trackButton.focus();
      }
    });
    let transportPlayPending = false;
    // Webamp normally retains one audio element, but reading the current source
    // also keeps the display authoritative if the pinned adapter replaces it.
    const currentAudio = () => webamp.media?._source?._audio || audio;
    const playing = () => {
      const media = currentAudio();
      return webamp.getMediaStatus() === "PLAYING" && Boolean(media && !media.paused && !media.ended) && webamp.media?._context?.state === "running";
    };
    const renderClock = () => {
      // STOPPED is an authoritative zero even if iOS still exposes the prior
      // media position while it prepares or changes the underlying source.
      const stopped = webamp.getRequestedMediaStatus?.() === "STOPPED";
      const seconds = stopped ? 0 : Math.max(0, Math.floor(currentAudio()?.currentTime || 0));
      const label = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
      if (time.textContent !== label) time.textContent = label;
    };
    // iOS Safari can resume restored audio without delivering a dependable
    // playback-start or timeupdate event to this companion. Keep one low-cost
    // visible-page heartbeat alive so it can discover that transition itself.
    const runClock = () => {
      clockTimer = 0;
      renderClock();
      const media = currentAudio();
      if (!document.hidden) clockTimer = setTimeout(runClock, media && !media.paused && !media.ended ? 250 : 1000);
    };
    const syncClock = () => {
      renderClock();
      const media = currentAudio();
      if (document.hidden) {
        clearTimeout(clockTimer); clockTimer = 0;
      } else if (!clockTimer) clockTimer = setTimeout(runClock, media && !media.paused && !media.ended ? 250 : 1000);
    };
    const clearSpectrum = () => context?.clearRect(0, 0, canvas.width, canvas.height);
    const mayAnimate = () => mobileQuery.matches && !document.hidden && !reducedMotion.matches && !motionPaused && window.RDA_LISTENING?.getState().visualizations !== false && playing();
    const paint = timestamp => {
      frame = 0;
      if (!mayAnimate() || !context || !analyser) { clearSpectrum(); return; }
      if (timestamp - lastPaint >= 33) {
        lastPaint = timestamp;
        const bounds = canvas.getBoundingClientRect();
        const ratio = Math.min(devicePixelRatio || 1, 2);
        const width = Math.round(bounds.width * ratio);
        const height = Math.round(bounds.height * ratio);
        if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
        // The native visualization may change FFT size when desktop mode returns.
        if (bins.length !== analyser.frequencyBinCount) bins = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(bins);
        context.clearRect(0, 0, width, height);
        const bars = Math.max(28, Math.min(96, Math.floor(bounds.width / 12)));
        const step = width / bars;
        const gradient = context.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, "#219bb6"); gradient.addColorStop(1, "#b4ec67");
        context.fillStyle = gradient;
        if (visualizerStyle === "wave") {
          if (waveform.length !== analyser.fftSize) waveform = new Uint8Array(analyser.fftSize);
          analyser.getByteTimeDomainData(waveform);
          context.strokeStyle = gradient;
          context.lineWidth = 2 * ratio;
          context.beginPath();
          for (let point = 0; point < 128; point += 1) {
            const sample = waveform[Math.floor(point / 128 * waveform.length)];
            const x = point / 127 * width;
            const y = height / 2 + (sample - 128) / 128 * height * .46;
            if (point === 0) context.moveTo(x, y); else context.lineTo(x, y);
          }
          context.stroke();
        } else {
          for (let bar = 0; bar < bars; bar += 1) {
            const low = Math.floor(Math.pow(bar / bars, 2) * bins.length * .65);
            const high = Math.max(low + 1, Math.floor(Math.pow((bar + 1) / bars, 2) * bins.length * .65));
            let magnitude = 0;
            for (let index = low; index < high; index += 1) magnitude += bins[index];
            const barHeight = magnitude / (high - low) / 255 * height;
            if (visualizerStyle === "mirror") {
              context.fillRect(bar * step, (height - barHeight) / 2, Math.max(1, step - 2 * ratio), barHeight);
            } else if (visualizerStyle === "dots") {
              const spacing = 5 * ratio;
              for (let y = height - spacing / 2; y >= height - barHeight; y -= spacing) {
                context.beginPath();
                context.arc((bar + .5) * step, y, Math.min(1.7 * ratio, step * .3), 0, Math.PI * 2);
                context.fill();
              }
            } else {
              context.fillRect(bar * step, height - barHeight, Math.max(1, step - 2 * ratio), barHeight);
            }
          }
        }
      }
      frame = requestAnimationFrame(paint);
    };
    const sync = () => {
      const active = playing();
      const label = active ? "Pause" : "Play";
      playButton.classList.toggle("is-playing", active);
      if (active) transportPlayPending = false;
      const explicitlyPaused = !active && webamp.getRequestedMediaStatus?.() === "PAUSED";
      const stopped = !active && !explicitlyPaused;
      playButton.classList.toggle("is-current", !stopped);
      panel.querySelector('[data-transport="stop"]').classList.toggle("is-current", stopped);
      if (playButton.getAttribute("aria-label") !== label) {
        playButton.setAttribute("aria-label", label);

      }
      const glyph = explicitlyPaused ? "pause" : "play";
      if (playButton.dataset.glyph !== glyph) {
        playButton.dataset.glyph = glyph;
        playButton.innerHTML = icon(glyph);
      }
      playButton.dataset.state = active ? "playing" : explicitlyPaused ? "paused" : "stopped";
      panel.classList.toggle("is-playing", active);
      syncClock();
      if (mayAnimate() && analyser && context) {
        if (!frame) frame = requestAnimationFrame(paint);
      } else {
        cancelAnimationFrame(frame); frame = 0; clearSpectrum();
      }
    };
    panel.querySelectorAll("[data-transport]").forEach(button => {
      button.addEventListener("click", () => {
        const action = button.dataset.transport;
        if (action === "play" && (playing() || transportPlayPending)) { transportPlayPending = false; webamp.pause(); }
        else if (action === "stop") {
          transportPlayPending = false;
          webamp.stop();
          // Reflect the command immediately; the player-level stopped status
          // keeps later heartbeat paints at zero during an iOS source change.
          time.textContent = "0:00";
        }
        else {
          // Resume WebAudio directly within the tap gesture on mobile browsers.
          webamp.media?._context?.resume().catch(() => { status.textContent = "Tap Play to start music."; });
          if (action === "previous") webamp.previousTrack();
          else if (action === "next") webamp.nextTrack();
          else { transportPlayPending = true; webamp.play(); }
        }
        sync();
        requestAnimationFrame(sync);
      });
    });
    webamp.store.subscribe(() => queueMicrotask(sync));
    webamp.media?._context?.addEventListener("statechange", sync);
    for (const event of ["play", "playing", "pause", "ended", "timeupdate", "emptied"]) audio?.addEventListener(event, sync);
    const resize = new ResizeObserver(updateMarquee);
    resize.observe(titleViewport);
    resize.observe(titleText);
    mobileQuery.addEventListener("change", () => {
      setDetailsOpen(false);
      updateMarquee(); sync();
    });
    const syncMotion = () => {
      document.dispatchEvent(new CustomEvent("rda:motion", {detail:{paused:motionPaused}}));
      panel.classList.toggle("motion-paused", motionPaused);
      canvas.hidden = motionPaused || !window.RDA_LISTENING?.getState().visualizations;
      sync();
    };
    document.addEventListener('rda:set-motion',event=>{
      motionPaused=Boolean(event.detail.paused);
      try { localStorage.setItem('rda-motion-paused',String(motionPaused)); } catch {}
      syncMotion();
    });
    document.addEventListener("rda:playback-settings", syncMotion);
    syncPlaybackControls();
    reducedMotion.addEventListener("change", syncMotion);
    syncMotion();
    document.addEventListener("visibilitychange", sync);
    addEventListener("pagehide", () => { cancelAnimationFrame(frame); frame = 0; clearTimeout(clockTimer); clockTimer = 0; });
    addEventListener("pageshow", sync);
    document.fonts?.ready.then(updateMarquee);
    sync();
  }

  /** Mount the shared footer player and restore this tab's listening state. */
  async function initializeFooterPlayer() {
    const container = document.querySelector("[data-rda-music-player]");
    if (!container) return;
    const phonePlayer = matchMedia(compactPlayerQuery);

    await loadMusicCatalog();
    const files = Object.keys(window.RDA_MUSIC_CATALOG || {}).sort((a,b) => a.localeCompare(b, 'en', {numeric:true}));
    if (!files.length) { container.textContent = 'Music library unavailable. Reload to try again.'; return; }
    const tracks = files.map(file => ({url:new URL(`assets/audio/${encodeURIComponent(file)}`, root).href, defaultName:file.replace(/\.mp3$/i, '')}));

    const playbackStateKey = "rda-listening-v2";
    const legacyPlaybackKey = "rda-webamp-playback-v1";
    const ids = [...files];
    const owner = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const readStorage = (kind, key) => {
      try { return JSON.parse(window[kind].getItem(key) || "null"); } catch { return null; }
    };
    const readSaved = () => {
      if (!rememberListening) return null;
      const local = readStorage('localStorage', playbackStateKey);
      const session = readStorage('sessionStorage', playbackStateKey);
      // If persistent writes are denied after previously succeeding, the session
      // fallback may be newer than the still-readable persistent record.
      return session && (!local || session.updated > (local.updated || 0)) ? session : local;
    };
    let ownsPlayback = true;
    let lastWrite = 0;
    try {
      const [Webamp, ListeningQueue] = await Promise.all([loadWebamp(), loadListeningQueue(), loadMusicCatalog()]);
      tracks.forEach(track => {
        const tags = presentationTags(track.url);
        if (tags.title) track.metaData = {title:tags.title, artist:tags.artists.join(' & ')};
      });
      const saved = rememberListening ? readSaved() || ListeningQueue.migrate(readStorage('sessionStorage', legacyPlaybackKey), ids) : null;
      // A new document remembers the queue and selected song, but never seeks
      // into the previous visit. Internal navigation keeps this document alive
      // and therefore retains its live position without using saved time.
      const startupSaved = saved ? {...saved, position: 0} : null;
      let queue = new ListeningQueue(ids, startupSaved);
      // Stop controls only the current document. A complete load retains the
      // selected song and settings but returns a formerly stopped visit to the
      // normal zero-start path, where browser autoplay rules still apply.
      const startupStatus = queue.status === "STOPPED" ? "PLAYING" : queue.status;
      const restoredState = {trackIndex: ids.indexOf(queue.current), volume: queue.volume, status: startupStatus};
      if (typeof Webamp !== "function") throw new Error("Webamp did not initialize.");
      const webamp = new Webamp({
        initialTracks: tracks,
        requireMusicMetadata: () => new Promise((resolve, reject) => {
          if (window.McGuckinMusicMetadata) return resolve(window.McGuckinMusicMetadata);
          let script = document.querySelector("script[data-music-metadata]");
          if (!script) {
            script = document.createElement("script");
            script.dataset.musicMetadata = "true";
            script.src = new URL("assets/vendor/music-metadata/music-metadata-11.16.1.min.js", root).href;
            document.head.append(script);
          }
          script.addEventListener("load", () => resolve(window.McGuckinMusicMetadata), {once:true});
          script.addEventListener("error", () => reject(new Error("MP3 tag reader failed to load")), {once:true});
        }),
        enableHotkeys: false,
        enableMediaSession: true,
        windowLayout: {
          main: { position: { top: 0, left: 0 }, shadeMode: phonePlayer.matches },
          equalizer: { position: { top: 0, left: 0 }, closed: true },
          playlist: { position: { top: 0, left: 0 }, closed: true },
          milkdrop: { position: { top: 0, left: 0 }, closed: true },
        },
      });
      // Expose the instance for deterministic release testing and diagnostics.
      window.RDA_WEBAMP = webamp;
      container.replaceChildren();
      // Webamp rejects a statically positioned mount. Establish its required
      // containing block even if shared CSS has not finished applying yet.
      container.style.position = "relative";
      await webamp.renderInto(container);
      container.firstElementChild?.classList.add("native-webamp");
      container.classList.add("is-ready");

      // Keep Webamp synchronized with the site's phone breakpoint. Webamp does
      // not expose a public shade-mode setter, so its own labeled title-bar
      // control is used when the viewport crosses the breakpoint.
      const syncPlayerSize = () => {
        const mainWindow = container.querySelector(".window");
        const shadeControl = container.querySelector('[title="Toggle Windowshade Mode"]');
        if (!mainWindow || !shadeControl) return;
        const isShadeMode = mainWindow.classList.contains("shade");
        if (isShadeMode !== phonePlayer.matches) shadeControl.click();
        container.style.setProperty("--webamp-adjust-x", "0px");
        container.style.setProperty("--webamp-adjust-y", "0px");
        if (phonePlayer.matches) return;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const footer = container.closest(".full-footer")?.getBoundingClientRect();
          const windowBounds = container.querySelector(".window")?.getBoundingClientRect();
          if (!footer || !windowBounds) return;
          const adjustmentX = (footer.left + footer.right - windowBounds.left - windowBounds.right) / 2;
          const adjustmentY = (footer.top + footer.bottom - windowBounds.top - windowBounds.bottom) / 2;
          container.style.setProperty("--webamp-adjust-x", `${adjustmentX}px`);
          container.style.setProperty("--webamp-adjust-y", `${adjustmentY}px`);
        }));
      };
      phonePlayer.addEventListener?.("change", () => requestAnimationFrame(syncPlayerSize));
      syncPlayerSize();

      // Restore this tab's most recent track before seeking. This retains the
      // direct-static architecture while avoiding a playlist restart on every
      // ordinary internal navigation.
      const mediaElement = webamp.media?._source?._audio;
      // Webamp 2.3.1 swallows play() rejection and still marks its source playing.
      // On a later retry it seeks non-paused sources to zero. The real element is
      // authoritative when normalizing source state and reporting playback.
      const playMedia = webamp.media.play.bind(webamp.media);
      const pauseMedia = webamp.media.pause.bind(webamp.media);
      const stopMedia = webamp.media.stop.bind(webamp.media);
      let playbackAttempt = 0;
      let requestedMediaStatus = "PAUSED";
      let resetToZeroPending = false;
      webamp.getRequestedMediaStatus = () => requestedMediaStatus;
      let armPlaybackRecovery = () => {};
      let disarmPlaybackRecovery = () => {};
      webamp.media.pause = (...args) => { requestedMediaStatus = "PAUSED"; playbackAttempt += 1; disarmPlaybackRecovery(); return pauseMedia(...args); };
      const enforceStoppedPosition = () => {
        if (!mediaElement || (!resetToZeroPending && requestedMediaStatus !== "STOPPED")) return;
        mediaElement.pause();
        try {
          mediaElement.currentTime = 0;
          // Some mobile engines still report readyState zero after accepting
          // the seek. The observed position, rather than readiness, confirms it.
          if (Math.abs(mediaElement.currentTime) < .01) resetToZeroPending = false;
        } catch {
          // The readiness listeners below retry after iOS finishes preparing
          // the media resource; the visible and saved clocks remain zero now.
        }
        queue.position = 0;
      };
      for (const event of ["loadedmetadata", "durationchange", "canplay"]) mediaElement?.addEventListener(event, enforceStoppedPosition);
      webamp.media.stop = (...args) => { requestedMediaStatus = "STOPPED"; resetToZeroPending = true; playbackAttempt += 1; disarmPlaybackRecovery();
        let result;
        try { result = stopMedia(...args); }
        catch { mediaElement?.pause(); /* The readiness retry below owns zero. */ }
        enforceStoppedPosition();
        queue.position = 0;
        queueMicrotask(() => persistPlayback());
        return result; };
      webamp.media.play = async (...args) => {
        // A Play immediately following Stop must start at zero even if iOS
        // deferred the original seek while preparing the media resource.
        if (resetToZeroPending) enforceStoppedPosition();
        if (mediaElement?.paused && mediaElement.currentTime > 0) pauseMedia();
        requestedMediaStatus = "PLAYING";
        const attempt = ++playbackAttempt;
        await playMedia(...args);
        // The pinned source swallows native play rejection. Check the real
        // element after settlement, including every automatic track transition.
        if (attempt !== playbackAttempt) {
          // A later Pause/Stop must win over a pending source.play settlement.
          if (requestedMediaStatus !== "PLAYING") {
            const stopped = requestedMediaStatus === "STOPPED";
            pauseMedia();
            if (stopped) {
              resetToZeroPending = true;
              enforceStoppedPosition();
            }
            webamp.store.dispatch({ type: stopped ? "IS_STOPPED" : "PAUSE" });
            persistPlayback();
          }
          return;
        }
        if (mediaElement?.paused) {
          webamp.store.dispatch({ type: "PAUSE" });
          requestedMediaStatus = "PLAYING";
          armPlaybackRecovery();
          persistPlayback();
        } else if (webamp.media?._context?.state !== "running") {
          armPlaybackRecovery();
        }
      };
      // One sequence owns manual controls, natural endings and saved history.
      const startupTrackIndex = restoredState.trackIndex;
      let currentTrackIndex = startupTrackIndex;
      let persistPlayback = () => {};
      let writeQueueSnapshot = () => {};
      let selectingQueueTrack = false;
      const nativeSetCurrentTrack = webamp.setCurrentTrack.bind(webamp);
      const selectQueueTrack = (id, play = true) => {
        if (!id) return;
        currentTrackIndex = ids.indexOf(id);
        selectingQueueTrack = true;
        // PLAY_TRACK performs one load/start even when currently stopped.
        // Public setCurrentTrack only buffers in STOPPED state.
        if (play) webamp.store.dispatch({type: "PLAY_TRACK", id: currentTrackIndex});
        else nativeSetCurrentTrack(currentTrackIndex);
        selectingQueueTrack = false;
        persistPlayback();
      };
      const claimQueue = () => {
        const latest = readSaved();
        if (!ownsPlayback || (latest?.owner && latest.owner !== owner)) {
          queue = new ListeningQueue(ids, latest || queue.snapshot());
          currentTrackIndex = ids.indexOf(queue.current);
        }
        ownsPlayback = true;
        writeQueueSnapshot();
        syncPlaybackControls();
        document.dispatchEvent(new CustomEvent("rda:playback-settings"));
      };
      webamp.previousTrack = () => {
        claimQueue();
        const id = queue.previous();
        if (id) selectQueueTrack(id);
      };
      webamp.nextTrack = () => {
        claimQueue();
        selectQueueTrack(queue.next());
      };
      // Direct API track selection is an intentional choice, like revisiting history.
      webamp.setCurrentTrack = index => {
        if (!Number.isInteger(index) || !ids[index]) return;
        claimQueue();
        queue.select(ids[index]);
        selectQueueTrack(ids[index], false);
      };
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('previoustrack', () => webamp.previousTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => webamp.nextTrack());
      }
      // Capture precedes Webamp's bubble listener: it must not select a second song.
      mediaElement?.addEventListener('ended', event => {
        event.stopImmediatePropagation();
        if (ownsPlayback && mediaElement.ended) webamp.nextTrack();
      }, true);
      // A failed file is not a completed song. Retain its slot for an explicit retry.
      mediaElement?.addEventListener('error', event => {
        event.stopImmediatePropagation();
        webamp.store.dispatch({type: "PAUSE"});
        persistPlayback();
      }, true);
      const settingsChanged = () => {
        syncPlaybackControls();
        document.dispatchEvent(new CustomEvent('rda:playback-settings'));
      };
      const changePreference = change => {
        const latest = readSaved();
        if (rememberListening && latest?.owner && latest.owner !== owner) {
          // Update preferences without taking over another tab's audio or queue.
          const shared = new ListeningQueue(ids, latest);
          change(shared);
          change(queue);
          const value = JSON.stringify({...shared.snapshot(), owner: latest.owner, updated: Date.now()});
          try { localStorage.setItem(playbackStateKey, value); } catch {}
          try { sessionStorage.setItem(playbackStateKey, value); } catch {}
        } else {
          change(queue);
          persistPlayback();
        }
        settingsChanged();
      };
      // This is the complete cross-feature contract. Search and Settings use no
      // Webamp implementation details, which keeps this component replaceable.
      window.RDA_LISTENING = {
        getState: () => queue.snapshot(),
        playFile: file => { if (!ids.includes(file)) return false; claimQueue(); queue.select(file); selectQueueTrack(file); return true; },
        setMode: mode => changePreference(state => state.setMode(mode)),
        setVisualizations: enabled => changePreference(state => { state.visualizations = Boolean(enabled); })
      };
      const trackIndexForUrl = (url) => {
        if (!url) return -1;
        try {
          const normalized = new URL(url, location.href).href;
          return tracks.findIndex((candidate) => candidate.url === normalized);
        } catch {
          return -1;
        }
      };
      const trackIndexFromPlayer = () => {
        const displayedNumber = container.querySelector("#marquee")?.textContent?.match(/^\s*(\d+)\./)?.[1];
        const displayedIndex = Number(displayedNumber) - 1;
        return Number.isInteger(displayedIndex) && displayedIndex >= 0 && displayedIndex < tracks.length
          ? displayedIndex
          : -1;
      };
      webamp.onTrackDidChange((track) => {
        const matchedIndexByUrl = trackIndexForUrl(track?.url);
        const matchedIndex = matchedIndexByUrl >= 0
          ? matchedIndexByUrl
          : trackIndexFromPlayer();
        if (matchedIndex >= 0) {
          currentTrackIndex = matchedIndex;
          if (!selectingQueueTrack) queue.select(ids[matchedIndex]);
          persistPlayback();
        }
      });
      // In pinned 2.3.1, the public pause() toggles. Buffer the chosen track while
      // stopped, then dispatch an idempotent pause so restoration never starts it.
      webamp.stop();
      // Subscribe before selection: assigning even the same URL reloads the element,
      // but readyState can briefly still describe the previous resource.
      const selectedTrackReady = mediaElement
        ? new Promise((resolve) => {
          const finish = () => {
            clearTimeout(timeout);
            mediaElement.removeEventListener("loadedmetadata", finish);
            mediaElement.removeEventListener("error", finish);
            resolve();
          };
          const timeout = setTimeout(finish, 3000);
          mediaElement.addEventListener("loadedmetadata", finish, { once: true });
          mediaElement.addEventListener("error", finish, { once: true });
        })
        : Promise.resolve();
      nativeSetCurrentTrack(startupTrackIndex);
      await selectedTrackReady;
      // Normalize Webamp's private source as paused after selecting the saved
      // song. A full document load intentionally begins that song at zero;
      // only persistent navigation within this document retains live position.
      pauseMedia();
      webamp.store.dispatch({ type: "PAUSE" });
      // The Stop above is an internal initialization step, not an owner Stop.
      // Restore playback intent and volume without restoring elapsed time.
      requestedMediaStatus = restoredState.status;
      resetToZeroPending = false;
      queue.position = 0;
      if (mediaElement) {
        try { mediaElement.currentTime = 0; } catch { /* Initial Stop already owns the readiness retry. */ }
      }
      webamp.setVolume(restoredState.volume);
      // The site owns shuffle. Native random selection must remain disabled.
      if (webamp.isShuffleEnabled()) webamp.toggleShuffle();
      const selectedMetadata = Object.values(webamp.store.getState().tracks).find(track => track.url === tracks[startupTrackIndex].url);
      initializeMobileCompanion(webamp, container, phonePlayer, selectedMetadata
        ? {...tracks[startupTrackIndex], metaData: {title:selectedMetadata.title, artist:selectedMetadata.artist}}
        : tracks[startupTrackIndex]);

      const writeSnapshot = () => {
        if (!rememberListening) return;
        const snapshot = {...queue.snapshot(), owner, updated: Date.now()};
        const value = JSON.stringify(snapshot);
        try { localStorage.setItem(playbackStateKey, value); }
        catch { /* Session storage or memory still provides a usable current visit. */ }
        try { sessionStorage.setItem(playbackStateKey, value); } catch {}
        lastWrite = Date.now();
      };
      const savePlaybackState = (claim = false) => {
        const latest = readSaved();
        if (!claim && (!ownsPlayback || (latest?.owner && latest.owner !== owner))) return;
        const sourceId = mediaElement?.src ? decodeURIComponent(new URL(mediaElement.src).pathname.split('/').pop()) : null;
        // Do not attach the previous file's clock to a newly selected queue entry.
        if (sourceId === queue.current && mediaElement?.readyState >= 1) {
          queue.position = Number.isFinite(mediaElement.currentTime) ? mediaElement.currentTime : 0;
        }
        queue.volume = webamp.store.getState().media.volume;
        queue.status = requestedMediaStatus;
        if (queue.status === "STOPPED") queue.position = 0;
        writeSnapshot();
      };
      document.addEventListener('rda:listening-preference', event => {
        if (event.detail.enabled) { ownsPlayback = true; savePlaybackState(true); }
      });
      persistPlayback = savePlaybackState;
      writeQueueSnapshot = writeSnapshot;
      // Claim only after restoring the saved clock/volume. A new tab becomes the
      // active player; older tabs cannot later overwrite its newer queue.
      queue.status = restoredState.status;
      requestedMediaStatus = restoredState.status;
      writeSnapshot();
      let lastMediaState = '';
      webamp.store.subscribe(() => {
        const media = webamp.store.getState().media;
        const state = `${media.status}:${media.volume}`;
        if (state !== lastMediaState) {
          lastMediaState = state;
          // Middleware updates the real media after reducers/subscribers finish.
          queueMicrotask(() => savePlaybackState());
        }
      });
      addEventListener('storage', event => {
        if (!rememberListening || event.key !== playbackStateKey || !event.newValue) return;
        let latest;
        try { latest = JSON.parse(event.newValue); } catch { return; }
        queue.setMode(latest.mode);
        queue.visualizations = latest.visualizations !== false;
        settingsChanged();
        if (latest.owner && latest.owner !== owner) {
          ownsPlayback = false;
          webamp.store.dispatch({type: "PAUSE"});
        }
      });
      const nativePlay = webamp.play.bind(webamp);
      webamp.play = () => {
        if (!ownsPlayback) {
          claimQueue();
          // Taking ownership in another document follows the same full-load
          // rule: retain the selected song, but begin it at zero.
          const position = 0;
          queue.position = 0;
          const id = queue.current;
          webamp.setVolume(queue.volume);
          mediaElement?.addEventListener('loadedmetadata', () => {
            if (queue.current === id) webamp.seekToTime(position);
          }, {once: true});
          selectQueueTrack(id);
        } else nativePlay();
      };
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => webamp.play());
        navigator.mediaSession.setActionHandler('pause', () => webamp.store.dispatch({type: 'PAUSE'}));
      }
      mediaElement?.addEventListener("timeupdate", () => {
        if (Date.now() - lastWrite >= 1000) savePlaybackState();
      });
      for (const event of ["play", "pause", "volumechange", "seeked"]) mediaElement?.addEventListener(event, () => savePlaybackState());
      document.addEventListener("click", (event) => {
        const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (link) savePlaybackState();
      }, true);
      addEventListener("pagehide", () => savePlaybackState());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') savePlaybackState();
      });
      // Request protection once after a real playback gesture; the browser may deny it.
      let persistenceRequested = false;
      container.addEventListener('click', event => {
        if (!rememberListening || !event.target.closest('[data-transport]') || persistenceRequested) return;
        persistenceRequested = true;
        try { navigator.storage?.persist?.().catch(() => {}); } catch {}
      });

      // Ask for immediate playback on a first visit or resume a playing session.
      // Browsers may reject audible autoplay, so retain a standards-compliant
      // recovery path for the first user gesture. A visitor-paused session stays
      // paused and is never overridden by the recovery path.
      const playbackIsActive = () => (mediaElement ? !mediaElement.paused : webamp.getMediaStatus() === "PLAYING") && webamp.media?._context?.state === "running";
      const shouldBePlaying = !restoredState || restoredState.status === "PLAYING";
      let allowAutomaticPlayback = shouldBePlaying;
      const attemptPlayback = async () => {
        if (!allowAutomaticPlayback || !ownsPlayback) return;
        try {
          // Invoke both APIs before awaiting, retaining the mobile tap's activation.
          const contextReady = webamp.media?._context?.resume();
          const mediaReady = mediaElement?.paused ? webamp.media.play() : undefined;
          await Promise.all([contextReady, mediaReady]);
        } catch {
          // A later visitor gesture is allowed to retry if autoplay is blocked.
        }
      };
      const removeRecoveryListeners = () => {
        document.removeEventListener("pointerdown", recoverPlayback, true);
        document.removeEventListener("touchend", recoverPlayback, true);
        document.removeEventListener("keydown", recoverPlayback, true);
      };
      const recoverPlayback = async (event) => {
        // Webamp's own transport controls must remain authoritative.
        if (event.target instanceof Node && container.contains(event.target)) return;
        if (event instanceof KeyboardEvent && ["Alt", "Control", "Meta", "Shift", "Tab"].includes(event.key)) return;
        await attemptPlayback();
        if (playbackIsActive()) removeRecoveryListeners();
      };
      // An explicit player gesture supersedes an autoplay request already waiting
      // for browser permission. In particular, tapping Stop must remain stopped.
      const takePlaybackControl = () => {
        playbackAttempt += 1;
        allowAutomaticPlayback = false;
        removeRecoveryListeners();
      };
      disarmPlaybackRecovery = takePlaybackControl;
      container.addEventListener("pointerdown", takePlaybackControl, true);
      container.addEventListener("keydown", takePlaybackControl, true);
      container.addEventListener("click", takePlaybackControl, true);
      armPlaybackRecovery = () => {
        allowAutomaticPlayback = true;
        document.addEventListener("pointerdown", recoverPlayback, true);
        document.addEventListener("touchend", recoverPlayback, true);
        document.addEventListener("keydown", recoverPlayback, true);
      };
      if (shouldBePlaying) armPlaybackRecovery();
      // Mobile browsers may suspend an audio context while the page is hidden.
      // Only resume requested playback; never resurrect an explicitly paused song.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState !== "visible") return;
        if (webamp.getMediaStatus() === "PLAYING" && webamp.media?._context?.state !== "running") armPlaybackRecovery();
        if (allowAutomaticPlayback) attemptPlayback().then(() => {
          if (playbackIsActive()) removeRecoveryListeners();
        });
      });
      await attemptPlayback();
      if (playbackIsActive()) removeRecoveryListeners();
    } catch (error) {
      container.classList.add("has-error");
      container.textContent = "Music player unavailable";
      console.error(error);
    }
  }

  initializeFooterPlayer();

  // Persistent navigation replaces <main>; rebuild controls in the new page and
  // immediately project the still-running component's current state into them.
  function initializeSettingsControls() {
    const privacyHost = document.querySelector('[data-listening-controls-host]');
    if (privacyHost) privacyHost.innerHTML = playbackControls() + privacyControls('page');
    syncPlaybackControls();
    syncPrivacyControls();
  }

  document.addEventListener('rda:page', initializeSettingsControls);
  initializeSettingsControls();

  // Diagnostic component identity. Playback commands intentionally live on the
  // narrower RDA_LISTENING interface created after the player has mounted.
  window.RDA_MUSIC_PLAYER = Object.freeze({
    version: 1,
    root: root.href,
    settings: Object.freeze({ refresh: initializeSettingsControls })
  });
  document.dispatchEvent(new CustomEvent('rda:music-player-component-ready'));
})();
