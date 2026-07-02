import { createVersionedBlob } from "../createVersionedBlob";
import { LATEST_VERSION, latestSchema, migrations } from "./migrate";
import type { PreferredVoicings } from "./schemas/v1";

export type { PreferredVoicings } from "./schemas/v1";

export const blob = createVersionedBlob<PreferredVoicings>({
  key: "guitar-practice-preferred-voicings",
  latestVersion: LATEST_VERSION,
  schema: latestSchema,
  makeDefaults: () => ({}),
  migrations,
});

export const { load, save } = blob;
