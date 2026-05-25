export function pickRandom(items, lastId) {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  let pick;
  do {
    pick = items[Math.floor(Math.random() * items.length)];
  } while (pick.id === lastId);
  return pick;
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
