import type { Migration } from "../../createVersionedBlob";
import { StatsSchema } from "./schemas/v1";

export const LATEST_VERSION = 1;
export const latestSchema = StatsSchema;

/** `migrations[k]` upgrades vK → v(K+1). Empty until a v2 shape exists. */
export const migrations: Record<number, Migration> = {};
