import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createVersionedBlob, type Migration } from "./createVersionedBlob";

const KEY = "test-versioned-blob";
const V1Schema = z.object({ n: z.number() });
const V2Schema = z.object({ n: z.number(), label: z.string() });

function v1Blob() {
  return createVersionedBlob({
    key: KEY,
    latestVersion: 1,
    schema: V1Schema,
    makeDefaults: () => ({ n: 0 }),
    migrations: {},
  });
}

// A blob whose latest is v2, with a 1→2 step that adds a default `label`.
const oneToTwo: Migration = (data) => ({ ...(data as object), label: "migrated" });
function v2Blob() {
  return createVersionedBlob({
    key: KEY,
    latestVersion: 2,
    schema: V2Schema,
    makeDefaults: () => ({ n: 0, label: "default" }),
    migrations: { 1: oneToTwo },
  });
}

describe("createVersionedBlob", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns defaults (not ok) when the key is absent, without writing", () => {
    const { load } = v1Blob();
    expect(load()).toEqual({ kind: "defaulted", data: { n: 0 } });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("round-trips a valid value inside a { version, data } envelope", () => {
    const { load, save } = v1Blob();
    save({ n: 42 });
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ version: 1, data: { n: 42 } });
    expect(load()).toEqual({ kind: "ok", data: { n: 42 } });
  });

  it("reads a legacy unversioned value (no envelope) as v1", () => {
    // Pre-8b chokepoint wrote the bare payload with no envelope.
    localStorage.setItem(KEY, JSON.stringify({ n: 7 }));
    const { load } = v1Blob();
    expect(load()).toEqual({ kind: "ok", data: { n: 7 } });
  });

  it("migrates an older version up the chain to the latest", () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, data: { n: 5 } }));
    const { load } = v2Blob();
    expect(load()).toEqual({ kind: "ok", data: { n: 5, label: "migrated" } });
  });

  it("migrates a legacy unversioned value through the chain (treated as v1)", () => {
    localStorage.setItem(KEY, JSON.stringify({ n: 9 }));
    const { load } = v2Blob();
    expect(load()).toEqual({ kind: "ok", data: { n: 9, label: "migrated" } });
  });

  it("quarantines invalid JSON without clobbering the stored value", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(KEY, "{not json");
    const { load } = v1Blob();
    expect(load()).toEqual({ kind: "quarantined", data: { n: 0 } });
    expect(localStorage.getItem(KEY)).toBe("{not json");
  });

  it("quarantines a schema mismatch without clobbering the stored value", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const stored = JSON.stringify({ version: 1, data: { n: "oops" } });
    localStorage.setItem(KEY, stored);
    const { load } = v1Blob();
    expect(load()).toEqual({ kind: "quarantined", data: { n: 0 } });
    expect(localStorage.getItem(KEY)).toBe(stored);
  });

  it("quarantines (fails closed) a version newer than this build", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const stored = JSON.stringify({ version: 99, data: { n: 1, label: "x" } });
    localStorage.setItem(KEY, stored);
    const { load } = v2Blob();
    expect(load()).toEqual({ kind: "quarantined", data: { n: 0, label: "default" } });
    expect(localStorage.getItem(KEY)).toBe(stored);
  });

  it("quarantines when a required migration step is missing", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // latest v2 but no 1→2 migration registered.
    const broken = createVersionedBlob({
      key: KEY,
      latestVersion: 2,
      schema: V2Schema,
      makeDefaults: () => ({ n: 0, label: "default" }),
      migrations: {},
    });
    localStorage.setItem(KEY, JSON.stringify({ version: 1, data: { n: 1 } }));
    expect(broken.load().kind).toBe("quarantined");
  });
});
