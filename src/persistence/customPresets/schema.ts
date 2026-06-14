import { z } from "zod";

export const CustomPresetSchema = z.object({
  id: z.string(),
  label: z.string(),
  chordIds: z.array(z.string()),
});

export const CustomPresetsSchema = z.array(CustomPresetSchema);

export type CustomPreset = z.infer<typeof CustomPresetSchema>;
export type CustomPresets = z.infer<typeof CustomPresetsSchema>;
