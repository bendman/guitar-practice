import type { ZodType } from "zod";

/**
 * Outcome of loading a persisted blob.
 * - `ok`        — value was present and matched the schema.
 * - `defaulted` — value was missing or failed to parse; caller gets fresh defaults
 *                 and nothing is written back (so malformed data is never clobbered
 *                 silently, and a valid value can still be restored later).
 */
export type LoadResult<T> = { kind: "ok" | "defaulted"; data: T };

/**
 * Single persistence chokepoint for one localStorage key.
 *
 * Every read/write of `key` must go through the returned `load`/`save`; the
 * ESLint `localStorage` ban keeps direct access out of the rest of the tree.
 * `load` validates against `schema` and falls back to `makeDefaults()` (with a
 * console warning) on any failure; `save` stringifies the canonical parsed value.
 */
export function createBlob<T>(key: string, schema: ZodType<T>, makeDefaults: () => T) {
  function load(): LoadResult<T> {
    let raw: string | null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      return { kind: "defaulted", data: makeDefaults() };
    }
    if (raw == null) return { kind: "defaulted", data: makeDefaults() };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn(`[persistence] "${key}" is not valid JSON; using defaults.`);
      return { kind: "defaulted", data: makeDefaults() };
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      console.warn(`[persistence] "${key}" failed schema validation; using defaults.`, result.error.issues);
      return { kind: "defaulted", data: makeDefaults() };
    }
    return { kind: "ok", data: result.data };
  }

  function save(data: T): void {
    const result = schema.safeParse(data);
    const value = result.success ? result.data : data;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / disabled storage */
    }
  }

  return { load, save, KEY: key };
}
