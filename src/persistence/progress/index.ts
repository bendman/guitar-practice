import { createBlob } from "../createBlob";
import {
  StatsSchema, WeightsSchema, ConfusionsSchema,
  type StoredStats, type Weights, type Confusions,
} from "./schema";

export type { StoredStats, Weights, Confusions } from "./schema";

export const stats = createBlob<StoredStats>(
  "guitar-practice-stats",
  StatsSchema,
  () => ({}),
);

export const weights = createBlob<Weights>(
  "guitar-practice-weights",
  WeightsSchema,
  () => ({}),
);

export const confusions = createBlob<Confusions>(
  "guitar-practice-confusions",
  ConfusionsSchema,
  () => ({}),
);
