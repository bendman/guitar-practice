// FROZEN — v1 schema. Append-only: never edit this file. To change the shape,
// add schemas/v2.ts and a 1→2 migration in ../migrate.ts.
import { z } from "zod";

export const CustomPresetSchema = z.object({
  id: z.string(),
  label: z.string(),
  chordIds: z.array(z.string()),
});

export const CustomPresetsSchema = z.array(CustomPresetSchema);

export type CustomPreset = z.infer<typeof CustomPresetSchema>;
export type CustomPresets = z.infer<typeof CustomPresetsSchema>;
