export interface NoteItem {
  id: string;
  label: string;
  type: "note";
  speak?: string;
  defaultEnabled?: boolean;
  enharmonicId?: string;
}

export interface Barre {
  fret: number;
  fromString: number;
  toString: number;
}

export interface Voicing {
  frets: number[];
  baseFret?: number;
  barres?: Barre[];
}

export interface ChordItem {
  id: string;
  label: string;
  labelShort: string;
  speak: string;
  type: "chord";
  rootId: string;
  qualityId: string;
  defaultEnabled: boolean;
  voicings: Voicing[];
}

export type PracticeItem = NoteItem | ChordItem;

/**
 * Language codes (BCP-47 primary subtags) the app supports for spoken output.
 * Voice options are filtered to voices whose `lang` starts with one of these
 * (e.g. "fr" matches "fr-FR", "fr-CA").
 */
export const SUPPORTED_LANGUAGES = ["fr"] as const;

export function isSupportedVoiceLang(lang: string): boolean {
  const primary = lang.toLowerCase().split("-")[0];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(primary);
}

/**
 * Human-friendly name for a BCP-47 locale, in French
 * (e.g. "fr-FR" -> "Français (France)"). Falls back to the raw code.
 */
export function formatLocaleName(lang: string): string {
  try {
    const display = new Intl.DisplayNames(["fr"], { type: "language" }).of(lang);
    if (display) return display.charAt(0).toUpperCase() + display.slice(1);
  } catch { /* Intl.DisplayNames unsupported */ }
  return lang;
}

export const NOTES: NoteItem[] = [
  { id: "do",  label: "Do",  type: "note" },
  { id: "re",  label: "Ré",  type: "note" },
  { id: "mi",  label: "Mi",  type: "note" },
  { id: "fa",  label: "Fa",  type: "note" },
  { id: "sol", label: "Sol", type: "note" },
  { id: "la",  label: "La",  type: "note" },
  { id: "si",  label: "Si",  type: "note" },
];

export const CHROMATIC_SHARPS: NoteItem[] = [
  { id: "do_sharp",  label: "Do#",  speak: "Do dièse",  type: "note", defaultEnabled: false },
  { id: "re_sharp",  label: "Ré#",  speak: "Ré dièse",  type: "note", defaultEnabled: false },
  { id: "fa_sharp",  label: "Fa#",  speak: "Fa dièse",  type: "note", defaultEnabled: false },
  { id: "sol_sharp", label: "Sol#", speak: "Sol dièse", type: "note", defaultEnabled: false },
  { id: "la_sharp",  label: "La#",  speak: "La dièse",  type: "note", defaultEnabled: false },
];

export const CHROMATIC_FLATS: NoteItem[] = [
  { id: "re_flat",  label: "Ré♭",  speak: "Ré bémol",  type: "note", defaultEnabled: false, enharmonicId: "do_sharp"  },
  { id: "mi_flat",  label: "Mi♭",  speak: "Mi bémol",  type: "note", defaultEnabled: false, enharmonicId: "re_sharp"  },
  { id: "sol_flat", label: "Sol♭", speak: "Sol bémol", type: "note", defaultEnabled: false, enharmonicId: "fa_sharp"  },
  { id: "la_flat",  label: "La♭",  speak: "La bémol",  type: "note", defaultEnabled: false, enharmonicId: "sol_sharp" },
  { id: "si_flat",  label: "Si♭",  speak: "Si bémol",  type: "note", defaultEnabled: false, enharmonicId: "la_sharp"  },
];

export const CHROMATIC_NOTES: NoteItem[] = [...CHROMATIC_SHARPS, ...CHROMATIC_FLATS];

export interface NotesDisplayEntry {
  natural: NoteItem;
  chromatic?: [NoteItem, NoteItem];
}

export const NOTES_DISPLAY_ORDER: NotesDisplayEntry[] = [
  { natural: NOTES[0], chromatic: [CHROMATIC_SHARPS[0], CHROMATIC_FLATS[0]] },
  { natural: NOTES[1], chromatic: [CHROMATIC_SHARPS[1], CHROMATIC_FLATS[1]] },
  { natural: NOTES[2] },
  { natural: NOTES[3], chromatic: [CHROMATIC_SHARPS[2], CHROMATIC_FLATS[2]] },
  { natural: NOTES[4], chromatic: [CHROMATIC_SHARPS[3], CHROMATIC_FLATS[3]] },
  { natural: NOTES[5], chromatic: [CHROMATIC_SHARPS[4], CHROMATIC_FLATS[4]] },
  { natural: NOTES[6] },
];

