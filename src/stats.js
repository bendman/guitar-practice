const STATS_KEY = "guitar-practice-stats";

const EMPTY = {
  bestStreak: 0,
  totalSessions: 0,
  totalCorrect: 0,
  totalNotes: 0,
  totalPracticeTime: 0,
};

export function loadStats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATS_KEY));
    return parsed ? { ...EMPTY, ...parsed } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch { /* ignore quota / disabled storage */ }
}

export function resetStats() {
  saveStats({ ...EMPTY });
  return { ...EMPTY };
}

// Merge a session summary into the persisted stats. Only counts mic-detection
// data when the user was actually listening — otherwise accuracy is undefined.
export function mergeSessionIntoStats(stats, summary) {
  const next = {
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

export function accuracyPercent(stats) {
  if (stats.totalNotes === 0) return null;
  return Math.round((stats.totalCorrect / stats.totalNotes) * 100);
}
