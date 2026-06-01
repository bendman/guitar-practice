import React from "react";
import { CHORDS, CHORD_ROOTS, CHORD_QUALITIES, CHORD_PRESETS, CHORD_PROGRESSIONS, NOTES, CHROMATIC_NOTES } from "../../../lib/constants";
import type { PracticeItem } from "../../../lib/constants";
import { weightToLevel } from "../../../lib/util";
import { useFormatLabel } from "../../../lib/noteNaming";
import type { Weights } from "../../../lib/stats";
import NotesPicker from "../../ui/NotesPicker";
import Toggle from "../../ui/Toggle";
import ProgressDot from "../../ui/ProgressDot";
import shared from "../../shared.module.css";
import s from "./index.module.css";

interface IntervalControlProps {
  interval: number;
  setInterval: (v: number) => void;
}

function IntervalControl({ interval, setInterval }: IntervalControlProps) {
  return (
    <div className={s.intervalSection}>
      <div className={s.intervalHeader}>
        <span className={shared.eyebrow}>Intervalle</span>
        <span className={s.intervalValue}>{interval.toFixed(1)}s</span>
      </div>
      <div className={s.sliderWrap}>
        <input
          type="range"
          aria-label="Intervalle"
          min="0.5"
          max="10"
          step="0.1"
          value={interval}
          onChange={(e) => setInterval(parseFloat(e.target.value))}
          className={s.slider}
        />
      </div>
      <div className={s.sliderLabels}>
        <span>0.5s</span>
        <span>10.0s</span>
      </div>
    </div>
  );
}

interface ChordsBuilderProps {
  enabled: Record<string, boolean>;
  setEnabled: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  chordPreset: string | null;
  chordProgression: string | null;
  onPreset: (id: string) => void;
  onProgression: (id: string) => void;
  weights?: Weights;
}

