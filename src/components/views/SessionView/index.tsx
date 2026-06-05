import { useEffect, useRef, useState } from "react";
import { NOTES, CHROMATIC_SHARPS } from "../../../lib/constants";
import type { PracticeItem, ChordItem } from "../../../lib/constants";
import type { ChordMode } from "../../../hooks/useSession";
import { formatTime } from "../../../lib/util";
import { useFormatLabel } from "../../../lib/noteNaming";
import ChordDiagram from "../../ui/ChordDiagram";
import Icon from "../../ui/Icon";
import s from "./index.module.css";

const NOTE_LABELS = [...NOTES, ...CHROMATIC_SHARPS];

function detectedLabel(detectedNote: string | null): string | null {
  if (!detectedNote) return null;
  return NOTE_LABELS.find((n) => n.id === detectedNote)?.label ?? "?";
}

type CtrlVariant = "primary" | "secondary" | "accent-line" | "danger-line" | "danger";

interface CtrlBtnProps {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: CtrlVariant;
}

function CtrlBtn({ icon, label, onClick, variant = "secondary" }: CtrlBtnProps) {
  const variantClass: Record<CtrlVariant, string> = {
    primary: s.ctrlBtnPrimary,
    secondary: s.ctrlBtnSecondary,
    "accent-line": s.ctrlBtnAccentLine,
    "danger-line": s.ctrlBtnDangerLine,
    danger: s.ctrlBtnDanger,
  };

  return (
    <button onClick={onClick} className={`${s.ctrlBtn} ${variantClass[variant]}`}>
      <span className={s.ctrlIcon}><Icon name={icon} size={20} /></span>
      <span className={s.ctrlLabel}>{label}</span>
    </button>
  );
}

function DisabledCtrlBtn({ icon, label }: { icon: string; label: string }) {
  return (
    <button disabled className={`${s.ctrlBtn} ${s.ctrlBtnSecondary}`}>
      <span className={s.ctrlIcon}><Icon name={icon} size={20} /></span>
      <span className={s.ctrlLabel}>{label}</span>
    </button>
  );
}

interface SessionViewProps {
  current: PracticeItem | null;
  count: number;
  streak: number;
  progress: number;
  paused: boolean;
  listening: boolean;
  detectedNote: string | null;
  hitStatus: "correct" | "wrong" | null;
  practiceTime: number;
  interval: number;
  chordMode: ChordMode;
  pendingReveal: boolean;
  choices: ChordItem[];
  correctId: string | null;
  selectedId: string | null;
  onPauseToggle: () => void;
  onForceAccept: () => void;
  onManualNext: () => void;
  onChordGrade: (correct: boolean) => void;
  onQuizSelect: (id: string) => void;
  onQuizNext: () => void;
  onStop: () => void;
  onShowLearning: () => void;
  preferredVoicings: Record<string, number>;
  onVoicingChange: (chordId: string, idx: number) => void;
  onAddVoicing: (rootId: string, qualityId: string) => void;
}

