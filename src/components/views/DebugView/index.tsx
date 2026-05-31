import { NOTES, CHROMATIC_NOTES, NOTE_FREQS } from "../../../lib/constants";
import {
  useDebugPitch,
  ATTACK_RMS, RELEASE_RMS, RELEASE_FRAMES, REQUIRED_FRAMES,
} from "../../../hooks/usePitchDetection";
import shared from "../../shared.module.css";
import s from "./index.module.css";

const ALL_NOTES = [...NOTES, ...CHROMATIC_NOTES];
const RMS_BAR_MAX = 0.3;

const SPECTRUM_MIN_HZ = 55;
const SPECTRUM_MAX_HZ = 525;
const LOG_MIN = Math.log2(SPECTRUM_MIN_HZ);
const LOG_MAX = Math.log2(SPECTRUM_MAX_HZ);

function hzToPercent(hz: number): number {
  return ((Math.log2(hz) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
}

interface SpectrumNote {
  key: string;
  freq: number;
  label: string;
  isSharp: boolean;
  percent: number;
}

const SPECTRUM_NOTES: SpectrumNote[] = (() => {
  const out: SpectrumNote[] = [];
  for (const [id, freqs] of Object.entries(NOTE_FREQS)) {
    const def = ALL_NOTES.find((n) => n.id === id);
    if (!def) continue;
    const isSharp = id.includes("_sharp");
    freqs.forEach((f, octaveIdx) => {
      if (f >= SPECTRUM_MIN_HZ && f <= SPECTRUM_MAX_HZ) {
        out.push({
          key: `${id}-${octaveIdx}`,
          freq: f,
          label: def.label,
          isSharp,
          percent: hzToPercent(f),
        });
      }
    });
  }
  return out.sort((a, b) => a.freq - b.freq);
})();

function rmsColor(rms: number): string {
  if (rms < RELEASE_RMS) return "var(--dim)";
  if (rms < ATTACK_RMS) return "var(--accent)";
  return "var(--green)";
}

function corrColor(corr: number): string {
  if (corr < 0.1) return "var(--dim)";
  if (corr < 0.3) return "var(--accent)";
  return "var(--green)";
}

interface DebugViewProps {
  onBack: () => void;
}

export default function DebugView({ onBack }: DebugViewProps) {
  const {
    freq, rms, corr, noteInfo,
    armed, releaseCount, runCount, matchedNoteId,
  } = useDebugPitch(true);
  const rmsPercent = Math.min(rms / RMS_BAR_MAX, 1);
  const attackMarkerPct = (ATTACK_RMS / RMS_BAR_MAX) * 100;
  const releaseMarkerPct = (RELEASE_RMS / RMS_BAR_MAX) * 100;
  const withinThreshold = noteInfo && noteInfo.cents < 50;
  const noteLabel = noteInfo ? ALL_NOTES.find((n) => n.id === noteInfo.noteId)?.label : null;
  const matchedLabel = matchedNoteId ? ALL_NOTES.find((n) => n.id === matchedNoteId)?.label : null;

  return (
    <div className={shared.screen}>
      <div className={shared.screenBody}>
        <div className={shared.screenBodyInner}>
        <div className={s.header}>
          <button onClick={onBack} className={s.backBtn}>← Retour</button>
          <span className={s.headerLabel}>Debug micro</span>
        </div>

        <div className={s.block}>
          <div className={s.blockLabel}>Niveau RMS</div>
          <div className={s.barTrack}>
            <div className={s.barFill} style={{ width: `${rmsPercent * 100}%`, background: rmsColor(rms) }} />
            <div className={s.threshMark} style={{ left: `${releaseMarkerPct}%` }} title={`relâche ${RELEASE_RMS}`} />
            <div className={s.threshMark} style={{ left: `${attackMarkerPct}%` }} title={`attaque ${ATTACK_RMS}`} />
          </div>
          <div className={s.barCaption}>
            {rms.toFixed(4)} · attaque {ATTACK_RMS} · relâche {RELEASE_RMS}
          </div>
        </div>

        <div className={s.block}>
          <div className={s.blockLabel}>Mode session</div>
          <div className={s.gateRow}>
            <span className={`${s.pill} ${armed ? s.pillGreen : s.pillDim}`}>
              {armed ? "Armée" : "En attente d'attaque"}
            </span>
            {armed && releaseCount > 0 && (
              <span className={s.pillCaption}>relâche {releaseCount}/{RELEASE_FRAMES}</span>
            )}
          </div>
          <div className={s.barTrack} style={{ marginTop: 12 }}>
            <div
              className={s.barFill}
              style={{
                width: `${Math.min(runCount / REQUIRED_FRAMES, 1) * 100}%`,
                background: runCount >= REQUIRED_FRAMES ? "var(--green)" : "var(--accent)",
              }}
            />
          </div>
          <div className={s.barCaption}>
            stabilité {runCount}/{REQUIRED_FRAMES}
            {matchedLabel ? ` · MATCH : ${matchedLabel}` : ""}
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
          <div className={s.blockLabel}>Spectre de fréquence</div>
          <div className={s.spectrum}>
            {SPECTRUM_NOTES.map((n) => (
              <div
                key={n.key}
                className={`${s.spectrumTick} ${n.isSharp ? s.spectrumTickSharp : s.spectrumTickNatural}`}
                style={{ left: `${n.percent}%` }}
              >
                {!n.isSharp && <span className={s.spectrumLabel}>{n.label}</span>}
              </div>
            ))}
            {freq && freq >= SPECTRUM_MIN_HZ && freq <= SPECTRUM_MAX_HZ && (
              <div className={s.spectrumNeedle} style={{ left: `${hzToPercent(freq)}%` }} />
            )}
          </div>
          <div className={s.spectrumCaption}>
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
              {noteInfo.cents}¢ d'écart · seuil : 50¢ · {withinThreshold ? "✓ dans le seuil" : "✗ hors seuil"}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
