import { createFileRoute } from "@tanstack/react-router";
import GuitarPractice from "../App";

type PracticeSearch = { mode?: "notes" | "chords" };

export const Route = createFileRoute("/practice")({
  validateSearch: (search: Record<string, unknown>): PracticeSearch => ({
    mode: search.mode === "notes" || search.mode === "chords" ? search.mode : undefined,
  }),
  component: GuitarPractice,
});
