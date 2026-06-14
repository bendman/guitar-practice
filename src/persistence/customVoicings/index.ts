import { createBlob } from "../createBlob";
import { CustomVoicingsSchema, type CustomVoicings } from "./schema";

export type { CustomVoicings, Voicing } from "./schema";

const blob = createBlob<CustomVoicings>(
  "guitar-practice-custom-voicings",
  CustomVoicingsSchema,
  () => ({}),
);

export const { load, save } = blob;
