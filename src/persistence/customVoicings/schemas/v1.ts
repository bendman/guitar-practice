// FROZEN — v1 schema. Append-only: never edit this file. To change the shape,
// add schemas/v2.ts and a 1→2 migration in ../migrate.ts.
import { z } from "zod";

export const BarreSchema = z.object({
  fret: z.number(),
  fromString: z.number(),
  toString: z.number(),
});

export const VoicingSchema = z.object({
  frets: z.array(z.number()),
  baseFret: z.number().optional(),
  barres: z.array(BarreSchema).optional(),
});

export const CustomVoicingsSchema = z.record(z.string(), z.array(VoicingSchema));

export type Voicing = z.infer<typeof VoicingSchema>;
export type CustomVoicings = z.infer<typeof CustomVoicingsSchema>;
