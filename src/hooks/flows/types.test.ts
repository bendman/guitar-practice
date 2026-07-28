import { describe, it, expect } from "vitest";
import { flowForMode, usesWorkingSet } from "./types";

describe("flowForMode", () => {
  it("always runs notes through the timed flow", () => {
    expect(flowForMode("notes", "manual")).toBe("timed");
    expect(flowForMode("notes", "auto")).toBe("timed");
    expect(flowForMode("notes", "quiz")).toBe("timed");
  });

  it("maps each chord mode to its flow", () => {
    expect(flowForMode("chords", "manual")).toBe("reveal");
    expect(flowForMode("chords", "auto")).toBe("timed");
    expect(flowForMode("chords", "quiz")).toBe("quiz");
  });
});

describe("usesWorkingSet", () => {
  it("applies to the graded chord flows, which earn the weights that rotate it", () => {
    expect(usesWorkingSet("chords", "reveal")).toBe(true);
    expect(usesWorkingSet("chords", "quiz")).toBe(true);
  });

  it("never applies to notes, so every selected note stays askable", () => {
    expect(usesWorkingSet("notes", "timed")).toBe(false);
    expect(usesWorkingSet("notes", "reveal")).toBe(false);
    expect(usesWorkingSet("notes", "quiz")).toBe(false);
  });

  it("does not apply to the ungraded chord carousel", () => {
    expect(usesWorkingSet("chords", "timed")).toBe(false);
  });
});
