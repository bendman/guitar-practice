import { createVersionedBlob } from "../createVersionedBlob";
import { LATEST_VERSION, latestSchema, migrations } from "./migrate";
import type { CustomVoicings } from "./schemas/v1";

export type { CustomVoicings, Voicing } from "./schemas/v1";

export const blob = createVersionedBlob<CustomVoicings>({
  key: "guitar-practice-custom-voicings",
  latestVersion: LATEST_VERSION,
  schema: latestSchema,
  makeDefaults: () => ({}),
  migrations,
});

export const { load, save } = blob;
