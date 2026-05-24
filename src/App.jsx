import { useState, useEffect, useRef } from "react";

const FONT = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace";
const BG = "#1a1816";
const ACCENT = "#d4a574";
const TEXT = "#e8e4df";
const MUTED = "#8a8580";
const DIM = "#5a5550";
const GREEN = "#6ecf72";
const RED = "#cf6e6e";
const CORRECT = "#FFE566";

const NOTES = [
  { id: "do", label: "Do", type: "note" },
  { id: "re", label: "Ré", type: "note" },
  { id: "mi", label: "Mi", type: "note" },
  { id: "fa", label: "Fa", type: "note" },
  { id: "sol", label: "Sol", type: "note" },
  { id: "la", label: "La", type: "note" },
  { id: "si", label: "Si", type: "note" },
];

const CHORDS = [
  { id: "mi_maj", label: "Mi Majeur", speak: "«Mi» Majeur", type: "chord" },
  { id: "mi_min", label: "Mi Mineur", speak: "«Mi» Mineur", type: "chord" },
  { id: "mi_dim", label: "Mi Diminué", speak: "«Mi» Diminué", type: "chord" },
  { id: "la_maj", label: "La Majeur", speak: "«La» Majeur", type: "chord" },
  { id: "la_min", label: "La Mineur", speak: "«La» Mineur", type: "chord" },
  { id: "la_dim", label: "La Diminué", speak: "«La» Diminué", type: "chord" },
];

const ALL = [...NOTES, ...CHORDS];

// Note frequencies for all guitar-relevant octaves (C2–C6)
// Maps note id -> array of frequencies across octaves
const NOTE_FREQS = {
  do:  [65.41, 130.81, 261.63, 523.25, 1046.50],
  re:  [73.42, 146.83, 293.66, 587.33, 1174.66],
  mi:  [82.41, 164.81, 329.63, 659.26, 1318.51],
  fa:  [87.31, 174.61, 349.23, 698.46, 1396.91],
  sol: [98.00, 196.00, 392.00, 783.99, 1567.98],
  la:  [110.00, 220.00, 440.00, 880.00, 1760.00],
  si:  [123.47, 246.94, 493.88, 987.77, 1975.53],
};

function freqToNoteId(freq) {
  if (freq < 60 || freq > 2000) return null;
  let closest = null;
  let minDist = Infinity;
  for (const [id, freqs] of Object.entries(NOTE_FREQS)) {
    for (const f of freqs) {
      const cents = Math.abs(1200 * Math.log2(freq / f));
      if (cents < minDist) {
        minDist = cents;
        closest = id;
      }
    }
  }
  return minDist < 50 ? closest : null; // within 50 cents
}

// Returns { noteId, cents, signedCents } for the nearest note regardless of threshold
function freqToNoteInfo(freq) {
  if (freq < 60 || freq > 2000) return null;
  let closest = null;
  let closestFreq = null;
  let minDist = Infinity;
  for (const [id, freqs] of Object.entries(NOTE_FREQS)) {
    for (const f of freqs) {
      const cents = Math.abs(1200 * Math.log2(freq / f));
      if (cents < minDist) {
        minDist = cents;
        closest = id;
        closestFreq = f;
      }
    }
  }
  if (!closest) return null;
  const signedCents = Math.round(1200 * Math.log2(freq / closestFreq));
  return { noteId: closest, cents: Math.round(minDist), signedCents };
}

