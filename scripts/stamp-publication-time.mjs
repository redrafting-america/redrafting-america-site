import { readFile, writeFile } from 'node:fs/promises';

const [scriptPath, timestamp] = process.argv.slice(2);
const placeholder = '__RDA_PUBLICATION_TIMESTAMP__';

if (!scriptPath || !timestamp) {
  throw new Error('Usage: node stamp-publication-time.mjs SCRIPT_PATH ISO_TIMESTAMP');
}

if (Number.isNaN(Date.parse(timestamp))) {
  throw new Error(`Invalid publication timestamp: ${timestamp}`);
}

const source = await readFile(scriptPath, 'utf8');
const matches = source.split(placeholder).length - 1;

if (matches !== 1) {
  throw new Error(`Expected one publication timestamp placeholder; found ${matches}.`);
}

await writeFile(scriptPath, source.replace(placeholder, timestamp), 'utf8');
console.log(`Stamped public footer time: ${timestamp}`);
