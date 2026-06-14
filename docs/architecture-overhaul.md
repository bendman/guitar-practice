# Guitar Practice — Architecture & Navigation Overhaul

> Durable plan-of-record for the layered-architecture + TanStack Router migration.
> Live status lives in `.agent_scratchpad.md`; this file is the stable reference that
> does not get rewritten phase to phase. Read both when resuming.

## Goal

Rebuild the app's **screens, routing, and hook/component composition** around a layered
architecture that separates **policy** (UI, flow, labels) from **mechanism** (selection,
scoring, timing, pitch, persistence), with **TanStack Router** as the navigation engine.
**Behavior stays identical**; the structure becomes simple parts behind clean interfaces.

## Guiding principles (Unix philosophy → this codebase)

- **Separation** — policy (screens/controls/labels) decoupled from mechanism (engines). The spine of the whole design.
- **Modularity / Composition** — small hooks with plain-data interfaces; screens compose them.
- **Representation** — fold knowledge into data: route tree, typed search params, control-button tables, versioned persistence. Keep logic "stupid and robust."
- **Clarity over cleverness; Least Surprise** — distinct screens for distinct interaction models; URLs/back/refresh behave as users expect.
- **Robustness / Repair** — no special-case nests; guard invalid states with fail-fast redirects, not silent no-ops.
- **Transparency** — every screen is a real, inspectable address; engines testable without a DOM.
- **Generation** — let the router plugin generate route wiring; keep generating chords from data.
- **Parsimony / Diversity** — add structure only where it earns its keep; deliberate trades, no "one true way."

## Target architecture

```
lib/ (pure mechanism) → primitive hooks (headless) → flow hooks → screens + chrome (policy)
         |                       |                        |               |
   no React, unit-tested   plain in/out, no UI      one per         compose a flow
                                                 interaction model   + presentational parts
                          ┌─────────────────── TanStack Router ───────────────────┐
                          │  URL = navigation state; typed params; guards; context  │
                          └─────────────────────────────────────────────────────────┘
```