export default function SessionView({
  current,
  count,
  streak,
  progress,
  paused,
  listening,
  detectedNote,
  hitStatus,
  practiceTime,
  interval,
  chordMode,
  pendingReveal,
  choices,
  correctId,
  selectedId,
  onPauseToggle,
  onForceAccept,
  onManualNext,
  onChordGrade,
  onQuizSelect,
  onQuizNext,
  onStop,
  onShowLearning,
  preferredVoicings,
  onVoicingChange,
  onAddVoicing,
}: SessionViewProps) {
  const formatLabel = useFormatLabel();
  const chordAuto = chordMode === "auto";
  const quiz = chordMode === "quiz";
  const [revealed, setRevealed] = useState(false);
  const [voicingIdx, setVoicingIdx] = useState(0);
  const isCorrect = listening && hitStatus === "correct" && !paused;
  const isChord = current?.type === "chord";
  const voicings = current?.type === "chord" ? (current as ChordItem).voicings : [];

  const preferredVoicingsRef = useRef(preferredVoicings);
  preferredVoicingsRef.current = preferredVoicings;

  // Reset revealed state when the chord changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setRevealed(false); }, [current?.id]);

  // Keep voicingIdx in sync with preferredVoicings for the current chord.
  // Runs on chord change, when the preference changes (e.g. user clicks ‹›), and
  // when voicings are added to the pool (length increases after chord builder save).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (!current?.id) return;
    setVoicingIdx(Math.min(preferredVoicingsRef.current[current.id] ?? 0, Math.max(voicings.length - 1, 0)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, preferredVoicings, voicings.length]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (pendingReveal) setRevealed(true); }, [pendingReveal]);

  const reveal = () => {
    setRevealed(true);
    if (!paused) onPauseToggle();
  };

  const continueSession = () => {
    setVoicingIdx(0);
    setRevealed(false);
    if (paused) onPauseToggle();
  };

  const handleChordGrade = (correct: boolean) => {
    setVoicingIdx(0);
    setRevealed(false);
    if (paused) onPauseToggle();
    onChordGrade(correct);
  };

  const detected = detectedLabel(detectedNote);

  let controls: React.ReactNode;
  if (quiz) {
    controls = (
      <>
        <CtrlBtn
          icon={paused ? "play" : "pause"}
          label={paused ? "Reprendre" : "Pause"}
          onClick={onPauseToggle}
          variant={paused ? "primary" : "accent-line"}
        />
        {selectedId != null
          ? <CtrlBtn icon="next" label="Suivant" onClick={onQuizNext} variant="primary" />
          : <DisabledCtrlBtn icon="next" label="Suivant" />}
        <CtrlBtn icon="stop" label="Arrêter" onClick={onStop} variant="danger" />
      </>
    );
  } else if (revealed) {
    if (chordAuto) {
      controls = (
        <>
          <CtrlBtn icon="pause" label="Pause" onClick={onPauseToggle} variant="accent-line" />
          <CtrlBtn icon="next" label="Continuer" onClick={continueSession} variant="primary" />
          <CtrlBtn icon="stop" label="Arrêter" onClick={onStop} variant="danger" />
        </>
      );
    } else {
      controls = (
        <>
          <CtrlBtn icon="x" label="Raté" onClick={() => handleChordGrade(false)} variant="danger-line" />
          <CtrlBtn icon="check" label="Trouvé" onClick={() => handleChordGrade(true)} variant="primary" />
          <CtrlBtn icon="stop" label="Arrêter" onClick={onStop} variant="danger" />
        </>
      );
    }
  } else if (paused) {
    controls = (
      <>
        <CtrlBtn icon="play" label="Reprendre" onClick={onPauseToggle} variant="primary" />
        <CtrlBtn icon="next" label="Suivant" onClick={onManualNext} variant="secondary" />
        <CtrlBtn icon="stop" label="Arrêter" onClick={onStop} variant="danger" />
      </>
    );
  } else if (isChord) {
    controls = (
      <>
        <CtrlBtn icon="pause" label="Pause" onClick={onPauseToggle} variant="accent-line" />
        <CtrlBtn icon="eye" label="Voir" onClick={reveal} variant="primary" />
        <CtrlBtn icon="stop" label="Arrêter" onClick={onStop} variant="danger" />
      </>
    );
  } else {
    controls = (
      <>
        <CtrlBtn icon="pause" label="Pause" onClick={onPauseToggle} variant="accent-line" />
        {listening && !isCorrect && (
          <CtrlBtn icon="check" label="Accepter" onClick={onForceAccept} variant="primary" />
        )}
        <CtrlBtn icon="stop" label="Arrêter" onClick={onStop} variant="danger" />
      </>
    );
  }

  return (
    <div className={s.root}>
      {!quiz && (
        <div
          className={s.progressBar}
          style={{ width: `${progress * 100}%`, opacity: paused ? 0.2 : 1 }}
        />
      )}

      {isCorrect && <div className={s.correctFlash} />}
      {isCorrect && <div className={s.correctGlow} />}

      <div className={s.topBar}>
        <button className={s.learningLink} onClick={onShowLearning}>Details</button>
        <div className={s.timer}>{formatTime(practiceTime)}</div>
        <div className={s.countRow}>
          <span className={s.count} role="status" aria-label={`Carte ${count}`}>#{count}</span>
          {listening && streak > 0 && (
            <span className={s.streak}>{streak} 🔥</span>
          )}
        </div>
      </div>

      <div className={s.center}>
        {paused && !revealed && !quiz && (
          <div className={s.pauseBadge}>En pause</div>
        )}

        <div className={`${s.noteName} ${isCorrect ? s.noteNameCorrect : ""}`}>
          {current ? formatLabel(current.label) : "—"}
        </div>

        {quiz && (
          <div className={s.quizGrid} role="group" aria-label="Choix d'accord">
            {choices.map((c) => {
              const isCorrectChoice = c.id === correctId;
              const isPicked = c.id === selectedId;
              const cardClass = selectedId == null
                ? s.quizCard
                : `${s.quizCard} ${isCorrectChoice ? s.quizCardCorrect : isPicked ? s.quizCardWrong : s.quizCardDim}`;
              return (
                <button
                  key={c.id}
                  className={cardClass}
                  onClick={() => onQuizSelect(c.id)}
                  disabled={selectedId != null}
                >
                  {c.voicings.length > 0 && <ChordDiagram fingering={c.voicings[Math.min(preferredVoicings[c.id] ?? 0, c.voicings.length - 1)]} size={160} />}
                  <span className={s.quizCardName}>
                    {selectedId != null ? formatLabel(c.labelShort) : "?"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {isCorrect && <div className={s.correctMark}>✓</div>}

        {listening && !isCorrect && !revealed && current?.type === "note" && !paused && (
          <div className={s.listenHint}>
            Note · {detected ? formatLabel(detected) : "Écoute…"}
          </div>
        )}

        {revealed && isChord && (
          <div className={s.diagramWrap}>
            {voicings[voicingIdx] && (
              <ChordDiagram fingering={voicings[voicingIdx]} size={320} />
            )}
            {voicings.length > 1 && (
              <div className={s.voicingSwitcher} role="group" aria-label="Positions">
                <button
                  className={s.cycleBtn}
                  aria-label="Position précédente"
                  onClick={() => {
                    const next = (voicingIdx - 1 + voicings.length) % voicings.length;
                    setVoicingIdx(next);
                    if (current?.type === "chord") onVoicingChange(current.id, next);
                  }}
                >‹</button>
                <span className={s.voicingCount} role="status" aria-label={`Position ${voicingIdx + 1} sur ${voicings.length}`}>{voicingIdx + 1}/{voicings.length}</span>
                <button
                  className={s.cycleBtn}
                  aria-label="Position suivante"
                  onClick={() => {
                    const next = (voicingIdx + 1) % voicings.length;
                    setVoicingIdx(next);
                    if (current?.type === "chord") onVoicingChange(current.id, next);
                  }}
                >›</button>
              </div>
            )}
            {current?.type === "chord" && (
              <button
                className={s.addVoicingBtn}
                aria-label="Ajouter une position"
                onClick={() => onAddVoicing((current as ChordItem).rootId, (current as ChordItem).qualityId)}
              >+ Ajouter une position</button>
            )}
          </div>
        )}
      </div>

      <div className={s.controlBar}>
        {controls}
      </div>

      {!quiz && <div className={s.keyHints}>▲▼ intervalle ({interval.toFixed(1)}s)</div>}
    </div>
  );
}