export interface ChordRoot {
  id: string;
  label: string;
  speak: string;
  defaultEnabled?: boolean;
}

export const CHORD_ROOTS: ChordRoot[] = [
  { id: "do",    label: "Do",   speak: "«Do»" },
  { id: "do_s",  label: "Do#",  speak: "«Do dièse»" },
  { id: "re",    label: "Ré",   speak: "«Ré»" },
  { id: "re_s",  label: "Ré#",  speak: "«Ré dièse»" },
  { id: "mi",    label: "Mi",   speak: "«Mi»",        defaultEnabled: true },
  { id: "fa",    label: "Fa",   speak: "«Fa»" },
  { id: "fa_s",  label: "Fa#",  speak: "«Fa dièse»" },
  { id: "sol",   label: "Sol",  speak: "«Sol»" },
  { id: "sol_s", label: "Sol#", speak: "«Sol dièse»" },
  { id: "la",    label: "La",   speak: "«La»",        defaultEnabled: true },
  { id: "la_s",  label: "La#",  speak: "«La dièse»" },
  { id: "si",    label: "Si",   speak: "«Si»" },
];

export interface ChordQuality {
  id: string;
  label: string;
  labelLong: string;
  speak: string;
}

export const CHORD_QUALITIES: ChordQuality[] = [
  { id: "maj",  label: "Maj",   labelLong: "Majeur",       speak: "Majeur" },
  { id: "min",  label: "Min",   labelLong: "Mineur",       speak: "Mineur" },
  { id: "dim",  label: "Dim",   labelLong: "Diminué",      speak: "Diminué" },
  { id: "maj7", label: "Maj 7", labelLong: "Maj 7",        speak: "Majeur 7" },
  { id: "min7", label: "Min 7", labelLong: "Min 7",        speak: "Mineur 7" },
  { id: "m7b5", label: "♭7",    labelLong: "Demi-diminué", speak: "Demi-diminué" },
  { id: "dom7", label: "7",     labelLong: "7",            speak: "7" },
];

