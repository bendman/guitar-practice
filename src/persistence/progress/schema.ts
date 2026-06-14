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

export const WeightsSchema = z.record(z.string(), z.number());

export const ConfusionsSchema = z.record(z.string(), z.record(z.string(), z.number()));

export type StoredStats = z.infer<typeof StatsSchema>;
export type Weights = z.infer<typeof WeightsSchema>;
export type Confusions = z.infer<typeof ConfusionsSchema>;
