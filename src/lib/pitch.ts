import { Note } from "tonal";

export interface NoteInfo {
  noteId: string;
  cents: number;
  signedCents: number;
}

export interface PitchResult {
  freq: number | null;
  rms: number;
  corr: number;
}

/** Maps tonal pitch-class names (both sharp and flat spellings) to app note IDs. */
const PC_TO_ID: Record<string, string> = {
  C: "do",    "C#": "do_sharp", Db: "do_sharp",
  D: "re",    "D#": "re_sharp", Eb: "re_sharp",
  E: "mi",
  F: "fa",    "F#": "fa_sharp", Gb: "fa_sharp",
  G: "sol",   "G#": "sol_sharp", Ab: "sol_sharp",
  A: "la",    "A#": "la_sharp", Bb: "la_sharp",
  B: "si",
};

export function freqToNoteId(freq: number): string | null {
  if (freq < 60 || freq > 2000) return null;
  const noteName = Note.fromFreq(freq);
  const pc = Note.pitchClass(noteName);
  const id = PC_TO_ID[pc] ?? null;
  if (!id) return null;
  // Reject if more than 50 cents from the nearest semitone
  const refFreq = Note.freq(noteName);
  if (refFreq === null) return null;
  const cents = Math.abs(1200 * Math.log2(freq / refFreq));
  return cents < 50 ? id : null;
}

export function freqToNoteInfo(freq: number): NoteInfo | null {
  if (freq < 60 || freq > 2000) return null;
  const noteName = Note.fromFreq(freq);
  const pc = Note.pitchClass(noteName);
  const noteId = PC_TO_ID[pc] ?? null;
  if (!noteId) return null;
  const refFreq = Note.freq(noteName);
  if (refFreq === null) return null;
  const signedCents = Math.round(1200 * Math.log2(freq / refFreq));
  return { noteId, cents: Math.abs(signedCents), signedCents };
}

export function detectPitch(buffer: Float32Array, sampleRate: number): PitchResult {
  const n = buffer.length;
  let rms = 0;
  for (let i = 0; i < n; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / n);
  if (rms < 0.001) return { freq: null, rms, corr: 0 };

  const minPeriod = Math.floor(sampleRate / 2000);
  const maxPeriod = Math.floor(sampleRate / 60);
  let bestCorr = 0;
  let bestPeriod = 0;
  const normFactor = rms * rms;

  for (let period = minPeriod; period <= maxPeriod; period++) {
    let corr = 0;
    for (let i = 0; i < n - period; i++) {
      corr += buffer[i] * buffer[i + period];
    }
    corr /= (n - period) * normFactor;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestPeriod = period;
    }
  }

  const prev = bestPeriod > minPeriod ? autocorrAt(buffer, bestPeriod - 1) : 0;
  const curr = autocorrAt(buffer, bestPeriod);
  const next = bestPeriod < maxPeriod ? autocorrAt(buffer, bestPeriod + 1) : 0;
  const shift = (prev - next) / (2 * (prev - 2 * curr + next)) || 0;
  const refinedPeriod = bestPeriod + shift;

  const freq = bestCorr < 0.1 ? null : sampleRate / refinedPeriod;
  return { freq, rms, corr: bestCorr };
}

function autocorrAt(buffer: Float32Array, period: number): number {
  let corr = 0;
  const n = buffer.length;
  for (let i = 0; i < n - period; i++) corr += buffer[i] * buffer[i + period];
  return corr / (n - period);
}
