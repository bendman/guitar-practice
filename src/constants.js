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
  { id: "dim7", label: "Dim 7",     speak: "Diminué 7" },
  { id: "dom7", label: "7",         speak: "7" },
];

export const CHORDS = CHORD_ROOTS.flatMap((root) =>
  CHORD_QUALITIES.map((q) => ({
    id: `${root.id}_${q.id}`,
    label: `${root.label} ${q.label}`,
    speak: `${root.speak} ${q.speak}`,
    type: "chord",
    rootId: root.id,
    qualityId: q.id,
  }))
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