// Autocorrelation pitch detection — returns { freq, rms }; freq is null if too quiet or no clear pitch
function detectPitch(buffer, sampleRate) {
  const n = buffer.length;
  let rms = 0;
  for (let i = 0; i < n; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / n);
  if (rms < 0.01) return { freq: null, rms };

  const minPeriod = Math.floor(sampleRate / 2000);
  const maxPeriod = Math.floor(sampleRate / 60);
  let bestCorr = 0;
  let bestPeriod = 0;
  // Normalize by RMS² so the threshold is relative to signal power (range [-1, 1])
  const normFactor = rms * rms;

  for (let period = minPeriod; period <= maxPeriod; period++) {
    let corr = 0;
    for (let i = 0; i < n - period; i++) {
      corr += buffer[i] * buffer[i + period];
    }
    corr /= (n - period) * normFactor;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestPeriod = period;
    }
  }

  // Parabolic interpolation for sub-sample accuracy (scale-invariant, normalization doesn't matter)
  const prev = bestPeriod > minPeriod ? autocorrAt(buffer, bestPeriod - 1) : 0;
  const curr = autocorrAt(buffer, bestPeriod);
  const next = bestPeriod < maxPeriod ? autocorrAt(buffer, bestPeriod + 1) : 0;
  const shift = (prev - next) / (2 * (prev - 2 * curr + next)) || 0;
  const refinedPeriod = bestPeriod + shift;

  const freq = bestCorr < 0.1 ? null : sampleRate / refinedPeriod;
  return { freq, rms, corr: bestCorr };
}

function autocorrAt(buffer, period) {
  let corr = 0;
  const n = buffer.length;
  for (let i = 0; i < n - period; i++) corr += buffer[i] * buffer[i + period];
  return corr / (n - period);
}

function pickRandom(items, lastId) {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  let pick;
  do {
    pick = items[Math.floor(Math.random() * items.length)];
  } while (pick.id === lastId);
  return pick;
}

function sayAloud(item) {
  speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(item.speak || item.label);
  utt.lang = "fr-FR";
  speechSynthesis.speak(utt);
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s_ = Math.floor(secs % 60);
  return `${m}:${s_.toString().padStart(2, "0")}`;
}

