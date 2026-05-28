import { useEffect, useState } from "react";
import { ALL } from "./constants";
import { usePitchDetection } from "./usePitchDetection";
import { useSession } from "./useSession";
import { summarizeSession } from "./summarizeSession";
import { loadStats, saveStats, resetStats, mergeSessionIntoStats } from "./stats";
import WelcomeView from "./components/WelcomeView";
import ConfigView from "./components/ConfigView";
import SessionView from "./components/SessionView";
import SummaryView from "./components/SummaryView";
import DebugView from "./components/DebugView";
import ChordDiagram from "./components/ChordDiagram";

const SETTINGS_KEY = "guitar-practice-settings";

// TEMP design preview — remove before shipping
const DEMO_CHORDS = [
  { label: "Mi Majeur", fingering: { frets: [0, 2, 2, 1, 0, 0] } },
  { label: "Mi Mineur", fingering: { frets: [0, 2, 2, 0, 0, 0] } },
  { label: "Mi Diminué", fingering: { frets: [0, 1, 2, 0, -1, -1] } },
  { label: "Mi Maj 7", fingering: { frets: [0, 2, 1, 1, 0, 0] } },
  { label: "Mi Min 7", fingering: { frets: [0, 2, 0, 0, 0, 0] } },
  { label: "Mi Demi-diminué", fingering: { frets: [0, 1, 0, 0, -1, -1] } },
  { label: "Mi 7", fingering: { frets: [0, 2, 0, 1, 0, 0] } },
  { label: "La Majeur", fingering: { frets: [-1, 0, 2, 2, 2, 0] } },
  { label: "La Mineur", fingering: { frets: [-1, 0, 2, 2, 1, 0] } },
  { label: "La Diminué", fingering: { frets: [-1, 0, 1, 2, 1, -1] } },
  { label: "La Maj 7", fingering: { frets: [-1, 0, 2, 1, 2, 0] } },
  { label: "La Min 7", fingering: { frets: [-1, 0, 2, 0, 1, 0] } },
  { label: "La Demi-diminué", fingering: { frets: [-1, 0, 1, 0, 1, -1] } },
  { label: "La 7", fingering: { frets: [-1, 0, 2, 0, 2, 0] } },
];

function ChordDiagramPreview() {
  return (
    <div style={{ minHeight: "100vh", padding: 32 }}>
      <h2 style={{ fontWeight: 500, marginBottom: 24, color: "var(--muted)", fontSize: 16 }}>
        ChordDiagram — design preview
      </h2>
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
        {DEMO_CHORDS.map((c) => (
          <div key={c.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <ChordDiagram fingering={c.fingering} />
            <span style={{ color: "var(--text)", fontSize: 13 }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {}; }
  catch { return {}; }
}

function initialEnabled() {
  const defaults = Object.fromEntries(ALL.map((item) => [item.id, item.defaultEnabled !== false]));
  const stored = loadSettings().enabled;
  return stored ? { ...defaults, ...stored } : defaults;
}

export default function GuitarPractice() {
  if (true) return <ChordDiagramPreview />; // TEMP design preview

  const [intervalSecs, setIntervalSecs] = useState(() => {
    const stored = loadSettings().interval;
    return typeof stored === "number" ? stored : 2;
  });
  const [enabled, setEnabled] = useState(initialEnabled);
  const [tts, setTts] = useState(() => loadSettings().tts ?? false);
  const [listening, setListening] = useState(() => loadSettings().listening ?? false);
  const [inDebug, setInDebug] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [stats, setStats] = useState(loadStats);
  const [screen, setScreen] = useState("welcome"); // "welcome" | "config"
  const [mode, setMode] = useState(null); // "notes" | "chords"

  const targetType = mode === "chords" ? "chord" : "note";
  const pool = ALL.filter((item) => enabled[item.id] && item.type === targetType);

  const session = useSession({ interval: intervalSecs, pool, listening: mode === "notes" && listening, tts });
  const detectedNote = usePitchDetection(session.micActive, session.count);

  useEffect(() => {
    session.onDetectedNote(detectedNote);
  }, [detectedNote]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ interval: intervalSecs, enabled, tts, listening }));
    } catch { /* ignore quota / disabled storage */ }
  }, [intervalSecs, enabled, tts, listening]);

  useEffect(() => {
    if (!session.inSession) return;
    const handler = (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIntervalSecs((v) => Math.min(v + 0.1, 5));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setIntervalSecs((v) => Math.max(v - 0.1, 0.5));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [session.inSession]);

  const stopSession = () => {
    const raw = session.finish();
    const summary = summarizeSession({ ...raw, wasListening: mode === "notes" && listening });
    setSessionSummary(summary);
    setStats((prev) => {
      const next = mergeSessionIntoStats(prev, summary);
      saveStats(next);
      return next;
    });
  };

  const resetAllStats = () => setStats(resetStats());

  const goWelcome = () => {
    setSessionSummary(null);
    setMode(null);
    setScreen("welcome");
  };

  const pickMode = (m) => {
    setMode(m);
    setScreen("config");
  };

  if (import.meta.env.DEV && inDebug) {
    return <DebugView onBack={() => setInDebug(false)} />;
  }

  if (session.inSession) {
    return (
      <SessionView
        current={session.current}
        count={session.count}
        streak={session.streak}
        progress={session.progress}
        paused={session.paused}
        listening={mode === "notes" && listening}
        detectedNote={detectedNote}
        hitStatus={session.hitStatus}
        practiceTime={session.practiceTime}
        interval={intervalSecs}
        onPauseToggle={session.pauseToggle}
        onForceAccept={session.forceAccept}
        onStop={stopSession}
      />
    );
  }

  if (sessionSummary !== null) {
    return <SummaryView summary={sessionSummary} onDismiss={goWelcome} />;
  }

  if (screen === "config") {
    return (
      <ConfigView
        mode={mode}
        interval={intervalSecs}
        setInterval={setIntervalSecs}
        enabled={enabled}
        setEnabled={setEnabled}
        tts={tts}
        setTts={setTts}
        listening={listening}
        setListening={setListening}
        pool={pool}
        onStart={session.start}
        onBack={goWelcome}
        showDebugLink={import.meta.env.DEV}
        onShowDebug={() => setInDebug(true)}
      />
    );
  }

  return (
    <WelcomeView
      stats={stats}
      resetStats={resetAllStats}
      practiceTime={session.practiceTime}
      resetPracticeTime={session.resetPracticeTime}
      onPickNotes={() => pickMode("notes")}
      onPickChords={() => pickMode("chords")}
      showDebugLink={import.meta.env.DEV}
      onShowDebug={() => setInDebug(true)}
    />
  );
}