function ChordsBuilder({
  enabled, setEnabled, chordPreset, chordProgression, onPreset, onProgression, weights = {},
}: ChordsBuilderProps) {
  const formatLabel = useFormatLabel();
  const totalEnabled = CHORDS.filter((c) => enabled[c.id]).length;

  const clearAll = () => {
    setEnabled((prev) => {
      const next = { ...prev };
      CHORDS.forEach((c) => (next[c.id] = false));
      return next;
    });
  };

  const toggleQuality = (qualityId: string) => {
    setEnabled((prev) => {
      const next = { ...prev };
      const anyOn = CHORD_ROOTS.some((r) => prev[`${r.id}_${qualityId}`]);
      CHORD_ROOTS.forEach((r) => { next[`${r.id}_${qualityId}`] = !anyOn; });
      return next;
    });
  };

  const toggleRoot = (rootId: string) => {
    setEnabled((prev) => {
      const next = { ...prev };
      const anyOn = CHORD_QUALITIES.some((q) => prev[`${rootId}_${q.id}`]);
      CHORD_QUALITIES.forEach((q) => { next[`${rootId}_${q.id}`] = !anyOn; });
      return next;
    });
  };

  const isRootActive = (rootId: string) =>
    CHORD_QUALITIES.some((q) => enabled[`${rootId}_${q.id}`]);

  const toggleCell = (rootId: string, qualityId: string) => {
    const id = `${rootId}_${qualityId}`;
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const rootPreset = (kind: "none" | "naturals" | "all") => {
    if (kind === "none") {
      setEnabled((prev) => {
        const next = { ...prev };
        CHORDS.forEach((c) => (next[c.id] = false));
        return next;
      });
    } else if (kind === "naturals") {
      setEnabled((prev) => {
        const next = { ...prev };
        CHORDS.forEach((c) => { next[c.id] = c.rootId === "mi" || c.rootId === "la"; });
        return next;
      });
    } else if (kind === "all") {
      setEnabled((prev) => {
        const next = { ...prev };
        CHORDS.forEach((c) => (next[c.id] = true));
        return next;
      });
    }
  };

  return (
    <>
      <div className={s.chordHeader}>
        <span className={shared.eyebrow}>Sélection rapide</span>
        <div className={s.presetLinks}>
          <button className={shared.resetLink} onClick={clearAll}>aucune</button>
          <span className={s.presetSep}>|</span>
          <button className={shared.resetLink} onClick={() => rootPreset("all")}>toutes</button>
        </div>
      </div>

      <div className={s.chipRow} style={{ flexWrap: "wrap" }}>
        {CHORD_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onPreset(p.id)}
            data-testid={`preset-${p.id}`}
            className={`${s.chip} ${chordPreset === p.id ? s.chipActive : ""}`}
          >
            {p.label}
          </button>
        ))}
        {CHORD_PROGRESSIONS.map((p) => (
          <button
            key={p.id}
            onClick={() => onProgression(p.id)}
            data-testid={`prog-${p.id}`}
            className={`${s.chip} ${chordProgression === p.id ? s.chipActive : ""}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className={s.subsectionHeader}>
        <span className={shared.eyebrow} data-testid="chord-total">Accords · {totalEnabled} au total</span>
        <div className={s.presetLinks}>
          <button className={shared.resetLink} onClick={() => rootPreset("none")}>aucune</button>
          <span className={s.presetSep}>|</span>
          <button className={shared.resetLink} onClick={() => setEnabled((prev) => {
            const next = { ...prev };
            CHORDS.forEach((c) => { next[c.id] = weightToLevel(weights[c.id]) >= 1; });
            return next;
          })}>en cours</button>
          <span className={s.presetSep}>|</span>
          <button className={shared.resetLink} onClick={() => rootPreset("all")}>toutes</button>
        </div>
      </div>
      <div className={s.matrixScroll}>
        <div
          className={s.matrix}
          style={{ gridTemplateColumns: `48px repeat(${CHORD_QUALITIES.length}, 1fr)` }}
        >
          <div />
          {CHORD_QUALITIES.map((q) => (
            <button key={q.id} className={s.mxColBtn} onClick={() => toggleQuality(q.id)}>
              {q.label}
            </button>
          ))}
          {CHORD_ROOTS.map((r) => (
            <React.Fragment key={r.id}>
              <button
                className={`${s.mxRowBtn} ${isRootActive(r.id) ? s.mxRowBtnOn : ""}`}
                onClick={() => toggleRoot(r.id)}
              >
                {formatLabel(r.label)}
              </button>
              {CHORD_QUALITIES.map((q) => {
                const id = `${r.id}_${q.id}`;
                const on = !!enabled[id];
                const level = weightToLevel(weights[id]);
                return (
                  <button
                    key={q.id}
                    className={`${s.mxCell} ${on ? s.mxCellOn : ""}`}
                    onClick={() => toggleCell(r.id, q.id)}
                    aria-label={`${formatLabel(r.label)} ${q.label}`}
                  >
                    <ProgressDot level={level} size={12} dim={!on} />
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}

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
  chordAuto: boolean;
  setChordAuto: (v: boolean) => void;
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
  chordAuto, setChordAuto,
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

  return (
    <div className={shared.screen} data-testid="config">
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
                    {chordAuto
                      ? "Auto · pratique la vitesse de transition"
                      : "Manuelle · mémorise, évalue Trouvé / Raté"}
                  </div>
                </div>
                <div className={s.segmented}>
                  <button
                    className={`${s.seg} ${!chordAuto ? s.segOn : ""}`}
                    onClick={() => setChordAuto(false)}
                  >
                    Manuelle
                  </button>
                  <button
                    className={`${s.seg} ${chordAuto ? s.segOn : ""}`}
                    onClick={() => setChordAuto(true)}
                  >
                    Auto
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
          data-testid="start"
          className={`${shared.footerBtnPrimary} ${s.startBtn}`}
        >
          Commencer
        </button>
      </div>
    </div>
  );
}
