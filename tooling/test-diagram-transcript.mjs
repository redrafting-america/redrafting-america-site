// Publication guard for the single supported diagram-transcript path. This
// prevents mojibake, undersized text, or the retired HTML-equivalent option from
// returning during later graphic updates.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const transcriptHtmlPath = 'assets/documents/RDA-GRA-019_official-constitutional-lexicon-letter-portrait-transcript-v10.html';
const transcriptTextPath = 'assets/documents/RDA-GRA-019_official-constitutional-lexicon-letter-portrait-transcript-v10.txt';
const home = read('index.html');
const transcriptHtml = read(transcriptHtmlPath);
const transcriptText = read(transcriptTextPath);

assert(!home.includes('Open accessible HTML version'), 'Retired HTML-equivalent option returned');
assert(!home.includes('accessible-companion-v10.html'), 'Retired HTML-equivalent link returned');
assert.match(home, new RegExp(transcriptHtmlPath.replaceAll('.', '\\.')));
assert.match(home, /target="_blank" rel="noopener" data-full-navigation aria-label="Open text transcript in a new window">Open text transcript<\/a>/);
assert.match(transcriptHtml, /<meta charset="utf-8"/i);
assert.match(transcriptHtml, /font-size:\s*1rem/);
assert.match(transcriptHtml, /font:\s*1rem\/1\.65/);
assert.match(transcriptHtml, /white-space:\s*pre-wrap/);
assert.match(transcriptHtml, /overflow-wrap:\s*anywhere/);
assert.match(transcriptHtml, /We don't need better leaders\. We need a better system\./);

const mojibake = /(?:â.|Ã.|Â.|ï¿½|�)/u;
for (const [relative, content] of [[transcriptHtmlPath, transcriptHtml], [transcriptTextPath, transcriptText]]) {
  assert(!mojibake.test(content), `Unreadable character sequence in ${relative}`);
}
assert(/^[\x00-\x7F]*$/.test(transcriptText), 'Plain-text fallback must remain encoding-independent ASCII');

console.log('PASS: one readable diagram transcript, 12-point-equivalent source sizing, and no HTML-equivalent option.');
