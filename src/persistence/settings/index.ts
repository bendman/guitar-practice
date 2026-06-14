import { createVersionedBlob } from "../createVersionedBlob";
import { LATEST_VERSION, latestSchema, migrations } from "./migrate";
import type { StoredSettings } from "./schemas/v1";

export type { StoredSettings } from "./schemas/v1";

export const blob = createVersionedBlob<StoredSettings>({
  key: "guitar-practice-settings",
  latestVersion: LATEST_VERSION,
  schema: latestSchema,
  makeDefaults: () => ({}),
  migrations,
});

export const { load, save } = blob;