const CHORD_VOICINGS: Record<string, Record<string, Voicing[]>> = {
  mi: {
    maj:  [{ frets: [0, 2, 2, 1, 0, 0] }],
    min:  [{ frets: [0, 2, 2, 0, 0, 0] }],
    dim:  [{ frets: [0, 1, 2, 0, -1, -1] }],
    maj7: [{ frets: [0, 2, 1, 1, 0, 0] }],
    min7: [{ frets: [0, 2, 0, 0, 0, 0] }, { frets: [0, 2, 0, 0, 3, 0] }],
    m7b5: [{ frets: [0, 1, 0, 0, -1, -1] }],
    dom7: [{ frets: [0, 2, 0, 1, 0, 0] }, { frets: [0, 2, 0, 1, 3, 0] }],
  },
  la: {
    maj:  [{ frets: [-1, 0, 2, 2, 2, 0] }, { frets: [5, 7, 7, 6, 5, 5], baseFret: 5, barres: [{ fret: 5, fromString: 0, toString: 5 }] }],
    min:  [{ frets: [-1, 0, 2, 2, 1, 0] }, { frets: [5, 7, 7, 5, 5, 5], baseFret: 5, barres: [{ fret: 5, fromString: 0, toString: 5 }] }],
    dim:  [{ frets: [-1, 0, 1, 2, 1, -1] }],
    maj7: [{ frets: [-1, 0, 2, 1, 2, 0] }],
    min7: [{ frets: [-1, 0, 2, 0, 1, 0] }, { frets: [-1, 0, 2, 0, 1, 3] }],
    m7b5: [{ frets: [-1, 0, 1, 0, 1, -1] }],
    dom7: [{ frets: [-1, 0, 2, 0, 2, 0] }, { frets: [-1, 0, 2, 0, 2, 3] }],
  },
  do: {
    maj:  [{ frets: [-1, 3, 2, 0, 1, 0] }, { frets: [-1, 3, 5, 5, 5, 3], baseFret: 3, barres: [{ fret: 3, fromString: 1, toString: 5 }] }],
    min:  [{ frets: [-1, 3, 5, 5, 4, 3], baseFret: 3, barres: [{ fret: 3, fromString: 1, toString: 5 }] }],
    dim:  [{ frets: [-1, 3, 4, 2, 4, -1], baseFret: 2 }],
    maj7: [{ frets: [-1, 3, 2, 0, 0, 0] }],
    min7: [{ frets: [-1, 3, 1, 3, 1, -1] }],
    m7b5: [{ frets: [-1, 3, 4, 2, 3, -1], baseFret: 2 }],
    dom7: [{ frets: [-1, 3, 2, 3, 1, 0] }],
  },
  re: {
    maj:  [{ frets: [-1, -1, 0, 2, 3, 2] }, { frets: [-1, 5, 7, 7, 7, 5], baseFret: 5, barres: [{ fret: 5, fromString: 1, toString: 5 }] }],
    min:  [{ frets: [-1, -1, 0, 2, 3, 1] }, { frets: [-1, 5, 7, 7, 6, 5], baseFret: 5, barres: [{ fret: 5, fromString: 1, toString: 5 }] }],
    dim:  [{ frets: [-1, -1, 0, 1, 3, 1] }],
    maj7: [{ frets: [-1, -1, 0, 2, 2, 2] }],
    min7: [{ frets: [-1, -1, 0, 2, 1, 1] }],
    m7b5: [{ frets: [-1, -1, 0, 1, 2, 1] }],
    dom7: [{ frets: [-1, -1, 0, 2, 1, 2] }],
  },
  fa: {
    maj:  [{ frets: [1, 3, 3, 2, 1, 1], baseFret: 1, barres: [{ fret: 1, fromString: 0, toString: 5 }] }],
    min:  [{ frets: [1, 3, 3, 1, 1, 1], baseFret: 1, barres: [{ fret: 1, fromString: 0, toString: 5 }] }],
    dim:  [{ frets: [-1, -1, 3, 4, 3, 1] }],
    maj7: [{ frets: [-1, -1, 3, 2, 1, 0] }],
    min7: [{ frets: [1, 3, 1, 1, 1, 1], baseFret: 1, barres: [{ fret: 1, fromString: 0, toString: 5 }] }],
    m7b5: [{ frets: [-1, -1, 3, 4, 2, 4], baseFret: 2 }],
    dom7: [{ frets: [1, 3, 1, 2, 1, 1], baseFret: 1, barres: [{ fret: 1, fromString: 0, toString: 5 }] }],
  },
  sol: {
    maj:  [{ frets: [3, 2, 0, 0, 0, 3] }, { frets: [3, 5, 5, 4, 3, 3], baseFret: 3, barres: [{ fret: 3, fromString: 0, toString: 5 }] }],
    min:  [{ frets: [3, 5, 5, 3, 3, 3], baseFret: 3, barres: [{ fret: 3, fromString: 0, toString: 5 }] }],
    dim:  [{ frets: [3, 4, 5, 3, -1, -1], baseFret: 3 }],
    maj7: [{ frets: [3, 2, 0, 0, 0, 2] }],
    min7: [{ frets: [-1, -1, 5, 3, 3, 3], baseFret: 3 }],
    m7b5: [{ frets: [3, 4, 3, 3, -1, -1], baseFret: 3 }],
    dom7: [{ frets: [3, 2, 0, 0, 0, 1] }],
  },
  si: {
    maj:  [{ frets: [-1, 2, 4, 4, 4, 2], baseFret: 2, barres: [{ fret: 2, fromString: 1, toString: 5 }] }],
    min:  [{ frets: [-1, 2, 4, 4, 3, 2], baseFret: 2, barres: [{ fret: 2, fromString: 1, toString: 5 }] }],
    dim:  [{ frets: [-1, 2, 3, 4, 3, -1], baseFret: 2 }],
    maj7: [{ frets: [-1, 2, 4, 3, 4, -1], baseFret: 2 }],
    min7: [{ frets: [-1, 2, 4, 2, 3, 2], baseFret: 2, barres: [{ fret: 2, fromString: 1, toString: 5 }] }],
    m7b5: [{ frets: [-1, 2, 3, 2, 3, -1], baseFret: 2 }],
    dom7: [{ frets: [-1, 2, 4, 2, 3, -1], baseFret: 2 }],
  },
  fa_s: {
    maj:  [{ frets: [2, 4, 4, 3, 2, 2], baseFret: 2, barres: [{ fret: 2, fromString: 0, toString: 5 }] }],
    min:  [{ frets: [2, 4, 4, 2, 2, 2], baseFret: 2, barres: [{ fret: 2, fromString: 0, toString: 5 }] }],
    dim:  [{ frets: [2, 3, 4, 2, -1, -1], baseFret: 2 }],
    maj7: [{ frets: [2, 4, 3, 3, 2, 2], baseFret: 2, barres: [{ fret: 2, fromString: 0, toString: 5 }] }],
    min7: [{ frets: [2, 4, 2, 2, 2, 2], baseFret: 2, barres: [{ fret: 2, fromString: 0, toString: 5 }] }],
    m7b5: [{ frets: [2, 3, 2, 2, -1, -1], baseFret: 2 }],
    dom7: [{ frets: [2, 4, 2, 3, 2, 2], baseFret: 2, barres: [{ fret: 2, fromString: 0, toString: 5 }] }],
  },
  sol_s: {
    maj:  [{ frets: [4, 6, 6, 5, 4, 4], baseFret: 4, barres: [{ fret: 4, fromString: 0, toString: 5 }] }],
    min:  [{ frets: [4, 6, 6, 4, 4, 4], baseFret: 4, barres: [{ fret: 4, fromString: 0, toString: 5 }] }],
    dim:  [{ frets: [4, 5, 6, 4, -1, -1], baseFret: 4 }],
    maj7: [{ frets: [4, 6, 5, 5, 4, 4], baseFret: 4, barres: [{ fret: 4, fromString: 0, toString: 5 }] }],
    min7: [{ frets: [4, 6, 4, 4, 4, 4], baseFret: 4, barres: [{ fret: 4, fromString: 0, toString: 5 }] }],
    m7b5: [{ frets: [4, 5, 4, 4, -1, -1], baseFret: 4 }],
    dom7: [{ frets: [4, 6, 4, 5, 4, 4], baseFret: 4, barres: [{ fret: 4, fromString: 0, toString: 5 }] }],
  },
  la_s: {
    maj:  [{ frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, barres: [{ fret: 1, fromString: 1, toString: 5 }] }],
    min:  [{ frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, barres: [{ fret: 1, fromString: 1, toString: 5 }] }],
    dim:  [{ frets: [-1, 1, 2, 3, 2, -1], baseFret: 1 }],
    maj7: [{ frets: [-1, 1, 3, 2, 3, 1], baseFret: 1, barres: [{ fret: 1, fromString: 1, toString: 5 }] }],
    min7: [{ frets: [-1, 1, 3, 1, 2, 1], baseFret: 1, barres: [{ fret: 1, fromString: 1, toString: 5 }] }],
    m7b5: [{ frets: [-1, 1, 2, 1, 2, -1], baseFret: 1 }],
    dom7: [{ frets: [-1, 1, 3, 1, 3, 1], baseFret: 1, barres: [{ fret: 1, fromString: 1, toString: 5 }] }],
  },
  do_s: {
    maj:  [{ frets: [-1, 4, 6, 6, 6, 4], baseFret: 4, barres: [{ fret: 4, fromString: 1, toString: 5 }] }],
    min:  [{ frets: [-1, 4, 6, 6, 5, 4], baseFret: 4, barres: [{ fret: 4, fromString: 1, toString: 5 }] }],
    dim:  [{ frets: [-1, 4, 5, 6, 5, -1], baseFret: 4 }],
    maj7: [{ frets: [-1, 4, 6, 5, 6, 4], baseFret: 4, barres: [{ fret: 4, fromString: 1, toString: 5 }] }],
    min7: [{ frets: [-1, 4, 6, 4, 5, 4], baseFret: 4, barres: [{ fret: 4, fromString: 1, toString: 5 }] }],
    m7b5: [{ frets: [-1, 4, 5, 4, 5, -1], baseFret: 4 }],
    dom7: [{ frets: [-1, 4, 6, 4, 6, 4], baseFret: 4, barres: [{ fret: 4, fromString: 1, toString: 5 }] }],
  },
  re_s: {
    maj:  [{ frets: [-1, 6, 8, 8, 8, 6], baseFret: 6, barres: [{ fret: 6, fromString: 1, toString: 5 }] }],
    min:  [{ frets: [-1, 6, 8, 8, 7, 6], baseFret: 6, barres: [{ fret: 6, fromString: 1, toString: 5 }] }],
    dim:  [{ frets: [-1, 6, 7, 8, 7, -1], baseFret: 6 }],
    maj7: [{ frets: [-1, 6, 8, 7, 8, 6], baseFret: 6, barres: [{ fret: 6, fromString: 1, toString: 5 }] }],
    min7: [{ frets: [-1, 6, 8, 6, 7, 6], baseFret: 6, barres: [{ fret: 6, fromString: 1, toString: 5 }] }],
    m7b5: [{ frets: [-1, 6, 7, 6, 7, -1], baseFret: 6 }],
    dom7: [{ frets: [-1, 6, 8, 6, 8, 6], baseFret: 6, barres: [{ fret: 6, fromString: 1, toString: 5 }] }],
  },
};

