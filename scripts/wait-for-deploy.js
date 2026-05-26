#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const URL = 'https://bendman.github.io/guitar-practice/';
const TIMEOUT_MS = 10 * 60 * 1000;
const INTERVAL_MS = 5000;

const html = readFileSync('dist/index.html', 'utf8');
const match = html.match(/assets\/index-[^"']+\.js/);
if (!match) {
  console.error('Could not find hashed JS asset in dist/index.html');
  process.exit(1);
}
const expected = match[0];
console.log(`Waiting for ${expected} at ${URL}`);

const start = Date.now();
let attempt = 0;
while (Date.now() - start < TIMEOUT_MS) {
  attempt++;
  try {
    const res = await fetch(`${URL}?cb=${Date.now()}`, { cache: 'no-store' });
    const body = await res.text();
    if (body.includes(expected)) {
      const secs = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`✓ Deployed (${secs}s, ${attempt} checks)`);
      process.exit(0);
    }
  } catch (err) {
    console.log(`  attempt ${attempt}: ${err.message}`);
  }
  process.stdout.write('.');
  await new Promise((r) => setTimeout(r, INTERVAL_MS));
}

console.error(`\nTimed out after ${TIMEOUT_MS / 1000}s`);
process.exit(1);
