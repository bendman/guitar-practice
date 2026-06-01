const STATS_KEY = "guitar-practice-stats";
const WEIGHTS_KEY = "guitar-practice-weights";
const CONFUSIONS_KEY = "guitar-practice-confusions";

export interface Stats {
  bestStreak: number;
  totalSessions: number;
  totalCorrect: number;
  totalNotes: number;
  totalPracticeTime: number;
}

export interface SessionSummary {
  totalCount: number;
  correctCount: number;
  totalNotes: number;
  accuracy: number;
  avgResponseTime: number | null;
  bestStreak: number;
  practiceTime: number;
  wasListening: boolean;
  missedItems: MissedNoteItem[];
  wasManualChord: boolean;
  chordCorrectCount: number;
  totalChords: number;
  chordAccuracy: number;
  chordMissedItems: MissedChordItem[];
}

export interface MissedNoteItem {
  id: string;
  label: string;
  attempts: number;
  misses: number;
  responseTimes: number[];
  missRate: number;
  avgResponseTime: number | null;
}

export interface MissedChordItem {
  id: string;
  label: string;
  attempts: number;
  misses: number;
  missRate: number;
}

export type Weights = Record<string, number>;
export type Confusions = Record<string, Record<string, number>>;

const EMPTY: Stats = {
  bestStreak: 0,
  totalSessions: 0,
  totalCorrect: 0,
  totalNotes: 0,
  totalPracticeTime: 0,
};

export function loadStats(): Stats {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_KEY) ?? "null") as Partial<Stats> | null;
    return parsed ? { ...EMPTY, ...parsed } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

export function saveStats(stats: Stats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch { /* ignore quota / disabled storage */ }
}

export function resetStats(): Stats {
  saveStats({ ...EMPTY });
  return { ...EMPTY };
}

export function mergeSessionIntoStats(stats: Stats, summary: SessionSummary): Stats {
  const next: Stats = {
    bestStreak: Math.max(stats.bestStreak, summary.bestStreak ?? 0),
    totalSessions: stats.totalSessions + 1,
    totalCorrect: stats.totalCorrect,
    totalNotes: stats.totalNotes,
    totalPracticeTime: stats.totalPracticeTime + (summary.practiceTime ?? 0),
  };
  if (summary.wasListening) {
    next.totalCorrect += summary.correctCount ?? 0;
    next.totalNotes += summary.totalNotes ?? 0;
  }
  return next;
}

export function loadWeights(): Weights {
  try { return (JSON.parse(localStorage.getItem(WEIGHTS_KEY) ?? "null") as Weights | null) ?? {}; }
  catch { return {}; }
}

export function saveWeights(weights: Weights): void {
  try { localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights)); }
  catch { /* ignore quota / disabled storage */ }
}

export function resetWeights(): Weights {
  saveWeights({});
  return {};
}

export function loadConfusions(): Confusions {
  try { return (JSON.parse(localStorage.getItem(CONFUSIONS_KEY) ?? "null") as Confusions | null) ?? {}; }
  catch { return {}; }
}

export function saveConfusions(confusions: Confusions): void {
  try { localStorage.setItem(CONFUSIONS_KEY, JSON.stringify(confusions)); }
  catch { /* ignore quota / disabled storage */ }
}

export function resetConfusions(): Confusions {
  saveConfusions({});
  return {};
}

export function accuracyPercent(stats: Stats): number | null {
  if (stats.totalNotes === 0) return null;
  return Math.round((stats.totalCorrect / stats.totalNotes) * 100);
}