export const CHORDS: ChordItem[] = CHORD_ROOTS.flatMap((root) =>
  CHORD_QUALITIES.map((q) => {
    const id = `${root.id}_${q.id}`;
    return {
      id,
      label: `${root.label} ${q.labelLong}`,
      labelShort: `${root.label} ${q.label}`,
      speak: `${root.speak} ${q.speak}`,
      type: "chord" as const,
      rootId: root.id,
      qualityId: q.id,
      defaultEnabled: root.defaultEnabled === true,
      voicings: CHORD_VOICINGS[root.id]?.[q.id] ?? [],
    };
  })
);

export const ALL: PracticeItem[] = [...NOTES, ...CHROMATIC_NOTES, ...CHORDS];

export const chordId = (rootId: string, qualityId: string) => `${rootId}_${qualityId}`;

/**
 * Return a copy of `chords` with any user-authored voicings appended to the
 * matching chord's built-in voicings. Chords without custom voicings are
 * returned unchanged (same reference).
 */
export function mergeCustomVoicings(
  chords: ChordItem[],
  custom: Record<string, Voicing[]>,
): ChordItem[] {
  return chords.map((c) => {
    const extra = custom[c.id];
    return extra && extra.length ? { ...c, voicings: [...c.voicings, ...extra] } : c;
  });
}

