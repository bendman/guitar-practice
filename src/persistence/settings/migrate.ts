import type { Migration } from "../createVersionedBlob";
import { StoredSettingsSchema } from "./schemas/v3";

export const LATEST_VERSION = 3;
export const latestSchema = StoredSettingsSchema;

/** `migrations[k]` upgrades vK → v(K+1). */
export const migrations: Record<number, Migration> = {
  // v2 only adds the optional `language` field; v1 data is valid v2 as-is.
  1: (data) => data,
  // v3 only adds the optional `theme` field; v2 data is valid v3 as-is. Leaving
  // it absent is meaningful — it means "follow the OS".
  2: (data) => data,
};
