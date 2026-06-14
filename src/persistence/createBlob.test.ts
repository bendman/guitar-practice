import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createBlob } from "./createBlob";

const Schema = z.object({ n: z.number() });
const KEY = "test-blob";

function makeBlob() {
  return createBlob(KEY, Schema, () => ({ n: 0 }));
}

describe("createBlob", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns defaults (not ok) when the key is absent, without writing", () => {
    const { load } = makeBlob();
    const result = load();
    expect(result).toEqual({ kind: "defaulted", data: { n: 0 } });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("round-trips a valid value", () => {
    const { load, save } = makeBlob();
    save({ n: 42 });
    expect(load()).toEqual({ kind: "ok", data: { n: 42 } });
  });

  it("falls back to defaults on invalid JSON without clobbering the stored value", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(KEY, "{not json");
    const { load } = makeBlob();
    expect(load()).toEqual({ kind: "defaulted", data: { n: 0 } });
    expect(localStorage.getItem(KEY)).toBe("{not json");
  });

  it("falls back to defaults on schema mismatch without clobbering the stored value", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(KEY, JSON.stringify({ n: "oops" }));
    const { load } = makeBlob();
    expect(load()).toEqual({ kind: "defaulted", data: { n: 0 } });
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify({ n: "oops" }));
  });
});
