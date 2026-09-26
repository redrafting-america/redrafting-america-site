import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const required = [
  'assets/scripts/music-player.js',
  'assets/scripts/listening-queue.js',
  'assets/scripts/music-catalog.js',
  'assets/scripts/navigation.js',
  'assets/styles/music-player.css',
  'assets/vendor/webamp/webamp-2.3.1.lazy.min.js',
  'assets/vendor/webamp/LICENSE.txt',
  'assets/vendor/music-metadata/music-metadata-11.15.0.min.js',
  'assets/vendor/music-metadata/LICENSE.txt',
  'assets/audio/abracadabra.mp3',
  'assets/audio/vote.mp3',
  'documentation/RDA-MUSIC-PLAYER-COMPONENT.md'
];

for (const relative of required) {
  assert(fs.existsSync(path.join(root, relative)), `Missing player-package file: ${relative}`);
}

const shell = read('assets/scripts/site-shell.js');
const player = read('assets/scripts/music-player.js');
const styles = read('assets/styles/music-player.css');
const catalog = read('assets/scripts/music-catalog.js');

function collectHtml(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectHtml(absolute);
    return entry.isFile() && entry.name.endsWith('.html') ? [absolute] : [];
  });
}

assert.match(shell, /data-rda-music-player/);
assert.match(shell, /assets\/scripts\/music-player\.js/);
for (const internal of ['new Webamp(', 'RdaListeningQueue', 'rda-listening-v2', 'initializeMobileCompanion']) {
  assert(!shell.includes(internal), `Shared shell owns player internal: ${internal}`);
}
for (const contract of ['window.RDA_MUSIC_PLAYER', 'window.RDA_LISTENING', 'getState:', 'playFile:', 'setMode:', 'setVisualizations:']) {
  assert(player.includes(contract), `Incomplete public player contract: ${contract}`);
}
assert.match(player, /assets\/audio\//);
assert.match(player, /Object\.freeze\(\["previous", "play", "stop", "next"\]\)/);
assert.match(styles, /grid-template-columns:repeat\(4,44px\)/);
assert.match(styles, /gap:3px/);
assert.match(styles, /\[data-music-info\][\s\S]*display:none!important/);
assert.match(catalog, /"abracadabra\.mp3"/);
assert.match(catalog, /"vote\.mp3"/);
assert(!catalog.includes('back-to-the-future'));
const sourceHtml = [path.join(root, 'index.html'), ...collectHtml(path.join(root, 'pages'))];
for (const htmlPath of sourceHtml) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert(!html.includes('id="bg-audio"'), `Legacy audio element remains: ${path.relative(root, htmlPath)}`);
  assert(!html.includes('id="music-toggle"'), `Legacy music button remains: ${path.relative(root, htmlPath)}`);
}

console.log(`PASS: RDA player package boundary and four-control presentation verified across ${required.length} required files.`);
