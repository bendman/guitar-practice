import { pickWeightedRandom, weightToLevel, applyResult, buildActivePool } from '../src/util.js';
import { ALL } from '../src/constants.js';

const LEVEL_LABELS = ['Unpracticed', 'Struggling', 'Learning', 'Mastered'];

const SCENARIOS = [
  {
    name: 'Short session, small pool (5 items, 20 picks)',
    pool: ALL.slice(0, 5),
    sessions: [{ picks: 20, successRate: 0.7 }],
  },
  {
    name: 'Long session, large pool (20 items, 200 picks)',
    pool: ALL.slice(0, 20),
    sessions: [{ picks: 200, successRate: 0.7 }],
  },
  {
    name: 'Struggling item gets extra practice',
    pool: ALL.slice(0, 8),
    sessions: [{
      picks: 100,
      successRate: 0.7,
      itemSuccessRates: { [ALL[2].id]: 0.1 },
    }],
  },
  {
    name: 'Previously learned item removed from pool',
    pool: ALL.slice(0, 8),
    sessions: [
      { picks: 80, successRate: 0.95 },
      { picks: 80, successRate: 0.7, excludeIds: [ALL[0].id] },
    ],
  },
  {
    name: 'Working set (cap 3, pool of 10) — items slide in as they are mastered',
    pool: ALL.slice(0, 10),
    workingSetSize: 3,
    sessions: [{ picks: 200, successRate: 0.85 }],
  },
  {
    name: 'Three sessions in a row — weight accumulation over time',
    pool: ALL.slice(0, 10),
    sessions: [
      { picks: 50, successRate: 0.6 },
      { picks: 50, successRate: 0.7 },
      { picks: 50, successRate: 0.8 },
    ],
  },
];

const RUNS = 10; // repeat each scenario and average results

function runSession(pool, session, weightsIn, workingSetSize) {
  let weights = { ...weightsIn };
  const basePool = session.excludeIds
    ? pool.filter((i) => !session.excludeIds.includes(i.id))
    : pool;
  const selectionCounts = Object.fromEntries(pool.map((i) => [i.id, 0]));
  const snapshots = []; // { itemId -> weight } every 10 picks

  let lastId = null;
  for (let t = 0; t < session.picks; t++) {
    // Re-evaluate active pool each pick so graduations take effect immediately
    const activePools = workingSetSize != null
      ? buildActivePool(basePool, weights, workingSetSize)
      : basePool;
    const item = pickWeightedRandom(activePools, lastId, weights);
    if (!item) break;
    selectionCounts[item.id]++;

    const successRate = (session.itemSuccessRates ?? {})[item.id] ?? session.successRate;
    const correct = Math.random() < successRate;
    weights = applyResult(weights, item.id, correct);

    if ((t + 1) % 10 === 0) {
      snapshots.push(Object.fromEntries(pool.map((i) => [i.id, weights[i.id] ?? 1])));
    }

    lastId = item.id;
  }

  return { weights, selectionCounts, snapshots };
}

