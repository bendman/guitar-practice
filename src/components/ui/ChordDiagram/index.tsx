import { useRef, useState } from "react";
import type { Voicing } from "../../../lib/constants";
import s from "./index.module.css";

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
  /** When set, overlay invisible hit-zones that let the user edit the shape. */
  editable?: boolean;
  /** Tap an empty cell: set this string to the given absolute fret. */
  onCellTap?: (stringIndex: number, absoluteFret: number) => void;
  /** Tap the o/x marker above an unfretted string: toggle open/muted. */
  onMarkerTap?: (stringIndex: number) => void;
  /** Tap an existing fretted dot: remove it (back to open). */
  onDotTap?: (stringIndex: number) => void;
  /** Drag between two cells on the same fret: barre across the spanned strings. */
  onBarre?: (fromString: number, toString: number, absoluteFret: number) => void;
}

const STRING_LABEL = (i: number) => `corde ${i + 1}`;

export default function ChordDiagram({
  fingering,
  size = 120,
  fretCount = 4,
  className = "",
  editable = false,
  onCellTap,
  onMarkerTap,
  onDotTap,
  onBarre,
}: ChordDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragStart = useRef<{ i: number; fret: number } | null>(null);
  // Live preview of the pending gesture (ghost dot or barre) shown while the
  // pointer is held, before release commits it.
  const [preview, setPreview] = useState<{ startI: number; startFret: number; curI: number; curFret: number } | null>(null);

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

  // Map a pointer event to the cell under it (viewBox coordinates), so drag
  // works the same for mouse and touch (touch's implicit pointer capture means
  // pointerup reports the start element, so we hit-test by position instead).
  const cellFromEvent = (e: React.PointerEvent): { i: number; fret: number; header: boolean } | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const loc = pt.matrixTransform(ctm.inverse());
    const i = Math.round((loc.x - gridLeft) / STRING_SPACING);
    if (i < 0 || i >= STRINGS) return null;
    if (loc.y < gridTop) return { i, fret: 0, header: true };
    const row = Math.floor((loc.y - gridTop) / FRET_SPACING) + 1;
    if (row < 1 || row > fretCount) return null;
    return { i, fret: baseFret + row - 1, header: false };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!editable) return;
    const c = cellFromEvent(e);
    if (c && !c.header) {
      dragStart.current = { i: c.i, fret: c.fret };
      setPreview({ startI: c.i, startFret: c.fret, curI: c.i, curFret: c.fret });
    } else {
      dragStart.current = null;
      setPreview(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!editable || !dragStart.current) return;
    const c = cellFromEvent(e);
    const start = dragStart.current;
    setPreview(
      c && !c.header
        ? { startI: start.i, startFret: start.fret, curI: c.i, curFret: c.fret }
        : { startI: start.i, startFret: start.fret, curI: start.i, curFret: start.fret },
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!editable) return;
    const start = dragStart.current;
    dragStart.current = null;
    setPreview(null);
    if (!start) return;
    const c = cellFromEvent(e);
    if (!c || c.header) return;
    if (c.i === start.i) return; // same cell → a tap, handled by the rect's onClick
    if (c.fret !== start.fret) return; // a barre must sit on a single fret
    onBarre?.(Math.min(start.i, c.i), Math.max(start.i, c.i), c.fret);
  };

  const handlePointerCancel = () => {
    dragStart.current = null;
    setPreview(null);
  };

  return (
    <svg
      ref={svgRef}
      className={`${s.root} ${editable ? s.editable : ""} ${className}`}
      width={size}
      height={(size * vbH) / vbW}
      viewBox={`0 0 ${vbW} ${vbH}`}
      role={editable ? "group" : "img"}
      onPointerDown={editable ? handlePointerDown : undefined}
      onPointerMove={editable ? handlePointerMove : undefined}
      onPointerUp={editable ? handlePointerUp : undefined}
      onPointerCancel={editable ? handlePointerCancel : undefined}
      onPointerLeave={editable ? handlePointerCancel : undefined}
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
            role={editable ? "img" : undefined}
            aria-label={editable ? `barré case ${b.fret}` : undefined}
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

      {editable && preview && (() => {
        const { startI, startFret, curI, curFret } = preview;
        // Dragged onto another string at the same fret → preview a barre.
        if (curI !== startI && curFret === startFret) {
          const row = startFret - baseFret + 1;
          if (row < 1 || row > fretCount) return null;
          const a = Math.min(startI, curI);
          const z = Math.max(startI, curI);
          return (
            <line
              className={`${s.barre} ${s.ghost}`}
              x1={stringX(a)}
              y1={cellY(row)}
              x2={stringX(z)}
              y2={cellY(row)}
              strokeWidth={DOT_R * 2}
              strokeLinecap="round"
            />
          );
        }
        // Held on a single cell → preview a finger there.
        if (curI === startI && curFret === startFret) {
          const row = curFret - baseFret + 1;
          if (row < 1 || row > fretCount) return null;
          return <circle className={`${s.dot} ${s.ghost}`} cx={stringX(curI)} cy={cellY(row)} r={DOT_R} />;
        }
        return null;
      })()}

      {editable && (
        <>
          {Array.from({ length: STRINGS }, (_, i) => {
            const onTap = () => onMarkerTap?.(i);
            return (
              <rect
                key={`hm${i}`}
                className={s.hitZone}
                role="button"
                tabIndex={0}
                aria-label={`${STRING_LABEL(i)} : ouverte ou étouffée`}
                x={stringX(i) - STRING_SPACING / 2}
                y={0}
                width={STRING_SPACING}
                height={HEADER}
                onClick={onTap}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap(); }
                }}
              />
            );
          })}
          {Array.from({ length: STRINGS }, (_, i) =>
            Array.from({ length: fretCount }, (_, r) => {
              const row = r + 1;
              const absoluteFret = baseFret + row - 1;
              const isDot = frets[i] === absoluteFret;
              const onTap = () => (isDot ? onDotTap?.(i) : onCellTap?.(i, absoluteFret));
              return (
                <rect
                  key={`hc${i}-${row}`}
                  className={s.hitZone}
                  role="button"
                  tabIndex={0}
                  aria-label={isDot ? `retirer la note ${STRING_LABEL(i)}` : `${STRING_LABEL(i)} case ${absoluteFret}`}
                  x={stringX(i) - STRING_SPACING / 2}
                  y={fretLineY(row - 1)}
                  width={STRING_SPACING}
                  height={FRET_SPACING}
                  onClick={onTap}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap(); }
                  }}
                />
              );
            }),
          )}
        </>
      )}
    </svg>
  );
}
