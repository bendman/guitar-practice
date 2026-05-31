# Exercice Guitare

A French-language guitar practice PWA built with React, TypeScript, and Vite. Supports note recognition and chord memorization with spaced-repetition weighting and optional pitch detection via microphone.

## Source layout

```
src/
  App.tsx               # Root component — view routing, settings/stats persistence
  main.tsx              # React entrypoint
  index.css             # Global styles and CSS variables
  hooks/
    usePitchDetection.ts  # WebAudio microphone → pitch detection hook
    useSession.ts         # Practice session lifecycle hook
  lib/
    constants.ts          # Notes, chords, chord presets/progressions, voicings
    pitch.ts              # Frequency → note conversion
    stats.ts              # Stats and weights persistence (localStorage)
    summarizeSession.ts   # Aggregates raw session results into summary
    util.ts               # Weighted random, TTS, formatting helpers
  components/
    shared.module.css     # Shared CSS classes (typography, layout)
    ui/                   # Reusable atoms/molecules
      ChordDiagram/       # SVG chord fingering diagram
      Icon/               # SVG sprite icon wrapper
      NotesPicker/        # Note enable/disable picker
      ProgressDot/        # Mastery level indicator dot
      Toggle/             # Toggle switch
    views/                # Full-page views rendered by App.tsx
      ConfigView/         # Exercise configuration (interval, notes, chords)
      DebugView/          # Pitch detection debug panel
      ProgressView/       # Progress dashboard with mastery levels
      SessionView/        # Active practice session
      SummaryView/        # Post-session statistics
      WelcomeView/        # Welcome screen with mode selection
```

Each component folder contains `index.tsx` and `index.module.css`.

## Development

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # production build
npm run deploy    # build + deploy to GitHub Pages
```

## Scripts

- `scripts/simulate-sr.mjs` — simulate spaced repetition weight progression
- `scripts/wait-for-deploy.js` — poll GitHub Pages until a deploy is live
