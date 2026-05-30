export function summarizeSession({ results, bestStreak, practiceTime, wasListening, wasManualChord }) {
  const noteResults = results.filter((r) => r.type === "note");
  const correctCount = noteResults.filter((r) => r.correct).length;
  const totalNotes = noteResults.length;
  const accuracy = totalNotes > 0 ? Math.round((correctCount / totalNotes) * 100) : 0;

  const noteMap = {};
  for (const r of noteResults) {
    if (!noteMap[r.id]) {
      noteMap[r.id] = { id: r.id, label: r.label, attempts: 0, misses: 0, responseTimes: [] };
    }
    noteMap[r.id].attempts += 1;
    if (!r.correct) noteMap[r.id].misses += 1;
    if (r.responseTime != null) noteMap[r.id].responseTimes.push(r.responseTime);
  }

  const missedItems = Object.values(noteMap)
    .filter((n) => n.misses > 0)
    .map((n) => {
      const rt = n.responseTimes;
      const avgResponseTime = rt.length > 0 ? rt.reduce((a, b) => a + b, 0) / rt.length : null;
      return { ...n, missRate: Math.round((n.misses / n.attempts) * 100), avgResponseTime };
    })
    .sort((a, b) => b.missRate - a.missRate);

  const allResponseTimes = noteResults.map((r) => r.responseTime).filter((t) => t != null);
  const avgResponseTime = allResponseTimes.length > 0
    ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length
    : null;

  // Chord grading stats (manual mode only)
  const chordResults = wasManualChord ? results.filter((r) => r.type === "chord") : [];
  const chordCorrectCount = chordResults.filter((r) => r.correct).length;
  const totalChords = chordResults.length;
  const chordAccuracy = totalChords > 0 ? Math.round((chordCorrectCount / totalChords) * 100) : 0;

  const chordMap = {};
  for (const r of chordResults) {
    if (!chordMap[r.id]) {
      chordMap[r.id] = { id: r.id, label: r.label, attempts: 0, misses: 0 };
    }
    chordMap[r.id].attempts += 1;
    if (!r.correct) chordMap[r.id].misses += 1;
  }

  const chordMissedItems = Object.values(chordMap)
    .filter((c) => c.misses > 0)
    .map((c) => ({ ...c, missRate: Math.round((c.misses / c.attempts) * 100) }))
    .sort((a, b) => b.missRate - a.missRate);

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
  };
}
