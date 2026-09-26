/* Pure sequence model. Storage and audio belong to the site adapter. */
(function (scope) {
  'use strict';
  class ListeningQueue {
    constructor(library, saved = null, random = Math.random) {
      this.library = [...new Set(library)];
      if (!this.library.length) throw new Error('A listening queue requires songs.');
      this.random = random;
      const valid = id => this.library.includes(id);
      const unique = ids => [...new Set(ids.filter(valid))];
      const usable = saved?.version === 2 && Array.isArray(saved.library) && Array.isArray(saved.history)
        && Array.isArray(saved.remaining) && Array.isArray(saved.played)
        && Number.isInteger(saved.cursor) && saved.cursor >= 0 && saved.cursor < saved.history.length;
      this.mode = usable && saved.mode === 'sequential' ? 'sequential' : 'shuffle';
      this.visualizations = !usable || saved.visualizations !== false;
      this.position = usable && Number.isFinite(saved.position) ? Math.max(0, saved.position) : 0;
      this.volume = usable && Number.isFinite(saved.volume) ? Math.max(0, Math.min(100, saved.volume)) : 100;
      this.status = usable && ['PAUSED','STOPPED'].includes(saved.status) ? saved.status : 'PLAYING';
      if(this.status === 'STOPPED') this.position = 0;
      if (usable) {
        const before = saved.history.slice(0, saved.cursor + 1).filter(valid).slice(-200);
        const after = saved.history.slice(saved.cursor + 1).filter(valid).slice(0, 200 - before.length);
        this.history = [...before, ...after];
        this.cursor = before.length - 1;
        this.played = unique(saved.played);
        this.remaining = unique(saved.remaining).filter(id => !this.played.includes(id));
        // New songs and omitted-but-unplayed entries join the current cycle.
        const missing = this.library.filter(id => !this.played.includes(id) && !this.remaining.includes(id));
        this.remaining.push(...this.shuffle(missing));
        if (!valid(saved.history[saved.cursor])) {
          this.position = 0;
          // A removed current song advances to the saved forward entry or queue.
          this.next();
        }
      } else {
        this.history = [];
        this.cursor = -1;
        this.played = [];
        this.remaining = this.shuffle(this.library);
        this.next();
      }
    }
    shuffle(items) {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }
    get current() { return this.history[this.cursor]; }
    setMode(mode) {
      if (!["shuffle", "sequential"].includes(mode) || mode === this.mode) return;
      this.mode = mode;
      this.history = this.history.slice(0, this.cursor + 1);
    }
    next() {
      if (this.mode === "sequential" && this.current) {
        const id = this.library[(this.library.indexOf(this.current) + 1) % this.library.length];
        this.position = 0;
        this.select(id);
        return id;
      }
      this.position = 0;
      if (this.cursor < this.history.length - 1) return this.history[++this.cursor];
      if (!this.remaining.length) {
        this.remaining = this.shuffle(this.library);
        if (this.remaining.length > 1 && this.remaining[0] === this.current) {
          const j = 1 + Math.floor(this.random() * (this.remaining.length - 1));
          [this.remaining[0], this.remaining[j]] = [this.remaining[j], this.remaining[0]];
        }
        this.played = [];
      }
      const id = this.remaining.shift();
      this.played.push(id);
      this.history.push(id);
      if (this.history.length > 200) this.history.shift();
      this.cursor = this.history.length - 1;
      return id;
    }
    previous() {
      if (this.cursor <= 0) return null;
      this.position = 0;
      return this.history[--this.cursor];
    }
    select(id) {
      if (!this.library.includes(id) || id === this.current) return;
      this.history = this.history.slice(0, this.cursor + 1);
      this.history.push(id);
      if (this.history.length > 200) this.history.shift();
      this.cursor = this.history.length - 1;
      this.position = 0;
      this.remaining = this.remaining.filter(item => item !== id);
      if (!this.played.includes(id)) this.played.push(id);
    }
    snapshot() {
      return {version: 2, mode: this.mode, visualizations: this.visualizations, library: [...this.library], history: [...this.history], cursor: this.cursor,
        played: [...this.played], remaining: [...this.remaining], position: this.position, volume: this.volume, status: this.status};
    }
    static migrate(legacy, library) {
      if (legacy?.version !== 1 || !Number.isInteger(legacy.trackIndex) || !library[legacy.trackIndex]) return null;
      const indices = Array.isArray(legacy.history) ? legacy.history : [];
      let history = indices.map(i => Number.isInteger(i) ? library[i] : null).filter(Boolean);
      let cursor = legacy.historyPosition;
      if (!Number.isInteger(cursor) || history[cursor] !== library[legacy.trackIndex]) {
        history = [library[legacy.trackIndex]]; cursor = 0;
      }
      const played = [...new Set(history)];
      return {...legacy, version: 2, library, history, cursor, played, remaining: []};
    }
  }
  scope.RdaListeningQueue = ListeningQueue;
  if (typeof module !== 'undefined' && module.exports) module.exports = ListeningQueue;
})(globalThis);
