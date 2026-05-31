type HasId = { id: string };
type HasSpeakLabel = { speak?: string; label: string };

export function pickRandom<T extends HasId>(items: T[], lastId: string | null): T | null {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  let pick: T;
  do {
    pick = items[Math.floor(Math.random() * items.length)];
  } while (pick.id === lastId);
  return pick;
}

export function weightToLevel(weight: number | null | undefined): 0 | 1 | 2 | 3 {
  if (weight == null) return 0;
  if (weight < 0.6) return 3;
  if (weight <= 2.0) return 2;
  return 1;
}

export function buildActivePool<T extends HasId>(
  pool: T[],
  weights: Record<string, number>,
  limit: number,
): T[] {
  const mastered = pool.filter((i) => weightToLevel(weights[i.id]) === 3);
  const unmastered = pool.filter((i) => weightToLevel(weights[i.id]) !== 3);
  return [...mastered, ...unmastered.slice(0, limit)];
}

export function applyResult(
  weights: Record<string, number>,
  itemId: string,
  correct: boolean,
): Record<string, number> {
  const current = weights[itemId] ?? 1;
  return {
    ...weights,
    [itemId]: correct ? Math.max(current * 0.85, 0.1) : Math.min(current * 1.3, 5.0),
  };
}

export function pickWeightedRandom<T extends HasId>(
  items: T[],
  lastId: string | null,
  weights: Record<string, number>,
): T | null {
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

export function sayAloud(item: HasSpeakLabel, naming: NoteNaming = "solfege"): void {
  speechSynthesis.cancel();
  const text = formatSpeak(item.speak || item.label, naming);
  const utt = new SpeechSynthesisUtterance(text);
  // Letter names read correctly with an English voice ("C sharp"); solfège
  // names need a French voice ("Do dièse").
  utt.lang = naming === "letters" ? "en-US" : "fr-FR";
  speechSynthesis.speak(utt);
}

export type NoteNaming = "solfege" | "letters";

const SOLFEGE_TO_LETTER: Record<string, string> = {
  Do: "C", Ré: "D", Re: "D", Mi: "E", Fa: "F", Sol: "G", La: "A", Si: "B",
};
// Longest syllables first so "Sol" is matched before shorter alternatives.
const SOLFEGE_ROOT_RE = /^(Sol|Do|Ré|Re|Mi|Fa|La|Si)/;

/**
 * Translate the leading solfège syllable of a note or chord label into its
 * letter-name equivalent (e.g. "Ré# Majeur" -> "D# Majeur"). Accidentals and
 * any trailing words (chord qualities) are preserved. Returns the label
 * unchanged when solfège naming is selected.
 */
export function formatNoteLabel(label: string, naming: NoteNaming): string {
  if (naming === "solfege") return label;
  return label.replace(SOLFEGE_ROOT_RE, (m) => SOLFEGE_TO_LETTER[m] ?? m);
}

/**
 * Translate a `speak` string into letter-name form for text-to-speech: drops
 * the guillemets, swaps the leading solfège syllable for its letter, and
 * renders French accidental words in English so an English voice pronounces
 * e.g. "C sharp" correctly. Returns the string unchanged for solfège.
 */
export function formatSpeak(speak: string, naming: NoteNaming): string {
  if (naming === "solfege") return speak;
  return speak
    .replace(/[«»]/g, "")
    .trimStart()
    .replace(SOLFEGE_ROOT_RE, (m) => SOLFEGE_TO_LETTER[m] ?? m)
    .replace(/dièse/g, "sharp")
    .replace(/bémol/g, "flat");
}

export function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDuration(secs: number): string {
  const total = Math.floor(secs);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = s.toString().padStart(2, "0");
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${ss}s`;
  if (m > 0) return `${m}m ${ss}s`;
  return `${s}s`;
}
