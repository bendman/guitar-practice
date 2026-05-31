// Generates tone.wav — a mono 16-bit PCM sine wave used as the fake microphone
// input for the @audio scenario. Default 440 Hz = A4 = "La" (enabled by default).
// Run: node tests/fixtures/gen-tones.mjs [freq] [seconds]
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const freq = Number(process.argv[2] ?? 440);
const seconds = Number(process.argv[3] ?? 5);
const sampleRate = 44100;
const numSamples = Math.floor(sampleRate * seconds);
const amplitude = 0.6 * 0x7fff;

const dataBytes = numSamples * 2;
const buf = Buffer.alloc(44 + dataBytes);

// RIFF header
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + dataBytes, 4);
buf.write("WAVE", 8);
// fmt chunk
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); // PCM chunk size
buf.writeUInt16LE(1, 20); // audio format = PCM
buf.writeUInt16LE(1, 22); // channels = mono
buf.writeUInt32LE(sampleRate, 24);
buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
buf.writeUInt16LE(2, 32); // block align
buf.writeUInt16LE(16, 34); // bits per sample
// data chunk
buf.write("data", 36);
buf.writeUInt32LE(dataBytes, 40);

for (let i = 0; i < numSamples; i++) {
  const sample = Math.round(amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate));
  buf.writeInt16LE(sample, 44 + i * 2);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(__dirname, "tone.wav");
writeFileSync(out, buf);
console.log(`wrote ${out} (${freq} Hz, ${seconds}s)`);
