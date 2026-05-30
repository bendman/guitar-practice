export const FONT = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace";
export const BG = "#1a1816";
export const ACCENT = "#d4a574";
export const TEXT = "#e8e4df";
export const MUTED = "#8a8580";
export const DIM = "#5a5550";
export const GREEN = "#6ecf72";
export const RED = "#cf6e6e";
export const CORRECT = "#FFE566";

export const NOTES = [
  { id: "do", label: "Do", type: "note" },
  { id: "re", label: "Ré", type: "note" },
  { id: "mi", label: "Mi", type: "note" },
  { id: "fa", label: "Fa", type: "note" },
  { id: "sol", label: "Sol", type: "note" },
  { id: "la", label: "La", type: "note" },
  { id: "si", label: "Si", type: "note" },
];

// Sharp variants — have their own NOTE_FREQS entries
export const CHROMATIC_SHARPS = [
  { id: "do_sharp",  label: "Do#",  speak: "Do dièse",  type: "note", defaultEnabled: false },
  { id: "re_sharp",  label: "Ré#",  speak: "Ré dièse",  type: "note", defaultEnabled: false },
  { id: "fa_sharp",  label: "Fa#",  speak: "Fa dièse",  type: "note", defaultEnabled: false },
  { id: "sol_sharp", label: "Sol#", speak: "Sol dièse", type: "note", defaultEnabled: false },
  { id: "la_sharp",  label: "La#",  speak: "La dièse",  type: "note", defaultEnabled: false },
];

// Flat variants — same frequencies as their enharmonic sharp, resolved via enharmonicId
export const CHROMATIC_FLATS = [
  { id: "re_flat",  label: "Ré♭",  speak: "Ré bémol",  type: "note", defaultEnabled: false, enharmonicId: "do_sharp"  },
  { id: "mi_flat",  label: "Mi♭",  speak: "Mi bémol",  type: "note", defaultEnabled: false, enharmonicId: "re_sharp"  },
  { id: "sol_flat", label: "Sol♭", speak: "Sol bémol", type: "note", defaultEnabled: false, enharmonicId: "fa_sharp"  },
  { id: "la_flat",  label: "La♭",  speak: "La bémol",  type: "note", defaultEnabled: false, enharmonicId: "sol_sharp" },
  { id: "si_flat",  label: "Si♭",  speak: "Si bémol",  type: "note", defaultEnabled: false, enharmonicId: "la_sharp"  },
];

export const CHROMATIC_NOTES = [...CHROMATIC_SHARPS, ...CHROMATIC_FLATS];

// Display order: each entry is a natural note + optional [sharp, flat] pair
export const NOTES_DISPLAY_ORDER = [
  { natural: NOTES[0], chromatic: [CHROMATIC_SHARPS[0], CHROMATIC_FLATS[0]] },
  { natural: NOTES[1], chromatic: [CHROMATIC_SHARPS[1], CHROMATIC_FLATS[1]] },
  { natural: NOTES[2] },
  { natural: NOTES[3], chromatic: [CHROMATIC_SHARPS[2], CHROMATIC_FLATS[2]] },
  { natural: NOTES[4], chromatic: [CHROMATIC_SHARPS[3], CHROMATIC_FLATS[3]] },
  { natural: NOTES[5], chromatic: [CHROMATIC_SHARPS[4], CHROMATIC_FLATS[4]] },
  { natural: NOTES[6] },
];

export const CHORD_ROOTS = [
  { id: "mi", label: "Mi", speak: "«Mi»" },
  { id: "la", label: "La", speak: "«La»" },
];

export const CHORD_QUALITIES = [
  { id: "maj",  label: "Majeur",    speak: "Majeur" },
  { id: "min",  label: "Mineur",    speak: "Mineur" },
  { id: "dim",  label: "Diminué",   speak: "Diminué" },
  { id: "maj7", label: "Maj 7",     speak: "Majeur 7" },
  { id: "min7", label: "Min 7",     speak: "Mineur 7" },
  { id: "m7b5", label: "Demi-diminué", speak: "Demi-diminué" },
  { id: "dom7", label: "7",         speak: "7" },
];

// Open-position fingerings, indexed by chord id. frets are low-E → high-E
// (0 = open, -1 = muted). Multiple entries are alternate voicings (primary first).
const CHORD_VOICINGS = {
  mi_maj:  [{ frets: [0, 2, 2, 1, 0, 0] }],
  mi_min:  [{ frets: [0, 2, 2, 0, 0, 0] }],
  mi_dim:  [{ frets: [0, 1, 2, 0, -1, -1] }],
  mi_maj7: [{ frets: [0, 2, 1, 1, 0, 0] }],
  mi_min7: [{ frets: [0, 2, 0, 0, 0, 0] }, { frets: [0, 2, 0, 0, 3, 0] }],
  mi_m7b5: [{ frets: [0, 1, 0, 0, -1, -1] }],
  mi_dom7: [{ frets: [0, 2, 0, 1, 0, 0] }, { frets: [0, 2, 0, 1, 3, 0] }],
  la_maj:  [{ frets: [-1, 0, 2, 2, 2, 0] }],
  la_min:  [{ frets: [-1, 0, 2, 2, 1, 0] }],
  la_dim:  [{ frets: [-1, 0, 1, 2, 1, -1] }],
  la_maj7: [{ frets: [-1, 0, 2, 1, 2, 0] }],
  la_min7: [{ frets: [-1, 0, 2, 0, 1, 0] }, { frets: [-1, 0, 2, 0, 1, 3] }],
  la_m7b5: [{ frets: [-1, 0, 1, 0, 1, -1] }],
  la_dom7: [{ frets: [-1, 0, 2, 0, 2, 0] }, { frets: [-1, 0, 2, 0, 2, 3] }],
};

export const CHORDS = CHORD_ROOTS.flatMap((root) =>
  CHORD_QUALITIES.map((q) => {
    const id = `${root.id}_${q.id}`;
    return {
      id,
      label: `${root.label} ${q.label}`,
      speak: `${root.speak} ${q.speak}`,
      type: "chord",
      rootId: root.id,
      qualityId: q.id,
      voicings: CHORD_VOICINGS[id] ?? [],
    };
  })
);

export const ALL = [...NOTES, ...CHROMATIC_NOTES, ...CHORDS];

// Note frequencies for all guitar-relevant octaves (C2–C6)
// Maps note id -> array of frequencies across octaves
export const NOTE_FREQS = {
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