/**
 * Two voicings are the same shape when their absolute fret arrays match.
 * `baseFret` is only a display window, so it is ignored here.
 */
export function voicingsEqual(a: Voicing, b: Voicing): boolean {
  if (a.frets.length !== b.frets.length) return false;
  return a.frets.every((f, i) => f === b.frets[i]);
}

export interface ChordPreset {
  id: string;
  label: string;
  qualityIds: string[] | null;
}

export const CHORD_PRESETS: ChordPreset[] = [
  { id: "triads", label: "Triades", qualityIds: ["maj", "min", "dim"] },
  { id: "7s",     label: "7èmes",   qualityIds: ["maj7", "min7", "dom7", "m7b5"] },
];

export interface ChordProgression {
  id: string;
  label: string;
  chordIds: string[];
}

export const CHORD_PROGRESSIONS: ChordProgression[] = [
  { id: "key_c",   label: "Tonalité de Do",  chordIds: ["do_maj", "re_min", "mi_min", "fa_maj", "sol_maj", "la_min", "si_dim"] },
  { id: "key_g",   label: "Tonalité de Sol", chordIds: ["sol_maj", "la_min", "si_min", "do_maj", "re_maj", "mi_min"] },
  { id: "irish",   label: "Irlandais",        chordIds: ["re_maj", "sol_maj", "la_maj", "mi_min"] },
  { id: "pop",     label: "Pop I–V–vi–IV",   chordIds: ["do_maj", "sol_maj", "la_min", "fa_maj"] },
  { id: "blues_a", label: "Blues en La",     chordIds: ["la_dom7", "re_dom7", "mi_dom7"] },
];

export const NOTE_FREQS: Record<string, number[]> = {
  do:        [65.41,  130.81, 261.63, 523.25,  1046.50],
  do_sharp:  [69.30,  138.59, 277.18, 554.37,  1108.73],
  re:        [73.42,  146.83, 293.66, 587.33,  1174.66],
  re_sharp:  [77.78,  155.56, 311.13, 622.25,  1244.51],
  mi:        [82.41,  164.81, 329.63, 659.26,  1318.51],
  fa:        [87.31,  174.61, 349.23, 698.46,  1396.91],
  fa_sharp:  [92.50,  185.00, 369.99, 739.99,  1479.98],
  sol:       [98.00,  196.00, 392.00, 783.99,  1567.98],
  sol_sharp: [103.83, 207.65, 415.30, 830.61,  1661.22],
  la:        [110.00, 220.00, 440.00, 880.00,  1760.00],
  la_sharp:  [116.54, 233.08, 466.16, 932.33,  1864.66],
  si:        [123.47, 246.94, 493.88, 987.77,  1975.53],
};
