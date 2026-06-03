import React from "react";
import { CHORDS, NOTES, CHROMATIC_NOTES } from "../../../lib/constants";
import type { PracticeItem } from "../../../lib/constants";
import type { Weights } from "../../../lib/stats";
import type { ChordMode } from "../../../hooks/useSession";
import NotesPicker from "../../ui/NotesPicker";
import Toggle from "../../ui/Toggle";
import IntervalControl from "./IntervalControl";
import ChordsBuilder from "./ChordsBuilder";
import shared from "../../shared.module.css";
import s from "./index.module.css";

interface ConfigViewProps {
  mode: string | null;
  interval: number;
  setInterval: (v: number) => void;
  enabled: Record<string, boolean>;
  setEnabled: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  tts: boolean;
  setTts: (v: boolean) => void;
  listening: boolean;
  setListening: (v: boolean) => void;
  pool: PracticeItem[];
  chordPreset: string | null;
  chordProgression: string | null;
  onPreset: (id: string) => void;
  onProgression: (id: string) => void;
  chordMode: ChordMode;
  setChordMode: (v: ChordMode) => void;
  weights?: Weights;
  onStart: () => void;
  onBack: () => void;
  showDebugLink: boolean;
  onShowDebug: () => void;
}

export default function ConfigView({
  mode,
  interval, setInterval,
  enabled, setEnabled,
  tts, setTts,
  listening, setListening,
  pool,
  chordPreset, chordProgression,
  onPreset, onProgression,
  chordMode, setChordMode,
  onStart, onBack,
  weights = {},
  showDebugLink, onShowDebug,
}: ConfigViewProps) {
  const isNotesMode = mode !== "chords";
  const title = isNotesMode ? "Notes" : "Accords";
  const subtitle = isNotesMode
    ? "Configure ta session de notes"
    : "Configure ta session d'accords";

  const noteCount = [...NOTES, ...CHROMATIC_NOTES].filter((n) => enabled[n.id]).length;
  const chordCount = CHORDS.filter((c) => enabled[c.id]).length;
  const quizDisabled = chordCount < 4;

  React.useEffect(() => {
    if (quizDisabled && chordMode === "quiz") setChordMode("manual");
  }, [quizDisabled, chordMode, setChordMode]);

  return (
    <div className={shared.screen}>
      {showDebugLink && (
        <button onClick={onShowDebug} className={s.debugBtn}>debug</button>
      )}
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>
          <h1 className={shared.title}>{title}</h1>
          <p className={shared.subtitle}>{subtitle}</p>

          <IntervalControl interval={interval} setInterval={setInterval} />

          {isNotesMode ? (
            <>
              <NotesPicker
                enabled={enabled}
                setEnabled={setEnabled}
                selectedNoteCount={noteCount}
              />
              <Toggle
                label="Annoncer à voix haute"
                sublabel="Lit le nom au début de chaque carte"
                value={tts}
                onChange={setTts}
              />
              <Toggle
                label="Détecter les notes (micro)"
                sublabel="Valide automatiquement quand tu joues juste"
                value={listening}
                onChange={setListening}
              />
            </>
          ) : (
            <>
              <ChordsBuilder
                enabled={enabled}
                setEnabled={setEnabled}
                chordPreset={chordPreset}
                chordProgression={chordProgression}
                onPreset={onPreset}
                onProgression={onProgression}
                weights={weights}
              />

              <div className={s.toggleRow}>
                <div>
                  <div className={s.toggleLabel}>Progression</div>
                  <div className={s.toggleSublabel}>
                    {chordMode === "auto"
                      ? "Auto · pratique la vitesse de transition"
                      : chordMode === "quiz"
                      ? "QCM · reconnais l'accord parmi 4 diagrammes"
                      : "Manuelle · mémorise, évalue Trouvé / Raté"}
                  </div>
                </div>
                <div className={s.segmented}>
                  <button
                    className={`${s.seg} ${chordMode === "manual" ? s.segOn : ""}`}
                    onClick={() => setChordMode("manual")}
                  >
                    Manuelle
                  </button>
                  <button
                    className={`${s.seg} ${chordMode === "auto" ? s.segOn : ""}`}
                    onClick={() => setChordMode("auto")}
                  >
                    Auto
                  </button>
                  <button
                    className={`${s.seg} ${chordMode === "quiz" ? s.segOn : ""}`}
                    onClick={() => setChordMode("quiz")}
                    disabled={quizDisabled}
                    title={quizDisabled ? "QCM : au moins 4 accords" : undefined}
                  >
                    QCM
                  </button>
                </div>
              </div>

              <Toggle
                label="Annoncer à voix haute"
                sublabel="Lit le nom au début de chaque carte"
                value={tts}
                onChange={setTts}
              />
            </>
          )}
        </div>
      </div>

      <div className={shared.screenFooter}>
        <button onClick={onBack} className={`${shared.footerBtnSecondary} ${s.backBtn}`}>
          Retour
        </button>
        <button
          onClick={onStart}
          disabled={pool.length === 0}
          className={`${shared.footerBtnPrimary} ${s.startBtn}`}
        >
          Commencer
        </button>
      </div>
    </div>
  );
}
