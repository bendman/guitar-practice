import { createBlob } from "../createBlob";
import { PreferredVoicingsSchema, type PreferredVoicings } from "./schema";

export type { PreferredVoicings } from "./schema";

const blob = createBlob<PreferredVoicings>(
  "guitar-practice-preferred-voicings",
  PreferredVoicingsSchema,
  () => ({}),
);

export const { load, save } = blob;
