import { createVersionedBlob } from "../createVersionedBlob";
import { LATEST_VERSION, latestSchema, migrations } from "./migrate";
import type { CustomPresets } from "./schemas/v1";

export type { CustomPreset, CustomPresets } from "./schemas/v1";

export const blob = createVersionedBlob<CustomPresets>({
  key: "guitar-practice-custom-presets",
  latestVersion: LATEST_VERSION,
  schema: latestSchema,
  makeDefaults: () => [],
  migrations,
});

export const { load, save } = blob;
