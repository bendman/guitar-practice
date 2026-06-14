import type { PracticeItem } from "../../lib/constants";
import { NOTES, CHROMATIC_SHARPS } from "../../lib/constants";
import { useFormatLabel } from "../../lib/noteNaming";
import s from "./session.module.css";

const NOTE_LABELS = [...NOTES, ...CHROMATIC_SHARPS];

function detectedLabel(detectedNote: string | null): string | null {
  if (!detectedNote) return null;
  return NOTE_LABELS.find((n) => n.id === detectedNote)?.label ?? "?";
}

interface NoteDisplayProps {
  current: PracticeItem | null;
  /** Show the large pause pill above the note. */
  showPauseBadge?: boolean;
  /** Listening note is recognized — emphasize the note and show the checkmark. */
  recognized?: boolean;
  /** Listening hint row below the note (only when listening + waiting for input). */
  showListenHint?: boolean;
  detectedNote?: string | null;
}

export default function NoteDisplay({
  current,
  showPauseBadge = false,
  recognized = false,
  showListenHint = false,
  detectedNote = null,
}: NoteDisplayProps) {
  const formatLabel = useFormatLabel();
  const detected = detectedLabel(detectedNote ?? null);

  return (
    <>
      {showPauseBadge && <div className={s.pauseBadge}>En pause</div>}
      <div className={`${s.noteName} ${recognized ? s.noteNameCorrect : ""}`}>
        {current ? formatLabel(current.label) : "—"}
      </div>
      {recognized && <div className={s.correctMark}>✓</div>}
      {showListenHint && (
        <div className={s.listenHint}>
          Note · {detected ? formatLabel(detected) : "Écoute…"}
        </div>
      )}
    </>
  );
}
