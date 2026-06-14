import { useEffect, useRef, useState } from "react";
import type { ChordItem } from "../../lib/constants";
import ChordDiagram from "../ui/ChordDiagram";
import s from "./session.module.css";

interface ChordRevealProps {
  chord: ChordItem;
  preferredVoicings: Record<string, number>;
  onVoicingChange: (chordId: string, idx: number) => void;
  onAddVoicing: (rootId: string, qualityId: string) => void;
  showChordNotes?: boolean;
  /** Reset the visible voicing back to index 0 (used after grading/continuing). */
  resetSignal?: unknown;
}

export default function ChordReveal({
  chord,
  preferredVoicings,
  onVoicingChange,
  onAddVoicing,
  showChordNotes = false,
  resetSignal,
}: ChordRevealProps) {
  const voicings = chord.voicings;
  const [voicingIdx, setVoicingIdx] = useState(0);

  const preferredRef = useRef(preferredVoicings);
  preferredRef.current = preferredVoicings;

  // Sync voicingIdx with the preferred voicing for the current chord — runs on
  // chord change, preference change (‹›), or when voicings are added.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setVoicingIdx(Math.min(preferredRef.current[chord.id] ?? 0, Math.max(voicings.length - 1, 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chord.id, preferredVoicings, voicings.length]);

  // Reset to index 0 when the parent signals (e.g., after grading or continuing).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (resetSignal !== undefined) setVoicingIdx(0);
  }, [resetSignal]);

  return (
    <div className={s.diagramWrap}>
      {voicings[voicingIdx] && (
        <ChordDiagram fingering={voicings[voicingIdx]} size={320} showNotes={showChordNotes} />
      )}
      {voicings.length > 1 && (
        <div className={s.voicingSwitcher} role="group" aria-label="Positions">
          <button
            className={s.cycleBtn}
            aria-label="Position précédente"
            onClick={() => {
              const next = (voicingIdx - 1 + voicings.length) % voicings.length;
              setVoicingIdx(next);
              onVoicingChange(chord.id, next);
            }}
          >‹</button>
          <span
            className={s.voicingCount}
            role="status"
            aria-label={`Position ${voicingIdx + 1} sur ${voicings.length}`}
          >{voicingIdx + 1}/{voicings.length}</span>
          <button
            className={s.cycleBtn}
            aria-label="Position suivante"
            onClick={() => {
              const next = (voicingIdx + 1) % voicings.length;
              setVoicingIdx(next);
              onVoicingChange(chord.id, next);
            }}
          >›</button>
        </div>
      )}
      <button
        className={s.addVoicingBtn}
        aria-label="Ajouter une position"
        onClick={() => onAddVoicing(chord.rootId, chord.qualityId)}
      >+ Ajouter une position</button>
    </div>
  );
}
