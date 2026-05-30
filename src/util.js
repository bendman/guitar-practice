export function pickRandom(items, lastId) {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  let pick;
  do {
    pick = items[Math.floor(Math.random() * items.length)];
  } while (pick.id === lastId);
  return pick;
}

export function pickWeightedRandom(items, lastId, weights) {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  const candidates = items.filter((i) => i.id !== lastId);
  const pool = candidates.length > 0 ? candidates : items;
  const total = pool.reduce((sum, item) => sum + (weights[item.id] ?? 1), 0);
  let rand = Math.random() * total;
  for (const item of pool) {
    rand -= weights[item.id] ?? 1;
    if (rand <= 0) return item;
  }
  return pool[pool.length - 1];
}

export function sayAloud(item) {
  speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(item.speak || item.label);
  utt.lang = "fr-FR";
  speechSynthesis.speak(utt);
}

export function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Long-form duration for accumulated time: "2h 07m 42s", "12m 30s", "45s".
export function formatDuration(secs) {
  const total = Math.floor(secs);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = s.toString().padStart(2, "0");
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${ss}s`;
  if (m > 0) return `${m}m ${ss}s`;
  return `${s}s`;
}
