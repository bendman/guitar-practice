import React from "react";
import { CHORDS, CHORD_ROOTS, CHORD_QUALITIES, CHORD_PRESETS, CHORD_PROGRESSIONS } from "../../../lib/constants";
import type { ChordProgression } from "../../../lib/constants";
import { weightToLevel } from "../../../lib/util";
import { useFormatLabel } from "../../../lib/noteNaming";
import type { Weights } from "../../../lib/stats";
import ProgressDot from "../../ui/ProgressDot";
import shared from "../../shared.module.css";
import s from "./index.module.css";

interface ChordsBuilderProps {
  enabled: Record<string, boolean>;
  setEnabled: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  chordPreset: string | null;
  chordProgression: string | null;
  onPreset: (id: string) => void;
  onProgression: (id: string) => void;
  customPresets: ChordProgression[];
  onCustomPreset: (id: string) => void;
  onRemoveCustomPreset: (id: string) => void;
  onSavePreset: () => void;
  weights?: Weights;
}

export default function ChordsBuilder({
  enabled, setEnabled, chordPreset, chordProgression, onPreset, onProgression,
  customPresets, onCustomPreset, onRemoveCustomPreset, onSavePreset,
  weights = {},
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
            className={`${s.chip} ${chordPreset === p.id ? s.chipActive : ""}`}
          >
            {p.label}
          </button>
        ))}
        {CHORD_PROGRESSIONS.map((p) => (
          <button
            key={p.id}
            onClick={() => onProgression(p.id)}
            className={`${s.chip} ${chordProgression === p.id ? s.chipActive : ""}`}
          >
            {p.label}
          </button>
        ))}
        {customPresets.map((p) => (
          <span key={p.id} className={s.chipGroup}>
            <button
              onClick={() => onCustomPreset(p.id)}
              className={`${s.chip} ${chordProgression === p.id ? s.chipActive : ""}`}
            >
              {p.label}
            </button>
            <button
              onClick={() => onRemoveCustomPreset(p.id)}
              className={s.chipDelete}
              aria-label={`Supprimer le préréglage ${p.label}`}
            >
              ✕
            </button>
          </span>
        ))}
        <button
          onClick={onSavePreset}
          className={`${s.chip} ${s.chipSave}`}
          aria-label="Enregistrer le préréglage actuel"
        >
          + Enregistrer
        </button>
      </div>

      <div className={s.subsectionHeader}>
        <span className={shared.eyebrow}>Accords · {totalEnabled} au total</span>
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
