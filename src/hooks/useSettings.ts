import { useEffect, useState } from "react";
import { ALL } from "../lib/constants";
import type { NoteNaming } from "../lib/util";
import type { ChordMode } from "./useSession";

const SETTINGS_KEY = "guitar-practice-settings";

interface StoredSettings {
  interval?: number;
  enabled?: Record<string, boolean>;
  tts?: boolean;
  listening?: boolean;
  chordAuto?: boolean;
  chordMode?: ChordMode;
  workingSetSize?: number;
  noteNaming?: NoteNaming;
  spokenNaming?: NoteNaming;
  voiceURI?: string | null;
  showChordNotes?: boolean;
}

function loadSettings(): StoredSettings {
  try { return (JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null") as StoredSettings | null) ?? {}; }
  catch { return {}; }
}

const DEFAULT_ENABLED: Record<string, boolean> = Object.fromEntries(ALL.map((item) => [item.id, item.defaultEnabled !== false]));

function parseInitialSettings() {
  const s = loadSettings();
  return {
    intervalSecs: typeof s.interval === "number" ? s.interval : 2,
    enabled: s.enabled ? { ...DEFAULT_ENABLED, ...s.enabled } : { ...DEFAULT_ENABLED },
    tts: s.tts ?? false,
    listening: s.listening ?? false,
    chordMode: (s.chordMode ?? (s.chordAuto ? "auto" : "manual")) as ChordMode,
    workingSetSize: typeof s.workingSetSize === "number" ? s.workingSetSize : 5,
    noteNaming: (s.noteNaming === "letters" ? "letters" : "solfege") as NoteNaming,
    spokenNaming: (s.spokenNaming === "letters" ? "letters" : "solfege") as NoteNaming,
    voiceURI: typeof s.voiceURI === "string" ? s.voiceURI : null,
    showChordNotes: s.showChordNotes ?? false,
  };
}
const initialSettings = parseInitialSettings();

/**
 * Owns every user preference that survives reloads.
 *
 * Used by the app root to supply config to every screen.
 * Hydrates from localStorage once and writes the whole blob back on any change.
 */
export function useSettings() {
  const [intervalSecs, setIntervalSecs] = useState<number>(initialSettings.intervalSecs);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(initialSettings.enabled);
  const [tts, setTts] = useState<boolean>(initialSettings.tts);
  const [listening, setListening] = useState<boolean>(initialSettings.listening);
  const [chordMode, setChordMode] = useState<ChordMode>(initialSettings.chordMode);
  const [workingSetSize, setWorkingSetSize] = useState<number>(initialSettings.workingSetSize);
  const [noteNaming, setNoteNaming] = useState<NoteNaming>(initialSettings.noteNaming);
  const [spokenNaming, setSpokenNaming] = useState<NoteNaming>(initialSettings.spokenNaming);
  const [voiceURI, setVoiceURI] = useState<string | null>(initialSettings.voiceURI);
  const [showChordNotes, setShowChordNotes] = useState<boolean>(initialSettings.showChordNotes);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        interval: intervalSecs, enabled, tts, listening, chordMode, workingSetSize, noteNaming, spokenNaming, voiceURI, showChordNotes,
      }));
    } catch { /* ignore quota / disabled storage */ }
  }, [intervalSecs, enabled, tts, listening, chordMode, workingSetSize, noteNaming, spokenNaming, voiceURI, showChordNotes]);

  return {
    intervalSecs, setIntervalSecs,
    enabled, setEnabled,
    tts, setTts,
    listening, setListening,
    chordMode, setChordMode,
    workingSetSize, setWorkingSetSize,
    noteNaming, setNoteNaming,
    spokenNaming, setSpokenNaming,
    voiceURI, setVoiceURI,
    showChordNotes, setShowChordNotes,
  };
}
