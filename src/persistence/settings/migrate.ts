import type { Migration } from "../createVersionedBlob";
import { StoredSettingsSchema } from "./schemas/v2";

export const LATEST_VERSION = 2;
export const latestSchema = StoredSettingsSchema;

/** `migrations[k]` upgrades vK → v(K+1). */
export const migrations: Record<number, Migration> = {
  // v2 only adds the optional `language` field; v1 data is valid v2 as-is.
  1: (data) => data,
};
