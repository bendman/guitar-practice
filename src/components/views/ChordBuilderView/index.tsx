import { useState, useMemo } from "react";
import { CHORDS, chordId, voicingsEqual } from "../../../lib/constants";
import type { Voicing, Barre } from "../../../lib/constants";
import type { CustomVoicings } from "../../../hooks/useCustomVoicings";
import { getNoteRole, filterPossibleChords } from "../../../lib/chordAnalysis";
import {
  applyCellTap,
  applyMarkerTap,
  applyDotTap,
  applyBarre,
} from "../../../lib/chordBuilderState";
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

// Standard guitar tuning open-string semitone values (C=0), low to high.
const OPEN_STRING_SEMITONES = [4, 9, 2, 7, 11, 4];

/** A barre held in the builder, with its fret relative to the first case. */
interface RelBarre {
  fret: number;
  from: number;
  to: number;
}

export default function ChordBuilderView({
  prefillRootId,
  prefillQualityId,
  customVoicings,
  onSave,
  onCancel,
}: ChordBuilderViewProps) {
  const [selectedChordId, setSelectedChordId] = useState(() =>
    chordId(prefillRootId, prefillQualityId),
  );
  const [baseFret, setBaseFret] = useState(1);
  const [frets, setFrets] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [barres, setBarres] = useState<RelBarre[]>([]);

  const selectedChord = CHORDS.find((c) => c.id === selectedChordId) ?? CHORDS[0];
  const { rootId, qualityId } = selectedChord;
  const id = selectedChord.id;

  const absoluteFrets = frets.map((f) => (f > 0 ? f + baseFret - 1 : f));
  const absoluteBarres: Barre[] = barres.map((b) => ({
    fret: b.fret + baseFret - 1,
    fromString: b.from,
    toString: b.to,
  }));
  const voicing: Voicing = {
    frets: absoluteFrets,
    ...(baseFret === 1 ? {} : { baseFret }),
    ...(absoluteBarres.length ? { barres: absoluteBarres } : {}),
  };

  // Semitones of all sounding strings. For a barre-covered string whose
  // individual fret slot was reset to 0 (e.g. after removing a higher dot),
  // the barre fret is the actual sounding pitch — use that instead.
  const playedSemitones = useMemo(() => {
    const set = new Set<number>();
    absoluteFrets.forEach((f, i) => {
      if (f === -1) return; // muted
      const effectiveFret = absoluteBarres.reduce((acc, b) => {
        const lo = Math.min(b.fromString, b.toString);
        const hi = Math.max(b.fromString, b.toString);
        return i >= lo && i <= hi && b.fret > acc ? b.fret : acc;
      }, f);
      set.add((OPEN_STRING_SEMITONES[i] + effectiveFret) % 12);
    });
    return set;
  }, [absoluteFrets, absoluteBarres]);

  const possibleChords = useMemo(() => {
    // When the played note set matches no chord exactly (e.g. initial all-open
    // state has 5 unique semitones, which no defined quality has) fall back to
    // the full list so the user can always make a selection.
    const matched = filterPossibleChords(playedSemitones, CHORDS);
    return matched.length > 0 ? matched : CHORDS;
  }, [playedSemitones]);

  // If the selected chord fell out of the possible list, auto-pick the first.
  const effectiveChordId = possibleChords.some((c) => c.id === selectedChordId)
    ? selectedChordId
    : (possibleChords[0]?.id ?? selectedChordId);

  const handleNoteRole = (stringIndex: number, fret: number) => {
    const semitone = (OPEN_STRING_SEMITONES[stringIndex] + fret) % 12;
    return getNoteRole(semitone, rootId, qualityId);
  };

  const applyState = (next: { frets: number[]; barres: typeof barres }) => {
    setFrets(next.frets);
    setBarres(next.barres);
  };

  const handleCellTap = (i: number, absoluteFret: number) =>
    applyState(applyCellTap({ frets, barres }, i, absoluteFret - baseFret + 1));

  const handleMarkerTap = (i: number) => applyState(applyMarkerTap({ frets, barres }, i));

  const handleDotTap = (i: number) => applyState(applyDotTap({ frets, barres }, i));

  const handleBarre = (from: number, to: number, absoluteFret: number) =>
    applyState(applyBarre({ frets, barres }, from, to, absoluteFret - baseFret + 1));

  const handleSelectChord = (cid: string) => {
    setSelectedChordId(cid);
  };

  // Keep effectiveChordId in sync with the state when auto-switching
  if (effectiveChordId !== selectedChordId) {
    setSelectedChordId(effectiveChordId);
  }

  const existing = [
    ...(CHORDS.find((c) => c.id === id)?.voicings ?? []),
    ...(customVoicings[id] ?? []),
  ];
  const isDuplicate = existing.some((v) => voicingsEqual(v, voicing));

  return (
    <div className={s.scrim} role="dialog" aria-modal="true" aria-label="Créer un accord">
      <div className={s.sheet}>
        <div className={s.body}>
          <h1 className={shared.title}>Créer un accord</h1>

          <div className={s.diagramWrap}>
            <ChordDiagram
              fingering={voicing}
              size={300}
              fretCount={FRET_COUNT}
              editable
              showNotes
              noteRole={handleNoteRole}
              onCellTap={handleCellTap}
              onMarkerTap={handleMarkerTap}
              onDotTap={handleDotTap}
              onBarre={handleBarre}
            />
          </div>
          <p className={s.hint}>
            Touche une case pour poser un doigt · glisse sur une frette pour un barré
          </p>

          <div className={s.settingRow}>
            <span className={s.settingLabel}>Première case</span>
            <div className={s.pickerRow}>
              <button
                className={s.pick}
                aria-label="Diminuer la première case"
                onClick={() => setBaseFret((b) => Math.max(1, b - 1))}
              >
                −
              </button>
              <span className={s.settingLabel} aria-live="polite">
                {baseFret}
              </span>
              <button
                className={s.pick}
                aria-label="Augmenter la première case"
                onClick={() => setBaseFret((b) => Math.min(15, b + 1))}
              >
                +
              </button>
            </div>
          </div>

          <div className={s.field}>
            <span className={shared.eyebrow}>
              Accord possible
              {possibleChords.length < CHORDS.length && (
                <span className={s.chordCount}> · {possibleChords.length}</span>
              )}
            </span>
            <div className={s.scrollRow} role="radiogroup" aria-label="Accord">
              {possibleChords.map((c) => (
                <button
                  key={c.id}
                  role="radio"
                  aria-checked={c.id === effectiveChordId}
                  className={`${s.pick} ${c.id === effectiveChordId ? s.pickOn : ""}`}
                  onClick={() => handleSelectChord(c.id)}
                >
                  {c.labelShort}
                </button>
              ))}
              {possibleChords.length === 0 && (
                <span className={s.settingLabel}>Aucun accord correspondant</span>
              )}
            </div>
          </div>

          {isDuplicate && (
            <p className={s.alert} role="alert">
              Cet accord existe déjà
            </p>
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
