import { createBlob } from "../createBlob";
import { CustomPresetsSchema, type CustomPresets } from "./schema";

export type { CustomPreset, CustomPresets } from "./schema";

const blob = createBlob<CustomPresets>(
  "guitar-practice-custom-presets",
  CustomPresetsSchema,
  () => [],
);

export const { load, save } = blob;
