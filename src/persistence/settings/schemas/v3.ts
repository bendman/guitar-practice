// FROZEN — v3 schema. Append-only: never edit this file. To change the shape,
// add schemas/v4.ts and a 3→4 migration in ../migrate.ts.
// v3 = v2 + optional `theme` (colour scheme override; absent = follow the OS).
import { z } from "zod";

const NoteNamingSchema = z.enum(["solfege", "letters"]);
const ChordModeSchema = z.enum(["manual", "auto", "quiz"]);
const LanguageSchema = z.enum(["fr", "en"]);
const ThemeSchema = z.enum(["light", "dark", "system"]);

/**
 * The persisted settings blob is a partial bag of preferences; the live
 * `useSettings` hook fills in defaults for anything missing. Each field uses
 * `.catch(undefined)` so a single malformed field is dropped (and re-defaulted)
 * rather than discarding the whole blob — mirroring the legacy tolerant parse.
 */
export const StoredSettingsSchema = z
  .object({
    interval: z.number().optional().catch(undefined),
    enabled: z.record(z.string(), z.boolean()).optional().catch(undefined),
    tts: z.boolean().optional().catch(undefined),
    listening: z.boolean().optional().catch(undefined),
    chordAuto: z.boolean().optional().catch(undefined),
    chordMode: ChordModeSchema.optional().catch(undefined),
    workingSetSize: z.number().optional().catch(undefined),
    noteNaming: NoteNamingSchema.optional().catch(undefined),
    spokenNaming: NoteNamingSchema.optional().catch(undefined),
    voiceURI: z.string().nullable().optional().catch(undefined),
    showChordNotes: z.boolean().optional().catch(undefined),
    language: LanguageSchema.optional().catch(undefined),
    theme: ThemeSchema.optional().catch(undefined),
  })
  .catch({});

export type StoredSettings = z.infer<typeof StoredSettingsSchema>;
