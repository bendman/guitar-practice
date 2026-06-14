import { stats as statsBlob, weights as weightsBlob, confusions as confusionsBlob } from "../persistence/progress";

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
  chordPracticedItems: PracticedChordItem[];
}

export interface PracticedChordItem {
  id: string;
  label: string;
  attempts: number;
  misses: number;
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
  return { ...EMPTY, ...statsBlob.load().data };
}

export function saveStats(stats: Stats): void {
  statsBlob.save(stats);
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
  return weightsBlob.load().data;
}

export function saveWeights(weights: Weights): void {
  weightsBlob.save(weights);
}

export function resetWeights(): Weights {
  saveWeights({});
  return {};
}

export function loadConfusions(): Confusions {
  return confusionsBlob.load().data;
}

export function saveConfusions(confusions: Confusions): void {
  confusionsBlob.save(confusions);
}

export function resetConfusions(): Confusions {
  saveConfusions({});
  return {};
}

export function accuracyPercent(stats: Stats): number | null {
  if (stats.totalNotes === 0) return null;
  return Math.round((stats.totalCorrect / stats.totalNotes) * 100);
}