function average(nums) {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function runScenario(scenario) {
  const allRunResults = [];

  for (let r = 0; r < RUNS; r++) {
    let weights = {};
    let sessionSnapshots = [];
    let sessionCounts = Object.fromEntries(scenario.pool.map((i) => [i.id, 0]));

    for (const session of scenario.sessions) {
      const result = runSession(scenario.pool, session, weights, scenario.workingSetSize);
      weights = result.weights;
      sessionSnapshots = result.snapshots; // keep last session's snapshots
      for (const id of Object.keys(sessionCounts)) {
        sessionCounts[id] += result.selectionCounts[id] ?? 0;
      }
    }

    allRunResults.push({ weights, snapshots: sessionSnapshots, selectionCounts: sessionCounts });
  }

  // Aggregate across runs
  const avgWeights = Object.fromEntries(
    scenario.pool.map((item) => [
      item.id,
      average(allRunResults.map((r) => r.weights[item.id] ?? 1)),
    ])
  );
  const avgCounts = Object.fromEntries(
    scenario.pool.map((item) => [
      item.id,
      average(allRunResults.map((r) => r.selectionCounts[item.id] ?? 0)),
    ])
  );
  // Average snapshots across runs
  const numSnapshots = allRunResults[0].snapshots.length;
  const avgSnapshots = Array.from({ length: numSnapshots }, (_, si) =>
    Object.fromEntries(
      scenario.pool.map((item) => [
        item.id,
        average(allRunResults.map((r) => r.snapshots[si]?.[item.id] ?? 1)),
      ])
    )
  );

  return { avgWeights, avgCounts, avgSnapshots };
}

function printReport(scenario, { avgWeights, avgCounts, avgSnapshots }) {
  const separator = '─'.repeat(70);
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`SCENARIO: ${scenario.name}`);
  console.log(`Sessions: ${scenario.sessions.map((s, i) => `#${i + 1} ${s.picks} picks @ ${(s.successRate * 100).toFixed(0)}% success${s.excludeIds ? ` (excluding ${s.excludeIds.join(', ')})` : ''}${s.itemSuccessRates ? ` (overrides: ${Object.entries(s.itemSuccessRates).map(([k, v]) => `${k}=${(v * 100).toFixed(0)}%`).join(', ')})` : ''}`).join(' → ')}`);
  console.log(`Averaged over ${RUNS} runs`);
  console.log(separator);

  // Section A: Final state
  const sorted = [...scenario.pool].sort((a, b) => avgWeights[b.id] - avgWeights[a.id]);
  console.log('\nA) FINAL STATE (sorted by weight, highest = most struggle)');
  console.log(`  ${'Item'.padEnd(12)} ${'Weight'.padEnd(8)} ${'Level'.padEnd(14)} Picks`);
  for (const item of sorted) {
    const w = avgWeights[item.id];
    const level = weightToLevel(w);
    console.log(`  ${item.id.padEnd(12)} ${w.toFixed(3).padEnd(8)} ${LEVEL_LABELS[level].padEnd(14)} ${avgCounts[item.id].toFixed(1)}`);
  }

  // Section B: Correlation check
  const byLevel = { 1: [], 2: [], 3: [] };
  for (const item of scenario.pool) {
    const level = weightToLevel(avgWeights[item.id]);
    if (byLevel[level]) byLevel[level].push(avgCounts[item.id]);
  }
  const avgPicksByLevel = Object.fromEntries(
    Object.entries(byLevel).map(([l, picks]) => [l, picks.length ? average(picks) : null])
  );

  console.log('\nB) SELECTION FREQUENCY BY MASTERY LEVEL');
  for (const [level, label] of [[1, 'Struggling'], [2, 'Learning'], [3, 'Mastered']]) {
    const avg = avgPicksByLevel[level];
    const count = byLevel[level].length;
    if (avg !== null) {
      console.log(`  ${label.padEnd(12)} (${count} items): avg ${avg.toFixed(1)} picks`);
    }
  }
  if (avgPicksByLevel[1] !== null && avgPicksByLevel[3] !== null) {
    const ratio = avgPicksByLevel[1] / avgPicksByLevel[3];
    const ok = ratio >= 2;
    console.log(`  Struggling/Mastered ratio: ${ratio.toFixed(1)}x ${ok ? '✓' : '⚠ (expected ≥ 2x)'}`);
  }

  // Section C: Weight progression for extreme items
  if (avgSnapshots.length >= 2) {
    const topItem = sorted[0];
    const bottomItem = sorted[sorted.length - 1];
    const interesting = [topItem, bottomItem].filter(Boolean);
    if (topItem?.id === bottomItem?.id) interesting.pop();

    const times = avgSnapshots.map((_, i) => `t=${(i + 1) * 10}`);
    const colW = 7;
    console.log('\nC) WEIGHT PROGRESSION (sampled every 10 picks, last session)');
    console.log(`  ${'Item'.padEnd(12)} ${times.map((t) => t.padEnd(colW)).join('')}`);
    for (const item of interesting) {
      const row = avgSnapshots.map((snap) => (snap[item.id] ?? 1).toFixed(2).padEnd(colW)).join('');
      console.log(`  ${item.id.padEnd(12)} ${row}`);
    }
  }
}

// Equilibrium weight analysis
function equilibriumWeight(successRate) {
  // w stabilizes when 0.85^p * 1.3^(1-p) = 1
  // p * ln(0.85) + (1-p) * ln(1.3) = 0
  // p = ln(1.3) / (ln(1.3) - ln(0.85))
  const p = Math.log(1.3) / (Math.log(1.3) - Math.log(0.85));
  const balanced = successRate >= p;
  return { balancedSuccessRate: p, willDecay: balanced };
}

console.log('\n=== SPACED REPETITION SIMULATION ===');
const { balancedSuccessRate } = equilibriumWeight(0.7);
console.log(`Multipliers: correct×0.85 (min 0.1), incorrect×1.3 (max 5.0)`);
console.log(`Equilibrium success rate: ${(balancedSuccessRate * 100).toFixed(1)}% — above this, weights decay toward mastery`);

for (const scenario of SCENARIOS) {
  const results = runScenario(scenario);
  printReport(scenario, results);
}

console.log('\n');
