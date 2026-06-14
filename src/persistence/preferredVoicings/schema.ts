import { z } from "zod";

export const PreferredVoicingsSchema = z.record(z.string(), z.number());

export type PreferredVoicings = z.infer<typeof PreferredVoicingsSchema>;
