import type { SessionSummary, MissedNoteItem, MissedChordItem, NoteExposureItem } from "./stats";

export interface SessionResult {
  id: string;
  label: string;
  type: "note" | "chord";
  correct: boolean;
  responseTime: number | null;
}

export interface SessionInput {
  results: SessionResult[];
  bestStreak: number;
  practiceTime: number;
  wasListening: boolean;
  wasManualChord: boolean;
  /**
   * The pool the session drew from. Only the results say what actually came up,
   * so this is what lets the summary also report the notes that never did.
   */
  poolItems?: { id: string; label: string; type: "note" | "chord" }[];
}

export function summarizeSession({
  results,
  bestStreak,
  practiceTime,
  wasListening,
  wasManualChord,
  poolItems = [],
}: SessionInput): SessionSummary {
  const noteResults = results.filter((r) => r.type === "note");
  const correctCount = noteResults.filter((r) => r.correct).length;
  const totalNotes = noteResults.length;
  const accuracy = totalNotes > 0 ? Math.round((correctCount / totalNotes) * 100) : 0;

  const noteMap: Record<
    string,
    { id: string; label: string; attempts: number; misses: number; responseTimes: number[] }
  > = {};
  for (const r of noteResults) {
    if (!noteMap[r.id]) {
      noteMap[r.id] = { id: r.id, label: r.label, attempts: 0, misses: 0, responseTimes: [] };
    }
    noteMap[r.id].attempts += 1;
    if (!r.correct) noteMap[r.id].misses += 1;
    if (r.responseTime != null) noteMap[r.id].responseTimes.push(r.responseTime);
  }

  const missedItems: MissedNoteItem[] = Object.values(noteMap)
    .filter((n) => n.misses > 0)
    .map((n) => {
      const rt = n.responseTimes;
      const avgResponseTime = rt.length > 0 ? rt.reduce((a, b) => a + b, 0) / rt.length : null;
      return { ...n, missRate: Math.round((n.misses / n.attempts) * 100), avgResponseTime };
    })
    .sort((a, b) => b.missRate - a.missRate);

  const allResponseTimes = noteResults
    .map((r) => r.responseTime)
    .filter((t): t is number => t != null);
  const avgResponseTime =
    allResponseTimes.length > 0
      ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length
      : null;

  // Seeded from the pool so notes that never came up still report a zero, in
  // the pool's own order — the point is to show the whole selection at a glance.
  const exposure = new Map<string, NoteExposureItem>();
  for (const item of poolItems) {
    if (item.type === "note") exposure.set(item.id, { id: item.id, label: item.label, count: 0 });
  }
  for (const r of noteResults) {
    const seen = exposure.get(r.id);
    if (seen) seen.count += 1;
    else exposure.set(r.id, { id: r.id, label: r.label, count: 1 });
  }
  const noteExposure = [...exposure.values()];

  const chordResults = wasManualChord ? results.filter((r) => r.type === "chord") : [];
  const chordCorrectCount = chordResults.filter((r) => r.correct).length;
  const totalChords = chordResults.length;
  const chordAccuracy = totalChords > 0 ? Math.round((chordCorrectCount / totalChords) * 100) : 0;

  const chordMap: Record<string, { id: string; label: string; attempts: number; misses: number }> =
    {};
  for (const r of chordResults) {
    if (!chordMap[r.id]) {
      chordMap[r.id] = { id: r.id, label: r.label, attempts: 0, misses: 0 };
    }
    chordMap[r.id].attempts += 1;
    if (!r.correct) chordMap[r.id].misses += 1;
  }

  const chordMissedItems: MissedChordItem[] = Object.values(chordMap)
    .filter((c) => c.misses > 0)
    .map((c) => ({ ...c, missRate: Math.round((c.misses / c.attempts) * 100) }))
    .sort((a, b) => b.missRate - a.missRate);

  const chordPracticedItems = Object.values(chordMap).map((c) => ({
    id: c.id,
    label: c.label,
    attempts: c.attempts,
    misses: c.misses,
  }));

  return {
    totalCount: results.length,
    correctCount,
    totalNotes,
    accuracy,
    avgResponseTime,
    bestStreak,
    practiceTime,
    wasListening: wasListening && totalNotes > 0,
    missedItems,
    wasManualChord: wasManualChord && totalChords > 0,
    chordCorrectCount,
    totalChords,
    chordAccuracy,
    chordMissedItems,
    chordPracticedItems,
    noteExposure,
  };
}
