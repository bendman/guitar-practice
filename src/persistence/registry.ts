import type { ZodType } from "zod";
import type { Migration, VersionedBlob } from "./createVersionedBlob";

import * as customPresets from "./customPresets";
import * as customVoicings from "./customVoicings";
import * as preferredVoicings from "./preferredVoicings";
import * as settings from "./settings";
import * as progress from "./progress";

/**
 * Every versioned blob in the app, keyed by a stable name. The name doubles as
 * the directory that holds its `schemas/v*.ts` files (relative to this file) and
 * the fixture folder name under `__fixtures__/`. The chain-integrity tests and
 * the append-only guard both walk this list, so a new blob only has to be added
 * here once.
 */
export interface BlobEntry {
  name: string;
  /** Directory (relative to src/persistence/) holding this blob's `schemas/`. */
  schemaDir: string;
  latestVersion: number;
  migrations: Record<number, Migration>;
  latestSchema: ZodType<unknown>;
  blob: VersionedBlob<unknown>;
}

export const BLOBS: BlobEntry[] = [
  {
    name: "customPresets",
    schemaDir: "customPresets",
    latestVersion: customPresets.blob.LATEST_VERSION,
    migrations: customPresets.blob.migrations,
    latestSchema: customPresets.blob.schema,
    blob: customPresets.blob,
  },
  {
    name: "customVoicings",
    schemaDir: "customVoicings",
    latestVersion: customVoicings.blob.LATEST_VERSION,
    migrations: customVoicings.blob.migrations,
    latestSchema: customVoicings.blob.schema,
    blob: customVoicings.blob,
  },
  {
    name: "preferredVoicings",
    schemaDir: "preferredVoicings",
    latestVersion: preferredVoicings.blob.LATEST_VERSION,
    migrations: preferredVoicings.blob.migrations,
    latestSchema: preferredVoicings.blob.schema,
    blob: preferredVoicings.blob,
  },
  {
    name: "settings",
    schemaDir: "settings",
    latestVersion: settings.blob.LATEST_VERSION,
    migrations: settings.blob.migrations,
    latestSchema: settings.blob.schema,
    blob: settings.blob,
  },
  {
    name: "stats",
    schemaDir: "progress/stats",
    latestVersion: progress.stats.LATEST_VERSION,
    migrations: progress.stats.migrations,
    latestSchema: progress.stats.schema,
    blob: progress.stats,
  },
  {
    name: "weights",
    schemaDir: "progress/weights",
    latestVersion: progress.weights.LATEST_VERSION,
    migrations: progress.weights.migrations,
    latestSchema: progress.weights.schema,
    blob: progress.weights,
  },
  {
    name: "confusions",
    schemaDir: "progress/confusions",
    latestVersion: progress.confusions.LATEST_VERSION,
    migrations: progress.confusions.migrations,
    latestSchema: progress.confusions.schema,
    blob: progress.confusions,
  },
];
