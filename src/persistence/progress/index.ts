import { createVersionedBlob } from "../createVersionedBlob";
import * as statsV from "./stats/migrate";
import * as weightsV from "./weights/migrate";
import * as confusionsV from "./confusions/migrate";
import type { StoredStats } from "./stats/schemas/v1";
import type { Weights } from "./weights/schemas/v1";
import type { Confusions } from "./confusions/schemas/v1";

export type { StoredStats } from "./stats/schemas/v1";
export type { Weights } from "./weights/schemas/v1";
export type { Confusions } from "./confusions/schemas/v1";

export const stats = createVersionedBlob<StoredStats>({
  key: "guitar-practice-stats",
  latestVersion: statsV.LATEST_VERSION,
  schema: statsV.latestSchema,
  makeDefaults: () => ({}),
  migrations: statsV.migrations,
});

export const weights = createVersionedBlob<Weights>({
  key: "guitar-practice-weights",
  latestVersion: weightsV.LATEST_VERSION,
  schema: weightsV.latestSchema,
  makeDefaults: () => ({}),
  migrations: weightsV.migrations,
});

export const confusions = createVersionedBlob<Confusions>({
  key: "guitar-practice-confusions",
  latestVersion: confusionsV.LATEST_VERSION,
  schema: confusionsV.latestSchema,
  makeDefaults: () => ({}),
  migrations: confusionsV.migrations,
});
