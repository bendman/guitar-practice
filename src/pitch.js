import { NOTE_FREQS } from "./constants";

export function freqToNoteId(freq) {
  if (freq < 60 || freq > 2000) return null;
  let closest = null;
  let minDist = Infinity;
  for (const [id, freqs] of Object.entries(NOTE_FREQS)) {
    for (const f of freqs) {
      const cents = Math.abs(1200 * Math.log2(freq / f));
      if (cents < minDist) {
        minDist = cents;
        closest = id;
      }
    }
  }
  return minDist < 50 ? closest : null; // within 50 cents
}

// Returns { noteId, cents, signedCents } for the nearest note regardless of threshold
export function freqToNoteInfo(freq) {
  if (freq < 60 || freq > 2000) return null;
  let closest = null;
  let closestFreq = null;
  let minDist = Infinity;
  for (const [id, freqs] of Object.entries(NOTE_FREQS)) {
    for (const f of freqs) {
      const cents = Math.abs(1200 * Math.log2(freq / f));
      if (cents < minDist) {
        minDist = cents;
        closest = id;
        closestFreq = f;
      }
    }
  }
  if (!closest) return null;
  const signedCents = Math.round(1200 * Math.log2(freq / closestFreq));
  return { noteId: closest, cents: Math.round(minDist), signedCents };
}

// Autocorrelation pitch detection — returns { freq, rms, corr }; freq is null if too quiet or no clear pitch
export function detectPitch(buffer, sampleRate) {
  const n = buffer.length;
  let rms = 0;
  for (let i = 0; i < n; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / n);
  if (rms < 0.01) return { freq: null, rms, corr: 0 };

  const minPeriod = Math.floor(sampleRate / 2000);
  const maxPeriod = Math.floor(sampleRate / 60);
  let bestCorr = 0;
  let bestPeriod = 0;
  // Normalize by RMS² so the threshold is relative to signal power (range [-1, 1])
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

  // Parabolic interpolation for sub-sample accuracy (scale-invariant, normalization doesn't matter)
  const prev = bestPeriod > minPeriod ? autocorrAt(buffer, bestPeriod - 1) : 0;
  const curr = autocorrAt(buffer, bestPeriod);
  const next = bestPeriod < maxPeriod ? autocorrAt(buffer, bestPeriod + 1) : 0;
  const shift = (prev - next) / (2 * (prev - 2 * curr + next)) || 0;
  const refinedPeriod = bestPeriod + shift;

  const freq = bestCorr < 0.1 ? null : sampleRate / refinedPeriod;
  return { freq, rms, corr: bestCorr };
}

function autocorrAt(buffer, period) {
  let corr = 0;
  const n = buffer.length;
  for (let i = 0; i < n - period; i++) corr += buffer[i] * buffer[i + period];
  return corr / (n - period);
}
