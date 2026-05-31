import type { Voicing } from "../constants";
import s from "./ChordDiagram.module.css";

const STRINGS = 6;
const STRING_SPACING = 18;
const FRET_SPACING = 27.5;
const MARGIN_LEFT = 30;
const MARGIN_RIGHT = 30;
const HEADER = 26;
const BOTTOM_PAD = 8;
const DOT_R = 7;
const LINE_W = 1.5;

interface ChordDiagramProps {
  fingering: Voicing | null | undefined;
  size?: number;
  fretCount?: number;
  className?: string;
}

export default function ChordDiagram({
  fingering,
  size = 120,
  fretCount = 4,
  className = "",
}: ChordDiagramProps) {
  if (!fingering) return null;
  const { frets = [], baseFret = 1, barres = [] } = fingering;

  const gridLeft = MARGIN_LEFT;
  const gridTop = HEADER;
  const gridRight = gridLeft + (STRINGS - 1) * STRING_SPACING;
  const gridBottom = gridTop + fretCount * FRET_SPACING;
  const vbW = gridRight + MARGIN_RIGHT;
  const vbH = gridBottom + BOTTOM_PAD;

  const stringX = (i: number) => gridLeft + i * STRING_SPACING;
  const fretLineY = (r: number) => gridTop + r * FRET_SPACING;
  const cellY = (row: number) => gridTop + (row - 0.5) * FRET_SPACING;
  const showNut = baseFret === 1;

  const coveredByBarre = (i: number, fret: number) =>
    barres.some(
      (b) =>
        b.fret === fret &&
        i >= Math.min(b.fromString, b.toString) &&
        i <= Math.max(b.fromString, b.toString),
    );

  return (
    <svg
      className={`${s.root} ${className}`}
      width={size}
      height={(size * vbH) / vbW}
      viewBox={`0 0 ${vbW} ${vbH}`}
      role="img"
    >
      {!showNut && (
        <text
          className={s.fretLabel}
          x={gridLeft - 10}
          y={cellY(1)}
          textAnchor="end"
          dominantBaseline="central"
        >
          {baseFret}fr
        </text>
      )}

      {Array.from({ length: fretCount + 1 }, (_, r) => (
        <line
          key={`f${r}`}
          className={s.fret}
          x1={gridLeft - LINE_W / 2}
          y1={fretLineY(r)}
          x2={gridRight + LINE_W / 2}
          y2={fretLineY(r)}
          strokeWidth={r === 0 && showNut ? 8 : LINE_W}
        />
      ))}

      {Array.from({ length: STRINGS }, (_, i) => (
        <line
          key={`s${i}`}
          className={s.string}
          x1={stringX(i)}
          y1={gridTop}
          x2={stringX(i)}
          y2={gridBottom}
          strokeWidth={LINE_W}
        />
      ))}

      {Array.from({ length: STRINGS }, (_, i) => {
        const f = frets[i];
        if (f !== 0 && f !== -1) return null;
        return (
          <text
            key={`m${i}`}
            className={f === 0 ? s.markerOpen : s.markerMuted}
            x={stringX(i)}
            y={HEADER / 2}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {f === 0 ? "○" : "✕"}
          </text>
        );
      })}

      {barres.map((b, idx) => {
        const row = b.fret - baseFret + 1;
        if (row < 1 || row > fretCount) return null;
        const a = Math.min(b.fromString, b.toString);
        const z = Math.max(b.fromString, b.toString);
        return (
          <line
            key={`b${idx}`}
            className={s.barre}
            x1={stringX(a)}
            y1={cellY(row)}
            x2={stringX(z)}
            y2={cellY(row)}
            strokeWidth={DOT_R * 2}
            strokeLinecap="round"
          />
        );
      })}

      {frets.map((f, i) => {
        if (!f || f < 1) return null;
        const row = f - baseFret + 1;
        if (row < 1 || row > fretCount) return null;
        if (coveredByBarre(i, f)) return null;
        return (
          <circle
            key={`d${i}`}
            className={s.dot}
            cx={stringX(i)}
            cy={cellY(row)}
            r={DOT_R}
          />
        );
      })}
    </svg>
  );
}
