// FROZEN — v1 schema. Append-only: never edit this file. To change the shape,
// add schemas/v2.ts and a 1→2 migration in ../migrate.ts.
import { z } from "zod";

/**
 * Stats are stored as a partial bag and merged onto defaults by `loadStats`,
 * so every field is optional here (a missing field simply re-defaults).
 */
export const StatsSchema = z.object({
  bestStreak: z.number().optional(),
  totalSessions: z.number().optional(),
  totalCorrect: z.number().optional(),
  totalNotes: z.number().optional(),
  totalPracticeTime: z.number().optional(),
});

export type StoredStats = z.infer<typeof StatsSchema>;
