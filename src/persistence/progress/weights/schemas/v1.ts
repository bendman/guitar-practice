// FROZEN — v1 schema. Append-only: never edit this file. To change the shape,
// add schemas/v2.ts and a 1→2 migration in ../migrate.ts.
import { z } from "zod";

export const WeightsSchema = z.record(z.string(), z.number());

export type Weights = z.infer<typeof WeightsSchema>;
