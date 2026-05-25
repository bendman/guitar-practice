import { NOTES, CHROMATIC_NOTES } from "../constants";
import { useDebugPitch } from "../usePitchDetection";
import s from "./DebugView.module.css";

const ALL_NOTES = [...NOTES, ...CHROMATIC_NOTES];

function rmsColor(rms) {
  if (rms < 0.01) return "var(--dim)";
  if (rms < 0.05) return "var(--accent)";
  return "var(--green)";
}

function corrColor(corr) {
  if (corr < 0.1) return "var(--dim)";
  if (corr < 0.3) return "var(--accent)";
  return "var(--green)";
}

export default function DebugView({ onBack }) {
  const { freq, rms, corr, noteInfo } = useDebugPitch(true);
  const rmsPercent = Math.min(rms / 0.3, 1);
  const withinThreshold = noteInfo && noteInfo.cents < 50;
  const noteLabel = noteInfo ? ALL_NOTES.find((n) => n.id === noteInfo.noteId)?.label : null;

  return (
    <div className={s.root}>
      <div>
        <div className={s.header}>
          <button onClick={onBack} className={s.backBtn}>← Retour</button>
          <span className={s.headerLabel}>Debug micro</span>
        </div>

        <div className={s.block}>
          <div className={s.blockLabel}>Niveau RMS</div>
          <div className={s.barTrack}>
            <div className={s.barFill} style={{ width: `${rmsPercent * 100}%`, background: rmsColor(rms) }} />
          </div>
          <div className={s.barCaption}>
            {rms.toFixed(4)}{rms < 0.01 ? " — trop silencieux" : ""}
          </div>
        </div>

        <div className={s.block}>
          <div className={s.blockLabel}>Corrélation (seuil 0.10)</div>
          <div className={s.barTrack}>
            <div className={s.barFill} style={{ width: `${Math.min(corr, 1) * 100}%`, background: corrColor(corr) }} />
          </div>
          <div className={s.barCaption}>
            {corr.toFixed(3)}{corr < 0.1 ? " — sous le seuil" : " — détecté"}
          </div>
        </div>

        <div className={s.block}>
          <div className={s.bigLabel}>Fréquence détectée</div>
          <div className={`${s.bigValue} ${freq ? s.bigValueText : s.bigValueMuted}`}>
            {freq ? `${freq.toFixed(1)} Hz` : "—"}
          </div>
        </div>

        <div className={s.block}>
          <div className={s.bigLabel}>Note la plus proche</div>
          <div className={s.noteRow}>
            <div className={`${s.bigValue} ${!noteInfo ? s.bigValueMuted : withinThreshold ? s.bigValueGreen : s.bigValueAccent}`}>
              {noteLabel || "—"}
            </div>
            {noteInfo && (
              <div className={`${s.centsBadge} ${withinThreshold ? s.centsBadgeGreen : s.centsBadgeAccent}`}>
                {noteInfo.signedCents > 0 ? "+" : ""}{noteInfo.signedCents}¢
              </div>
            )}
          </div>
          {noteInfo && (
            <div className={s.noteCaption}>
              {noteInfo.cents}¢ d'écart · seuil : 50¢ · {withinThreshold ? "✓ dans le seuil" : "✗ hors seuil"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
