import { useEffect, useMemo, useState } from "react";
import { ALL } from "../lib/constants";
import type { NoteNaming } from "../lib/util";
import type { ChordMode } from "./flows/types";
import { load as loadSettingsBlob, save as saveSettings } from "../persistence/settings";
import i18n, { effectiveLanguage, type Language } from "../i18n";
import { applyTheme, watchSystemTheme, type Theme } from "../lib/theme";

function loadSettings() {
  return loadSettingsBlob().data;
}

const DEFAULT_ENABLED: Record<string, boolean> = Object.fromEntries(
  ALL.map((item) => [item.id, item.defaultEnabled !== false]),
);

function parseInitialSettings() {
  const s = loadSettings();
  // When the user never chose a notation, follow the UI language: French
  // defaults to solfège (Do Ré Mi), English to letters (C D E).
  const namingDefault: NoteNaming = effectiveLanguage() === "en" ? "letters" : "solfege";
  return {
    intervalSecs: typeof s.interval === "number" ? s.interval : 2,
    enabled: s.enabled ? { ...DEFAULT_ENABLED, ...s.enabled } : { ...DEFAULT_ENABLED },
    tts: s.tts ?? false,
    listening: s.listening ?? false,
    chordMode: (s.chordMode ?? (s.chordAuto ? "auto" : "manual")) as ChordMode,
    workingSetSize: typeof s.workingSetSize === "number" ? s.workingSetSize : 5,
    noteNaming: (s.noteNaming ?? namingDefault) as NoteNaming,
    spokenNaming: (s.spokenNaming ?? namingDefault) as NoteNaming,
    voiceURI: typeof s.voiceURI === "string" ? s.voiceURI : null,
    showChordNotes: s.showChordNotes ?? false,
    language: s.language,
    // Absent means the user never chose, which is exactly what "system" is.
    theme: (s.theme ?? "system") as Theme,
  };
}
const initialSettings = parseInitialSettings();

// Paint the stored scheme before React mounts, so a pinned theme never flashes
// the other one on load. This module is imported via AppState from main.tsx,
// which runs ahead of the first render.
applyTheme(initialSettings.theme);

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
  const [language, setLanguage] = useState<Language | undefined>(initialSettings.language);
  const [theme, setTheme] = useState<Theme>(initialSettings.theme);

  // Stamp the scheme on <html> whenever it changes, and while following the OS,
  // re-apply on system flips so the browser chrome colour keeps up.
  useEffect(() => {
    applyTheme(theme);
    return watchSystemTheme(theme, () => applyTheme(theme));
  }, [theme]);

  // The persisted setting drives i18next (never the reverse). When unset, the
  // detected language from init stays in effect.
  useEffect(() => {
    if (language && language !== i18n.resolvedLanguage) void i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    saveSettings({
      interval: intervalSecs,
      enabled,
      tts,
      listening,
      chordMode,
      workingSetSize,
      noteNaming,
      spokenNaming,
      voiceURI,
      showChordNotes,
      language,
      theme,
    });
  }, [
    intervalSecs,
    enabled,
    tts,
    listening,
    chordMode,
    workingSetSize,
    noteNaming,
    spokenNaming,
    voiceURI,
    showChordNotes,
    language,
    theme,
  ]);

  // Stable identity while no setting changes, so context consumers only
  // re-render on actual settings updates (setters from useState are stable).
  return useMemo(
    () => ({
      intervalSecs,
      setIntervalSecs,
      enabled,
      setEnabled,
      tts,
      setTts,
      listening,
      setListening,
      chordMode,
      setChordMode,
      workingSetSize,
      setWorkingSetSize,
      noteNaming,
      setNoteNaming,
      spokenNaming,
      setSpokenNaming,
      voiceURI,
      setVoiceURI,
      showChordNotes,
      setShowChordNotes,
      language,
      setLanguage,
      theme,
      setTheme,
    }),
    [
      intervalSecs,
      enabled,
      tts,
      listening,
      chordMode,
      workingSetSize,
      noteNaming,
      spokenNaming,
      voiceURI,
      showChordNotes,
      language,
      theme,
    ],
  );
}
