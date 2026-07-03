import { useTranslation } from "react-i18next";
import type { ChordItem } from "../../lib/constants";
import { useFormatLabel } from "../../lib/noteNaming";
import ChordDiagram from "../ui/ChordDiagram";
import s from "./session.module.css";

interface QuizGridProps {
  choices: ChordItem[];
  correctId: string | null;
  selectedId: string | null;
  preferredVoicings: Record<string, number>;
  showChordNotes?: boolean;
  onSelect: (id: string) => void;
}

export default function QuizGrid({
  choices,
  correctId,
  selectedId,
  preferredVoicings,
  showChordNotes = false,
  onSelect,
}: QuizGridProps) {
  const { t } = useTranslation();
  const formatLabel = useFormatLabel();
  return (
    <div className={s.quizGrid} role="group" aria-label={t("session.quizChoices")}>
      {choices.map((c) => {
        const isCorrectChoice = c.id === correctId;
        const isPicked = c.id === selectedId;
        const cardClass =
          selectedId == null
            ? s.quizCard
            : `${s.quizCard} ${isCorrectChoice ? s.quizCardCorrect : isPicked ? s.quizCardWrong : s.quizCardDim}`;
        return (
          <button
            key={c.id}
            className={cardClass}
            onClick={() => onSelect(c.id)}
            disabled={selectedId != null}
          >
            {c.voicings.length > 0 && (
              <ChordDiagram
                fingering={
                  c.voicings[Math.min(preferredVoicings[c.id] ?? 0, c.voicings.length - 1)]
                }
                size={160}
                showNotes={showChordNotes}
              />
            )}
            <span className={s.quizCardName}>
              {selectedId != null ? formatLabel(c.labelShort) : "?"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
