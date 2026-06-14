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
