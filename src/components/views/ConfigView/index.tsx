import React from "react";
import { useTranslation } from "react-i18next";
import { CHORDS, NOTES, CHROMATIC_NOTES } from "../../../lib/constants";
import NotesPicker from "../../ui/NotesPicker";
import Toggle from "../../ui/Toggle";
import IntervalControl from "./IntervalControl";
import ChordsBuilder from "./ChordsBuilder";
import { useSettings } from "../../../AppState";
import { useChordConfig, usePracticePool } from "../../../hooks/useChordConfig";
import shared from "../../shared.module.css";
import s from "./index.module.css";

interface ConfigViewProps {
  mode: "notes" | "chords";
  onRemoveCustomPreset: (id: string) => void;
  onSavePreset: () => void;
  onStart: () => void;
  onBack: () => void;
}

export default function ConfigView({
  mode,
  onRemoveCustomPreset,
  onSavePreset,
  onStart,
  onBack,
}: ConfigViewProps) {
  const { t } = useTranslation();
  const {
    intervalSecs: interval,
    setIntervalSecs: setInterval,
    enabled,
    tts,
    setTts,
    listening,
    setListening,
    chordMode,
    setChordMode,
    showChordNotes,
    setShowChordNotes,
  } = useSettings();
  const { setEnabledManual: setEnabled } = useChordConfig();
  const { activePool: pool } = usePracticePool(mode);

  const isNotesMode = mode !== "chords";
  const title = isNotesMode ? t("config.titleNotes") : t("config.titleChords");
  const subtitle = isNotesMode ? t("config.subtitleNotes") : t("config.subtitleChords");

  const noteCount = [...NOTES, ...CHROMATIC_NOTES].filter((n) => enabled[n.id]).length;
  const chordCount = CHORDS.filter((c) => enabled[c.id]).length;
  const quizDisabled = chordCount < 4;

  React.useEffect(() => {
    if (quizDisabled && chordMode === "quiz") setChordMode("manual");
  }, [quizDisabled, chordMode, setChordMode]);

  return (
    <div className={shared.screen}>
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
                label={t("config.ttsLabel")}
                sublabel={t("config.ttsSublabel")}
                value={tts}
                onChange={setTts}
              />
              <Toggle
                label={t("config.micLabel")}
                sublabel={t("config.micSublabel")}
                value={listening}
                onChange={setListening}
              />
            </>
          ) : (
            <>
              <ChordsBuilder
                onRemoveCustomPreset={onRemoveCustomPreset}
                onSavePreset={onSavePreset}
              />

              <div className={s.toggleRow}>
                <div>
                  <div className={s.toggleLabel}>{t("config.progression")}</div>
                  <div className={s.toggleSublabel}>
                    {chordMode === "auto"
                      ? t("config.modeAutoDesc")
                      : chordMode === "quiz"
                        ? t("config.modeQuizDesc")
                        : t("config.modeManualDesc")}
                  </div>
                </div>
                <div className={s.segmented}>
                  <button
                    className={`${s.seg} ${chordMode === "manual" ? s.segOn : ""}`}
                    onClick={() => setChordMode("manual")}
                  >
                    {t("config.modeManual")}
                  </button>
                  <button
                    className={`${s.seg} ${chordMode === "auto" ? s.segOn : ""}`}
                    onClick={() => setChordMode("auto")}
                  >
                    {t("config.modeAuto")}
                  </button>
                  <button
                    className={`${s.seg} ${chordMode === "quiz" ? s.segOn : ""}`}
                    onClick={() => setChordMode("quiz")}
                    disabled={quizDisabled}
                    title={quizDisabled ? t("config.quizMinChords") : undefined}
                  >
                    {t("config.modeQuiz")}
                  </button>
                </div>
              </div>

              <Toggle
                label={t("config.showNotesLabel")}
                sublabel={t("config.showNotesSublabel")}
                value={showChordNotes}
                onChange={setShowChordNotes}
              />
              <Toggle
                label={t("config.ttsLabel")}
                sublabel={t("config.ttsSublabel")}
                value={tts}
                onChange={setTts}
              />
            </>
          )}
        </div>
      </div>

      <div className={shared.screenFooter}>
        <button onClick={onBack} className={`${shared.footerBtnSecondary} ${s.backBtn}`}>
          {t("common.back")}
        </button>
        <button
          onClick={onStart}
          disabled={pool.length === 0}
          className={`${shared.footerBtnPrimary} ${s.startBtn}`}
        >
          {t("common.start")}
        </button>
      </div>
    </div>
  );
}
