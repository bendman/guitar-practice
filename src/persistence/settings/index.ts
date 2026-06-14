import { createBlob } from "../createBlob";
import { StoredSettingsSchema, type StoredSettings } from "./schema";

export type { StoredSettings } from "./schema";

const blob = createBlob<StoredSettings>(
  "guitar-practice-settings",
  StoredSettingsSchema,
  () => ({}),
);

export const { load, save } = blob;
