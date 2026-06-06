export interface RelBarre { fret: number; from: number; to: number }

export interface BuilderState {
  /** Relative fret per string (1…N = fretted, 0 = open, -1 = muted). */
  frets: number[];
  barres: RelBarre[];
}

function setString(frets: number[], i: number, value: number): number[] {
  return frets.map((v, idx) => (idx === i ? value : v));
}

function coveringBarre(barres: RelBarre[], i: number, relFret: number): RelBarre | undefined {
  return barres.find((b) => i >= b.from && i <= b.to && b.fret === relFret);
}

function anyBarreCovers(barres: RelBarre[], i: number): boolean {
  return barres.some((b) => i >= b.from && i <= b.to);
}

/**
 * Remove any barre that is fully shadowed — i.e. every string in its range
 * already has an individual finger above the barre fret. A fully-shadowed
 * barre is invisible in the diagram and physically meaningless.
 */
function pruneFullyShadowedBarres(state: BuilderState): BuilderState {
  const alive = state.barres.filter((b) =>
    state.frets.some((v, i) => i >= b.from && i <= b.to && v <= b.fret && v !== -1),
  );
  return alive.length === state.barres.length ? state : { ...state, barres: alive };
}

function highestBarreBelow(barres: RelBarre[], i: number, relFret: number): RelBarre | undefined {
  return barres
    .filter((b) => i >= b.from && i <= b.to && b.fret < relFret)
    .sort((a, b) => b.fret - a.fret)[0];
}

/**
 * Tap an empty cell (no dot at that fret).
 * - Exactly on a barre's fret → removes the barre.
 * - Below a barre → no-op (shadowed).
 * - Otherwise → places a dot at that relative fret.
 */
export function applyCellTap(state: BuilderState, stringIndex: number, relFret: number): BuilderState {
  const atBarre = coveringBarre(state.barres, stringIndex, relFret);
  if (atBarre) {
    return {
      frets: state.frets.map((v, idx) =>
        idx >= atBarre.from && idx <= atBarre.to && v === atBarre.fret ? 0 : v,
      ),
      barres: state.barres.filter((b) => b !== atBarre),
    };
  }
  if (state.barres.some((b) => stringIndex >= b.from && stringIndex <= b.to && relFret < b.fret)) {
    return state;
  }
  const next = { ...state, frets: setString(state.frets, stringIndex, relFret) };
  return pruneFullyShadowedBarres(next);
}

/**
 * Tap the open/mute marker above a string.
 * - Ignored if any barre covers the string (can't open a fretted string).
 * - Otherwise: toggles between open (0) and muted (-1).
 */
export function applyMarkerTap(state: BuilderState, stringIndex: number): BuilderState {
  if (anyBarreCovers(state.barres, stringIndex)) return state;
  const next = state.frets[stringIndex] === 0 ? -1 : 0;
  return { ...state, frets: setString(state.frets, stringIndex, next) };
}

/**
 * Tap an existing dot.
 * - If it's a barre dot → removes the whole barre and opens the barre strings
 *   (higher individual fingers above the barre are kept).
 * - If a lower barre underlies the dot → removes the individual note and falls
 *   back to the barre fret (not to open, which would show as an open-string
 *   marker while the barre is still physically held).
 * - Otherwise → removes the dot (string becomes open).
 */
export function applyDotTap(state: BuilderState, stringIndex: number): BuilderState {
  const rel = state.frets[stringIndex];

  // Tapping a barre dot → remove the entire barre.
  const barre = coveringBarre(state.barres, stringIndex, rel);
  if (barre) {
    return {
      frets: state.frets.map((v, idx) =>
        idx >= barre.from && idx <= barre.to && v === barre.fret ? 0 : v,
      ),
      barres: state.barres.filter((b) => b !== barre),
    };
  }

  // Underlying barre exists → fall back to barre fret, not open.
  const under = highestBarreBelow(state.barres, stringIndex, rel);
  if (under) {
    return { ...state, frets: setString(state.frets, stringIndex, under.fret) };
  }

  return { ...state, frets: setString(state.frets, stringIndex, 0) };
}

/**
 * Drag across strings on the same fret to lay a barre.
 * Raises all spanned strings at or below the barre fret to the barre fret;
 * higher individual fingers are left in place.
 */
export function applyBarre(state: BuilderState, from: number, to: number, relFret: number): BuilderState {
  // A barre can only be placed if at least one string in its range is at or
  // below the barre fret (i.e. it would actually hold something down).
  // If every string is already fretted higher, the barre is behind all notes
  // and would be invisible — reject it.
  const hasEffect = state.frets.some(
    (v, i) => i >= from && i <= to && v <= relFret && v !== -1,
  );
  if (!hasEffect) return state;

  return {
    frets: state.frets.map((v, i) =>
      i >= from && i <= to && v <= relFret ? relFret : v,
    ),
    barres: [...state.barres.filter((b) => b.fret !== relFret), { fret: relFret, from, to }],
  };
}
