const assert = require('node:assert/strict');
const Queue = require('../assets/scripts/listening-queue.js');

const ids = Array.from({length: 13}, (_, index) => `song-${index}`);
let seed = 1;
const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;

for (let trial = 0; trial < 50; trial += 1) {
  const queue = new Queue(ids, null, random);
  let last = null;
  for (let cycle = 0; cycle < 10; cycle += 1) {
    const heard = cycle === 0 ? [queue.current] : [queue.next()];
    assert.notEqual(heard[0], last);
    for (let index = 1; index < ids.length; index += 1) heard.push(queue.next());
    assert.equal(new Set(heard).size, ids.length);
    last = heard.at(-1);
  }
}

const pair = new Queue(['abracadabra.mp3', 'vote.mp3'], null, random);
const first = pair.current;
const second = pair.next();
assert.notEqual(first, second);
assert.equal(pair.next(), first);
pair.setMode('sequential');
assert.equal(pair.next(), second);
pair.previous();
pair.position = 42;
pair.volume = 35;
pair.status = 'PAUSED';
const restored = new Queue(pair.library, pair.snapshot(), random);
assert.equal(restored.current, pair.current);
assert.equal(restored.position, 42);
assert.equal(restored.volume, 35);
assert.equal(restored.status, 'PAUSED');

const expanded = new Queue([...pair.library, 'new.mp3'], pair.snapshot(), random);
assert(expanded.remaining.includes('new.mp3'));
const removed = new Queue(pair.library.filter(id => id !== pair.current), pair.snapshot(), random);
assert.notEqual(removed.current, pair.current);
assert.throws(() => new Queue([]));

console.log('PASS: queue cycles, two-track order, history, restore, and library reconciliation.');
