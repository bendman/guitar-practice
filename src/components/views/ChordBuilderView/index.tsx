import { useState } from "react";
import {
  CHORDS, CHORD_ROOTS, CHORD_QUALITIES, chordId, voicingsEqual,
} from "../../../lib/constants";
import type { Voicing, Barre } from "../../../lib/constants";
import type { CustomVoicings } from "../../../hooks/useCustomVoicings";
import { useFormatLabel } from "../../../lib/noteNaming";
import ChordDiagram from "../../ui/ChordDiagram";
import shared from "../../shared.module.css";
import s from "./index.module.css";

interface ChordBuilderViewProps {
  prefillRootId: string;
  prefillQualityId: string;
  customVoicings: CustomVoicings;
  onSave: (chordId: string, voicing: Voicing) => void;
  onCancel: () => void;
}

const FRET_COUNT = 5;

/**
 * Auto-detect a barre. A real barre is the foundation of the shape: one finger
 * lies across the lowest fretted fret starting at the lowest *played* string,
 * with every string it spans pressed at that fret or higher. That last part is
 * what tells a true barre apart from a shape like open D ([x x 0 2 3 2]), where
 * two strings share the lowest fret but the lowest played string is open — so
 * no barre. `relFrets` are relative to the first case; the returned barre fret
 * is absolute so it lines up with `baseFret`.
 */
function detectBarres(relFrets: number[], baseFret: number): Barre[] {
  const positives = relFrets.filter((f) => f > 0);
  if (positives.length === 0) return [];
  const minRel = Math.min(...positives);

  // The barre must begin on the lowest played (non-muted) string.
  const lo = relFrets.findIndex((f) => f !== -1);
  if (lo < 0 || relFrets[lo] !== minRel) return [];

  // …and reach at least one more string at the same fret.
  let hi = lo;
  for (let i = relFrets.length - 1; i > lo; i--) {
    if (relFrets[i] === minRel) { hi = i; break; }
  }
  if (hi === lo) return [];

  // Every string under the barre must be pressed at the barre fret or above
  // (an open or muted string in the span means it isn't a barre).
  for (let i = lo; i <= hi; i++) {
    if (relFrets[i] < minRel) return [];
  }

  return [{ fret: baseFret + minRel - 1, fromString: lo, toString: hi }];
}

export default function ChordBuilderView({
  prefillRootId, prefillQualityId, customVoicings, onSave, onCancel,
}: ChordBuilderViewProps) {
  const formatLabel = useFormatLabel();
  const [rootId, setRootId] = useState(prefillRootId);
  const [qualityId, setQualityId] = useState(prefillQualityId);
  const [baseFret, setBaseFret] = useState(1);
  // `frets` holds positions RELATIVE to the first visible case: a fretted note
  // is its row number (1…FRET_COUNT), 0 = open, -1 = muted. Keeping them
  // relative means moving the first case never moves the dots — only the fret
  // label changes. Absolute frets are derived for display and saving.
  const [frets, setFrets] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  const id = chordId(rootId, qualityId);
  const absoluteFrets = frets.map((f) => (f > 0 ? f + baseFret - 1 : f));
  const barres = detectBarres(frets, baseFret);
  const voicing: Voicing = {
    frets: absoluteFrets,
    ...(baseFret === 1 ? {} : { baseFret }),
    ...(barres.length ? { barres } : {}),
  };

  const setString = (i: number, value: number) =>
    setFrets((prev) => prev.map((v, idx) => (idx === i ? value : v)));

  const handleCellTap = (i: number, absoluteFret: number) => setString(i, absoluteFret - baseFret + 1);
  const handleMarkerTap = (i: number) => setString(i, frets[i] === 0 ? -1 : 0);
  const handleDotTap = (i: number) => setString(i, 0);

  const existing = [
    ...(CHORDS.find((c) => c.id === id)?.voicings ?? []),
    ...(customVoicings[id] ?? []),
  ];
  const isDuplicate = existing.some((v) => voicingsEqual(v, voicing));

  const root = CHORD_ROOTS.find((r) => r.id === rootId);
  const quality = CHORD_QUALITIES.find((q) => q.id === qualityId);
  const chordName = root && quality ? `${formatLabel(root.label)} ${quality.labelLong}` : "";

  return (
    <div className={s.scrim} role="dialog" aria-modal="true" aria-label="Créer un accord">
      <div className={s.sheet}>
        <div className={s.body}>
          <div>
            <h1 className={shared.title}>Créer un accord</h1>
            <p className={shared.subtitle}>{chordName}</p>
          </div>

          <div className={s.diagramWrap}>
            <ChordDiagram
              fingering={voicing}
              size={300}
              fretCount={FRET_COUNT}
              editable
              onCellTap={handleCellTap}
              onMarkerTap={handleMarkerTap}
              onDotTap={handleDotTap}
            />
          </div>

          <div className={s.settingRow}>
            <span className={s.settingLabel}>Première case</span>
            <div className={s.pickerRow}>
              <button
                className={s.pick}
                aria-label="Diminuer la première case"
                onClick={() => setBaseFret((b) => Math.max(1, b - 1))}
              >−</button>
              <span className={s.settingLabel} aria-live="polite">{baseFret}</span>
              <button
                className={s.pick}
                aria-label="Augmenter la première case"
                onClick={() => setBaseFret((b) => Math.min(15, b + 1))}
              >+</button>
            </div>
          </div>

          <div className={s.field}>
            <span className={shared.eyebrow}>Fondamentale</span>
            <div className={s.scrollRow} role="radiogroup" aria-label="Fondamentale">
              {CHORD_ROOTS.map((r) => (
                <button
                  key={r.id}
                  role="radio"
                  aria-checked={rootId === r.id}
                  className={`${s.pick} ${rootId === r.id ? s.pickOn : ""}`}
                  onClick={() => setRootId(r.id)}
                >
                  {formatLabel(r.label)}
                </button>
              ))}
            </div>
          </div>

          <div className={s.field}>
            <span className={shared.eyebrow}>Famille</span>
            <div className={s.scrollRow} role="radiogroup" aria-label="Famille">
              {CHORD_QUALITIES.map((q) => (
                <button
                  key={q.id}
                  role="radio"
                  aria-checked={qualityId === q.id}
                  className={`${s.pick} ${qualityId === q.id ? s.pickOn : ""}`}
                  onClick={() => setQualityId(q.id)}
                >
                  {q.labelLong}
                </button>
              ))}
            </div>
          </div>

          {isDuplicate && (
            <p className={s.alert} role="alert">Cet accord existe déjà</p>
          )}
        </div>

        <div className={s.footer}>
          <button onClick={onCancel} className={shared.footerBtnSecondary}>
            Annuler
          </button>
          <button
            onClick={() => onSave(id, voicing)}
            disabled={isDuplicate}
            className={shared.footerBtnPrimary}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