// --- Pitch detection hook ---
function usePitchDetection(active) {
  const [detectedNote, setDetectedNote] = useState(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) {
      // Cleanup
      cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      audioCtxRef.current = null;
      analyserRef.current = null;
      streamRef.current = null;
      setDetectedNote(null);
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 4096;
        source.connect(analyser);
        analyserRef.current = analyser;

        const buffer = new Float32Array(analyser.fftSize);

        const loop = () => {
          if (cancelled) return;
          analyser.getFloatTimeDomainData(buffer);
          const { freq } = detectPitch(buffer, ctx.sampleRate);
          const noteId = freq ? freqToNoteId(freq) : null;
          setDetectedNote(noteId);
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        console.error("Mic access failed:", err);
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  return detectedNote;
}

// --- Debug pitch hook (dev only) ---
function useDebugPitch(active) {
  const [data, setData] = useState({ freq: null, rms: 0, corr: 0, noteInfo: null });
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      audioCtxRef.current = null;
      streamRef.current = null;
      setData({ freq: null, rms: 0, noteInfo: null });
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 4096;
        source.connect(analyser);
        const buffer = new Float32Array(analyser.fftSize);

        const loop = () => {
          if (cancelled) return;
          analyser.getFloatTimeDomainData(buffer);
          const { freq, rms, corr } = detectPitch(buffer, ctx.sampleRate);
          setData({ freq, rms, corr, noteInfo: freq ? freqToNoteInfo(freq) : null });
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        console.error("Mic access failed:", err);
      }
    }
    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  return data;
}

function DebugView({ onBack }) {
  const { freq, rms, corr, noteInfo } = useDebugPitch(true);
  const rmsPercent = Math.min(rms / 0.3, 1);
  const withinThreshold = noteInfo && noteInfo.cents < 50;
  const noteLabel = noteInfo ? NOTES.find((n) => n.id === noteInfo.noteId)?.label : null;

  return (
    <div style={{ ...s.configRoot, justifyContent: "flex-start", paddingTop: 40 }}>
      <div style={s.configInner}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <button onClick={onBack} style={{ ...s.resetBtn, fontSize: 13, color: MUTED }}>← Retour</button>
          <span style={{ fontSize: 11, color: DIM, textTransform: "uppercase", letterSpacing: "1.5px" }}>Debug micro</span>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>Niveau RMS</div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${rmsPercent * 100}%`,
              background: rms < 0.01 ? DIM : rms < 0.05 ? ACCENT : GREEN,
              borderRadius: 4,
              transition: "width 0.05s ease",
            }} />
          </div>
          <div style={{ fontSize: 11, color: DIM, marginTop: 4 }}>
            {rms.toFixed(4)}{rms < 0.01 ? " — trop silencieux" : ""}
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>Corrélation (seuil 0.10)</div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min(corr, 1) * 100}%`,
              background: corr < 0.1 ? DIM : corr < 0.3 ? ACCENT : GREEN,
              borderRadius: 4,
              transition: "width 0.05s ease",
            }} />
          </div>
          <div style={{ fontSize: 11, color: DIM, marginTop: 4 }}>
            {corr.toFixed(3)}{corr < 0.1 ? " — sous le seuil" : " — détecté"}
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12 }}>Fréquence détectée</div>
          <div style={{ fontSize: 56, fontWeight: 700, color: freq ? TEXT : DIM, letterSpacing: "-1px", lineHeight: 1 }}>
            {freq ? `${freq.toFixed(1)} Hz` : "—"}
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12 }}>Note la plus proche</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1, color: !noteInfo ? DIM : withinThreshold ? GREEN : ACCENT }}>
              {noteLabel || "—"}
            </div>
            {noteInfo && (
              <div style={{ fontSize: 18, color: withinThreshold ? GREEN : ACCENT, fontWeight: 600 }}>
                {noteInfo.signedCents > 0 ? "+" : ""}{noteInfo.signedCents}¢
              </div>
            )}
          </div>
          {noteInfo && (
            <div style={{ fontSize: 11, color: DIM, marginTop: 8 }}>
              {noteInfo.cents}¢ d'écart · seuil : 50¢ · {withinThreshold ? "✓ dans le seuil" : "✗ hors seuil"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuitarPractice() {
  const [interval, setInterval_] = useState(2);
  const [enabled, setEnabled] = useState(() =>
    Object.fromEntries(ALL.map((item) => [item.id, true]))
  );
  const [inSession, setInSession] = useState(false);
  const [paused, setPaused] = useState(false);
  const [current, setCurrent] = useState(null);
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(0);
  const [tts, setTts] = useState(false);
  const [practiceTime, setPracticeTime] = useState(0);
  const [listening, setListening] = useState(false);
  const [hitStatus, setHitStatus] = useState(null); // null | "correct" | "wrong"
  const [inDebug, setInDebug] = useState(false);

  const lastIdRef = useRef(null);
  const practiceTimeRef = useRef(0);
  const hitForCurrentRef = useRef(false);
  const refs = useRef({ interval, tts, pool: [] });
  refs.current = {
    interval,
    tts,
    pool: ALL.filter((item) => enabled[item.id]),
  };

  const pool = refs.current.pool;
  const micActive = listening && inSession && !paused;
  const detectedNote = usePitchDetection(micActive);

  // Check detected note against current target
  useEffect(() => {
    if (!micActive || !current || current.type !== "note" || hitForCurrentRef.current) return;
    if (detectedNote === null) return;

    if (detectedNote === current.id) {
      setHitStatus("correct");
      hitForCurrentRef.current = true;
    } else {
      setHitStatus("wrong");
    }
  }, [detectedNote, current, micActive]);

  // Reset hit status when current note changes
  useEffect(() => {
    hitForCurrentRef.current = false;
    if (!listening) setHitStatus(null);
    else setHitStatus(null);
  }, [current, listening]);

  // Session timer + progress animation + practice clock
  useEffect(() => {
    if (!inSession || paused) return;

    let timerId;
    let rafId;
    let start = performance.now();
    let lastFrame = performance.now();

    const advance = () => {
      const next = pickRandom(refs.current.pool, lastIdRef.current);
      if (next) {
        lastIdRef.current = next.id;
        if (refs.current.tts) sayAloud(next);
        setTimeout(() => {
          setCurrent(next);
          setCount((c) => c + 1);
          start = performance.now();
        }, 200);
      }
      timerId = setTimeout(advance, refs.current.interval * 1000);
    };

    timerId = setTimeout(advance, interval * 1000);

    const animate = () => {
      const now = performance.now();
      const pct = Math.min((now - start) / (refs.current.interval * 1000), 1);
      setProgress(pct);
      practiceTimeRef.current += (now - lastFrame) / 1000;
      setPracticeTime(practiceTimeRef.current);
      lastFrame = now;
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      clearTimeout(timerId);
      cancelAnimationFrame(rafId);
    };
  }, [inSession, paused, interval]);

  const startSession = () => {
    if (pool.length === 0) return;
    const first = pickRandom(pool, null);
    lastIdRef.current = first?.id;
    setCurrent(first);
    setCount(1);
    setProgress(0);
    setHitStatus(null);
    setInSession(true);
    setPaused(false);
    if (tts && first) sayAloud(first);
  };

  const stopSession = () => {
    setInSession(false);
    setPaused(false);
    setCurrent(null);
    setProgress(0);
    setHitStatus(null);
    speechSynthesis.cancel();
  };

  const toggleGroup = (group) => {
    const allOn = group.every((item) => enabled[item.id]);
    setEnabled((prev) => {
      const next = { ...prev };
      group.forEach((item) => (next[item.id] = !allOn));
      return next;
    });
  };

  // Keyboard controls during session
  useEffect(() => {
    if (!inSession) return;
    const handler = (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setInterval_((v) => Math.min(v + 0.1, 5));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setInterval_((v) => Math.max(v - 0.1, 0.5));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inSession]);

  // Determine note display color based on detection
  const noteColor = "#ffffff";

  if (import.meta.env.DEV && inDebug) {
    return <DebugView onBack={() => setInDebug(false)} />;
  }

  // --- SESSION VIEW ---
  if (inSession) {
    const isCorrect = listening && hitStatus === "correct" && !paused;
    return (
      <div style={s.sessionRoot}>
        <style>{`
          @keyframes correct-pop {
            0%   { transform: scale(0.4); opacity: 0; }
            55%  { transform: scale(1.12); opacity: 1; }
            100% { transform: scale(1);   opacity: 1; }
          }
          @keyframes correct-glow {
            0%   { opacity: 0; }
            25%  { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}</style>
        <div
          style={{
            ...s.progressBg,
            width: `${progress * 100}%`,
            opacity: paused ? 0.15 : 1,
          }}
        />
        {isCorrect && (
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            background: `radial-gradient(ellipse at center, ${CORRECT}28 0%, transparent 65%)`,
            animation: "correct-glow 0.35s ease-out forwards",
          }} />
        )}
        <div style={s.sessionCenter}>
          <div style={s.practiceTimerSession}>{formatTime(practiceTime)}</div>
          <div style={s.countBadge}>#{count}</div>
          <div style={{
            ...s.noteDisplay,
            opacity: paused ? 0.2 : 1,
            color: paused ? "#ffffff" : noteColor,
            textShadow: `0 2px 20px ${ACCENT}4D`,
          }}>
            {current?.label || "—"}
          </div>
          {isCorrect ? (
            <div style={{
              fontSize: 120,
              fontWeight: 700,
              lineHeight: 1,
              color: CORRECT,
              textShadow: `0 0 30px ${CORRECT}BB, 0 0 70px ${CORRECT}55`,
              animation: "correct-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
              marginTop: 12,
            }}>✓</div>
          ) : (
            <>
              <div style={{ ...s.typeBadge, opacity: paused ? 0.2 : 1 }}>
                {current?.type === "chord" ? "Accord" : "Note"}
              </div>
              {listening && current?.type === "note" && !paused && (
                <div style={s.detectionHint}>
                  {detectedNote
                    ? NOTES.find((n) => n.id === detectedNote)?.label || "?"
                    : "🎤 …"}
                </div>
              )}
              {listening && current?.type === "chord" && !paused && (
                <div style={{ ...s.detectionHint, color: DIM }}>
                  détection notes uniquement
                </div>
              )}
            </>
          )}
          {paused && <div style={s.pauseOverlay}>⏸ Pause</div>}
        </div>
        <div style={s.sessionControls}>
          <button onClick={() => setPaused((p) => !p)} style={s.btnPause}>
            {paused ? "▶ Reprendre" : "⏸ Pause"}
          </button>
          <button onClick={stopSession} style={s.btnStop}>
            ✕ Arrêter
          </button>
        </div>
        <div style={s.keyHints}>
          <span>▲▼ intervalle ({interval.toFixed(1)}s)</span>
        </div>
      </div>
    );
  }

  // --- CONFIG VIEW ---
  const renderGroup = (label, group) => (
    <div style={s.section}>
      <div style={s.sectionHeader}>
        <span style={s.sectionLabel}>{label}</span>
        <button onClick={() => toggleGroup(group)} style={s.toggleAllBtn}>
          {group.every((item) => enabled[item.id])
            ? "Tout désélectionner"
            : "Tout sélectionner"}
        </button>
      </div>
      <div style={s.chipGrid}>
        {group.map((item) => (
          <button
            key={item.id}
            onClick={() => setEnabled((p) => ({ ...p, [item.id]: !p[item.id] }))}
            style={{
              ...s.chip,
              ...(enabled[item.id] ? s.chipOn : s.chipOff),
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderToggle = (label, value, onChange) => (
    <div style={s.ttsRow}>
      <span style={s.ttsLabel}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{ ...s.ttsToggle, background: value ? ACCENT : "rgba(255,255,255,0.1)" }}
      >
        <div style={{ ...s.ttsKnob, left: value ? 23 : 3 }} />
      </button>
    </div>
  );

  return (
    <div style={s.configRoot}>
      <div style={s.configInner}>
        <h1 style={s.title}>Exercice Guitare</h1>
        <p style={s.subtitle}>Trouve les notes et accords sur le manche</p>

        <div style={s.section}>
          <label style={s.sectionLabel}>
            Intervalle :{" "}
            <span style={s.intervalValue}>{interval.toFixed(1)}s</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={interval}
            onChange={(e) => setInterval_(parseFloat(e.target.value))}
            style={s.slider}
          />
          <div style={s.sliderLabels}>
            <span>0.5s</span>
            <span>5.0s</span>
          </div>
        </div>

        {renderGroup("Notes", NOTES)}
        {renderGroup("Accords", CHORDS)}

        {renderToggle("Annoncer à voix haute", tts, setTts)}
        {renderToggle("Détecter les notes (micro)", listening, setListening)}
        {listening && (
          <div style={s.listenHint}>
            Notes uniquement · le texte change de couleur quand la bonne note est jouée
          </div>
        )}

        <button
          onClick={startSession}
          disabled={pool.length === 0}
          style={{
            ...s.startBtn,
            ...(pool.length === 0 ? s.startBtnDisabled : {}),
          }}
        >
          {pool.length === 0
            ? "Sélectionne au moins un élément"
            : `Commencer (${pool.length} élément${pool.length > 1 ? "s" : ""})`}
        </button>

        {practiceTime > 0 && (
          <div style={s.practiceTimeBox}>
            <div style={s.practiceTimeValue}>{formatTime(practiceTime)}</div>
            <div style={s.practiceTimeSubRow}>
              <span style={s.practiceTimeLabel}>Temps de pratique</span>
              <button
                onClick={() => { setPracticeTime(0); practiceTimeRef.current = 0; }}
                style={s.resetBtn}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}

        {import.meta.env.DEV && (
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <button onClick={() => setInDebug(true)} style={{ ...s.resetBtn, fontSize: 11, color: DIM }}>
              debug micro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const base = { fontFamily: FONT, letterSpacing: "0.3px" };
const fullPage = {
  ...base,
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  background: BG,
  color: TEXT,
};
const btn = {
  ...base,
  fontSize: 14,
  fontWeight: 600,
  padding: "12px 28px",
  borderRadius: 6,
  cursor: "pointer",
};

const s = {
  configRoot: { ...fullPage, alignItems: "center", justifyContent: "center", padding: "32px 20px", boxSizing: "border-box" },
  configInner: { width: "100%", maxWidth: 480 },
  title: { fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.5px", color: "#f5f0ea" },
  subtitle: { fontSize: 13, color: MUTED, margin: "6px 0 32px" },
  section: { marginBottom: 28 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionLabel: { fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.5px", color: MUTED, display: "block", marginBottom: 10 },
  intervalValue: { color: ACCENT, fontWeight: 700, fontSize: 14 },
  slider: { width: "100%", height: 6, appearance: "auto", accentColor: ACCENT, cursor: "pointer" },
  sliderLabels: { display: "flex", justifyContent: "space-between", fontSize: 11, color: DIM, marginTop: 4 },
  toggleAllBtn: { background: "none", border: "none", color: ACCENT, fontSize: 11, cursor: "pointer", fontFamily: FONT, padding: 0 },
  chipGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { ...base, fontSize: 14, fontWeight: 600, padding: "8px 16px", borderRadius: 6, border: "2px solid transparent", cursor: "pointer", transition: "all 0.15s ease" },
  chipOn: { background: `${ACCENT}26`, borderColor: ACCENT, color: ACCENT },
  chipOff: { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: DIM },
  ttsRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 4 },
  ttsLabel: { fontSize: 13, fontWeight: 600, color: MUTED },
  ttsToggle: { width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s ease", padding: 0, flexShrink: 0 },
  ttsKnob: { width: 18, height: 18, borderRadius: 9, background: "#fff", position: "absolute", top: 3, transition: "left 0.2s ease" },
  listenHint: { fontSize: 11, color: DIM, padding: "4px 0 8px", lineHeight: 1.5 },
  startBtn: { ...base, width: "100%", padding: 16, fontSize: 15, fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer", background: ACCENT, color: BG, marginTop: 12, transition: "all 0.15s ease" },
  startBtnDisabled: { opacity: 0.3, cursor: "not-allowed" },
  practiceTimeBox: { marginTop: 20, padding: "16px 20px", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" },
  practiceTimeValue: { fontSize: 28, fontWeight: 700, color: ACCENT, letterSpacing: "1px", textAlign: "center", marginBottom: 8 },
  practiceTimeSubRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  practiceTimeLabel: { fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "1px" },
  resetBtn: { ...base, fontSize: 11, background: "none", border: "none", color: DIM, cursor: "pointer", padding: 0 },

  sessionRoot: { ...fullPage, position: "relative", overflow: "hidden" },
  progressBg: { position: "absolute", top: 0, left: 0, height: "100%", background: `linear-gradient(135deg, ${ACCENT}1F, ${ACCENT}0F)`, borderRight: `2px solid ${ACCENT}4D`, transition: "opacity 0.3s ease", pointerEvents: "none", zIndex: 0 },
  sessionCenter: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", position: "relative", zIndex: 1 },
  practiceTimerSession: { fontSize: 24, fontWeight: 700, color: ACCENT, letterSpacing: "1px", marginBottom: 24 },
  countBadge: { fontSize: 12, color: DIM, letterSpacing: "1px", marginBottom: 16 },
  noteDisplay: { fontSize: 80, fontWeight: 700, letterSpacing: "-1px", transition: "all 0.2s ease", textAlign: "center", lineHeight: 1.1 },
  typeBadge: { fontSize: 12, color: MUTED, textTransform: "uppercase", letterSpacing: "2px", marginTop: 16, transition: "opacity 0.2s ease" },
  detectionHint: { fontSize: 14, color: MUTED, marginTop: 20, letterSpacing: "0.5px" },
  pauseOverlay: { position: "absolute", fontSize: 20, color: MUTED, letterSpacing: "2px" },
  sessionControls: { display: "flex", gap: 12, padding: 20, justifyContent: "center", position: "relative", zIndex: 1 },
  btnPause: { ...btn, border: `2px solid ${ACCENT}66`, background: `${ACCENT}1A`, color: ACCENT },
  btnStop: { ...btn, border: "2px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: MUTED },
  keyHints: { ...base, textAlign: "center", padding: "8px 20px 16px", fontSize: 11, color: DIM, letterSpacing: "0.5px", position: "relative", zIndex: 1 },
};