### Layer 1 — Mechanism (pure TS, no React) — `src/lib/`
Already pure (only `noteNaming.tsx` imports React, by design — it's the context provider). Keep DOM-free and unit-tested.
- `util` (weighted selection, `weightToLevel`, formatting), `stats` (persistence), `constants` (chords generated from roots×qualities via `tonal`), `summarizeSession`, `chordAnalysis`, `noteNaming`.

### Layer 2 — Primitive hooks (headless, mode-agnostic) — `src/hooks/primitives/`
Each does one thing; plain inputs, plain serializable outputs; no knowledge of consumer.
- `usePracticeClock(active)` → `{ practiceTime, reset }` — wall-clock accumulator.
- `useItemQueue({ pool, weights, tts, spokenNaming, voiceURI })` → `{ current, count, advance(), setTo(), reset() }` — weighted no-repeat selection + speak-on-set.
- `useScore({ onResult })` → `{ streak, record(item, correct, responseTime?), breakStreak(), snapshot(): { results, bestStreak }, reset() }`.
- `useCountdown({ durationMs, running, onElapsed })` → `{ progress, restart() }`.
- `usePitchDetection` — existing mic engine, unchanged.

### Layer 3 — Flow hooks (compose primitives by interaction model) — `src/hooks/flows/`
- `useTimedSession` — timed advance (**notes-auto, notes-listening, chord-auto**); listening variant adds mic-hit / force-accept / late-hit glue + ~200ms inter-item gap.
- `useRevealSession` — reveal-and-grade (**chord-manual**); `reveal()` / `grade()` / `skip()` first-class; countdown auto-reveals (pauses) on elapse.
- `useQuizSession` — multiple-choice (**chord-QCM**); distractors, `choices`/`correctId`/`selectedId`, `select()`/`next()`; owns `confusions`/`onConfusion`. No countdown.
- All expose `start()` / `finish(): SessionRawResult` / `pauseToggle()`.

> **Mode→flow mapping (confirmed):** chord **auto** → `useTimedSession` (timed loop with manual Voir/Continuer); chord **manual** → `useRevealSession`; chord **quiz** → `useQuizSession`; notes (auto or listening) → `useTimedSession`.

### Layer 4 — Screens + shared chrome (policy)
- Shared presentational components: `SessionChrome` (progress + top bar), `NoteDisplay`, `ChordReveal` (diagram + voicing switcher + add-voicing), `QuizGrid`, `ControlBar`.
- `ControlBar` renders a **list of button specs** (data table per flow), not a JSX cascade. (Legacy reference: the `CtrlBtn` variants in `SessionView` — primary/secondary/accent-line/danger-line/danger.)
- One thin component per flow (`NoteSession`, `ChordRevealSession`, `QuizSession`) composing its flow hook + chrome, rendering only its own controls — distinct programs, not one screen with a mode flag.
- Other screens stay as components: `WelcomeScreen`, `ConfigScreen`, `SummaryScreen`, `SettingsScreen`, `LearningScreen`, `ChordBuilder` (overlay), preset modals (overlay), `DebugScreen` (dev).
- Shared app state (settings, progress, custom voicings/presets) provided once via router `context` (or a React context), consumed by screens.

## Routing — TanStack Router (v1.170.x)

- **Packages:** `@tanstack/react-router@^1.170.15` (dep), `@tanstack/router-plugin@^1.170.15` (devDep). React 19 compatible.
- **History — hash history.** Deployed to GitHub Pages at `/guitar-practice/` (static, no SPA fallback). `createHashHistory()` makes deep links + refresh work without server config; keeps the PWA robust. Keep Vite `base: "/guitar-practice/"`.
- **Style — file-based routing.** `tanstackRouter({ target: "react", autoCodeSplitting: true })` in `vite.config`, ordered **before** `@vitejs/plugin-react`, with `vite-plugin-pwa` **last** so its `dist` glob precaches the generated lazy chunks. Generated `routeTree.gen.ts` is git/ESLint/Prettier-ignored. (Code-based `createRoute` is an acceptable fallback but forgoes autosplit/codegen.)

**Route map** — routes are the main view; **overlays are typed search params**, orthogonal and deep-linkable:

```
/                  welcome
/config/$mode      config        path param: "notes" | "chords"
/session/$mode     session       validated search: { flow: "timed" | "reveal" | "quiz" }
/summary           summary       ephemeral; beforeLoad → redirect "/" if no summary in router state
/settings          settings
/debug             debug         beforeLoad → redirect unless import.meta.env.DEV
# overlays on any route, e.g.:
#   ?overlay=chordBuilder&root=mi&quality=maj
#   ?overlay=learning | ?overlay=savePreset | ?overlay=deletePreset&preset=<id>
```

- **Typed search params** (`validateSearch`) model overlays and session sub-config.
- **`beforeLoad` guards** replace silent no-ops: redirect `/session` → `/config/$mode` when no pool is configured; gate `/debug` to DEV.
- **Typed `<Link>` / `useNavigate`** replace imperative screen switching; the flow dispatch reads `params.mode` + `search.flow` in one place.
- **No loaders** — data is synchronous localStorage via existing hooks; provide it through router `context`.

## Proposed file layout

```
src/
  routes/                 # file-based routes (thin: parse params, pick screen/flow, guards)
    __root.tsx  index.tsx  config.$mode.tsx  session.$mode.tsx  summary.tsx  settings.tsx  debug.tsx
  screens/                # presentational screens (policy)
    welcome/ config/ summary/ settings/ learning/ debug/
    session/  NoteSession.tsx  ChordRevealSession.tsx  QuizSession.tsx
      chrome/  SessionChrome  NoteDisplay  ChordReveal  QuizGrid  ControlBar
  overlays/               # ChordBuilder, SavePresetModal, DeletePresetModal (driven by ?overlay=)
  hooks/
    primitives/  usePracticeClock useItemQueue useScore useCountdown
    flows/       useTimedSession useRevealSession useQuizSession
    app/         useSettings useProgress useCustomVoicings useCustomPresets usePitchDetection useIntervalHotkeys
  lib/                    # pure mechanism (unchanged)
  router.tsx              # createRouter: hashHistory, basepath, context, defaultPreload
  main.tsx                # RouterProvider + NoteNamingProvider
```

## Data & persistence
- Add a `version` field + `migrate()` step to each localStorage blob (settings, weights, stats, custom voicings/presets, preferred voicings) so formats evolve without breakage.
- Keep folding knowledge into data: chords from roots×qualities; control bars from spec tables; overlays from search schemas.
- Tests continue to select by accessible role (no `data-testid`); accessibility stays the test interface.

## Tooling setup
- `vite.config`: plugin order `tanstackRouter()` → `react()` → `pwa()`; keep `base`.
- `.gitignore` + ESLint/Prettier ignore `src/routeTree.gen.ts`.
- `tsconfig`: ensure the generated route tree is included in typecheck.

## Implementation phases (each shippable, test-green)

1. **Mechanism baseline** — confirm `lib/` is pure; add unit tests for selection/scoring helpers. ✅ done (`c921c04`)
2. **Primitives** — extract `usePracticeClock`, `useItemQueue`, `useScore`, `useCountdown`; unit-test each. ✅ done (`c74c9aa`)
3. **Flow hooks** — build `useQuizSession`, `useRevealSession`, `useTimedSession` on the primitives; unit-test. ✅ done (`985a557`)
4. **Session screens** — `QuizSession` / `ChordRevealSession` / `NoteSession` + shared chrome; `ControlBar` from spec tables. Rewire `App.tsx` to mount the matching flow and call `finish()` on stop; retire `useSession`/`SessionView`.
5. **Router scaffold** — install packages, wire `vite.config` + `router.tsx` (hash history, basepath, context), `RouterProvider` in `main.tsx`; port `welcome` + `settings` first.
6. **Remaining routes** — `config.$mode`, `session.$mode` (dispatch to flow by `params.mode` + `search.flow`), `summary`, `debug`; add `beforeLoad` guards.
7. **Overlays** — drive ChordBuilder / preset modals / learning from typed `?overlay=` search params.
8. **Persistence versioning** — add `version` + `migrate()`; retire the old imperative navigation state.

## Guardrails (Parsimony / Diversity)
No global state library; no router loaders (sync data); no abstraction beyond what the three flows share. TanStack Router is a deliberate trade — typed params, working back/refresh on the PWA, per-screen code-splitting — not adopted for novelty.

---

## How to continue, phase to phase (workflow protocol)

This is the agreed operating mode. Follow it every phase.

### Per-phase loop
1. **Sense** — read `.agent_scratchpad.md` ("Next Physical Step" + phase checklist) and this file.
2. **Make the change** for exactly one phase. Keep `useSession.ts`/`App.tsx` working until the phase that explicitly retires them (Phase 4), so the app stays behaviorally identical and BDD stays green throughout.
3. **Green gate (all must pass before commit):**
   - `npm run typecheck`
   - `npm run test:unit`  (vitest; add isolation tests for any new primitive/flow hook)
   - `npm run test:dev`   (Cucumber+Playwright BDD against the dev server)
   - `npm run lint`       (only the 4 pre-existing `scripts/wait-for-deploy.js` `process` errors are allowed)
   - Once, for mic/listening changes: `npm run test:audio`
4. **Update `.agent_scratchpad.md`** — tick the phase, record what landed + any deviations, and write the next phase's "Next Physical Step".
5. **Commit** the phase (the user pre-approved per-phase commits for this overhaul; the pre-commit hook re-runs typecheck + BDD). Conventional-commit subject; end the body with the `Co-Authored-By` trailer.
6. **Continue** to the next phase.

### Environment / commands
- **All node/npm calls need the Node 22 PATH prefix:** `PATH="/Users/bendman/.nvm/versions/node/v22.22.2/bin:$PATH" <cmd>`.
- Dev server / BDD base URL: `http://localhost:5173/guitar-practice/` (`test:dev` starts the server itself).
- A **pre-commit hook** runs the full typecheck + `test:dev` on every commit and prints the entire BDD report — expect a large output dump per commit.

### Testing conventions (hard rules)
- **No `data-testid`.** Select by accessible role/name (French labels), then label/placeholder, then text. A missing selector means missing accessibility — fix the component (role/aria-label/`<label>`/semantic tag), don't add a testid.
- Add or extend a `.feature` scenario in `tests/features/` (reuse steps in `tests/steps/practice.steps.ts`) for any behavioral change; the BDD suite is the canonical feedback loop. It drives the UI by clicks, so it is routing-implementation-agnostic — it should keep passing across the router migration.
- Unit-test every new primitive and flow hook in isolation (jsdom + `@testing-library/react renderHook`; fake timers for RAF-driven clock/countdown; stub `speechSynthesis` and mock `sayAloud`).

### Router-phase specific verification (Phases 5–6)
- `routeTree.gen.ts` regenerates on dev/build; ignored by git/lint; `npm run build` then confirm `dist/sw.js` precache includes the new lazy chunks.
- Back returns to prior screen; refresh on `/settings`, `/config/notes` restores them (hash history); refresh on `/summary` redirects to `/`; `/debug` unreachable in a prod build.
