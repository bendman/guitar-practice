import type { ZodType } from "zod";

/**
 * Outcome of loading a persisted blob.
 * - `ok`         — value was present and (after any migration) matched the latest schema.
 * - `defaulted`  — nothing was stored; caller gets fresh defaults.
 * - `quarantined`— a value was present but unusable (invalid JSON, schema mismatch,
 *                  a `version` newer than this build, or a migration that threw).
 *                  Caller gets defaults and the stored value is left untouched, so a
 *                  newer build (or a fixed migration) can still recover it later.
 */
export type LoadResult<T> = { kind: "ok" | "defaulted" | "quarantined"; data: T };

/** Upgrades a vK payload to a v(K+1) payload. Receives/returns opaque data. */
export type Migration = (data: unknown) => unknown;

export interface VersionedBlobConfig<T> {
  /** localStorage key. */
  key: string;
  /** Schema version this build writes and validates against. */
  latestVersion: number;
  /** Schema for the latest payload shape. Live types are `z.infer<typeof schema>`. */
  schema: ZodType<T>;
  /** Fresh defaults, used whenever no usable value can be loaded. */
  makeDefaults: () => T;
  /** `migrations[k]` upgrades vK → v(K+1); one required for every k in 1..latestVersion-1. */
  migrations: Record<number, Migration>;
}

export interface VersionedBlob<T> {
  load(): LoadResult<T>;
  save(data: T): void;
  KEY: string;
  LATEST_VERSION: number;
  migrations: Record<number, Migration>;
  schema: ZodType<T>;
  makeDefaults: () => T;
  /** Run the migration chain from `fromVersion` to the latest. Throws on a bad step. */
  migrate(data: unknown, fromVersion: number): unknown;
}

type Envelope = { version: number; data: unknown };

/**
 * Pull a `{ version, data }` envelope out of a parsed value. Values written by the
 * pre-8b chokepoint are bare payloads (an array, a record, a settings bag) with no
 * envelope; treat those as version 1 so existing users keep their data.
 */
function unwrap(parsed: unknown): Envelope {
  if (
    parsed != null &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    typeof (parsed as Record<string, unknown>).version === "number" &&
    "data" in parsed
  ) {
    const env = parsed as Record<string, unknown>;
    return { version: env.version as number, data: env.data };
  }
  return { version: 1, data: parsed };
}

/**
 * Single versioned persistence chokepoint for one localStorage key.
 *
 * On disk the value is a `{ version, data }` envelope. On load: unwrap (legacy
 * unversioned values are read as v1), run the migration chain up to `latestVersion`,
 * then validate against `schema`. Anything that can't be recovered fails closed —
 * defaults are returned and the stored value is never overwritten.
 */
export function createVersionedBlob<T>(config: VersionedBlobConfig<T>): VersionedBlob<T> {
  const { key, latestVersion, schema, makeDefaults, migrations } = config;

  function migrate(data: unknown, fromVersion: number): unknown {
    let current = data;
    for (let v = fromVersion; v < latestVersion; v++) {
      const step = migrations[v];
      if (!step) throw new Error(`[persistence] "${key}" missing migration ${v}→${v + 1}`);
      current = step(current);
    }
    return current;
  }

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
      console.warn(`[persistence] "${key}" is not valid JSON; quarantining and using defaults.`);
      return { kind: "quarantined", data: makeDefaults() };
    }

    const { version, data } = unwrap(parsed);
    if (version > latestVersion) {
      console.warn(
        `[persistence] "${key}" version ${version} is newer than ${latestVersion}; quarantining and using defaults.`,
      );
      return { kind: "quarantined", data: makeDefaults() };
    }

    let migrated: unknown;
    try {
      migrated = migrate(data, version);
    } catch (err) {
      console.warn(`[persistence] "${key}" migration failed; quarantining and using defaults.`, err);
      return { kind: "quarantined", data: makeDefaults() };
    }

    const result = schema.safeParse(migrated);
    if (!result.success) {
      console.warn(
        `[persistence] "${key}" failed schema validation; quarantining and using defaults.`,
        result.error.issues,
      );
      return { kind: "quarantined", data: makeDefaults() };
    }
    return { kind: "ok", data: result.data };
  }

  function save(data: T): void {
    const result = schema.safeParse(data);
    const value = result.success ? result.data : data;
    try {
      localStorage.setItem(key, JSON.stringify({ version: latestVersion, data: value }));
    } catch {
      /* ignore quota / disabled storage */
    }
  }

  return { load, save, KEY: key, LATEST_VERSION: latestVersion, migrations, schema, makeDefaults, migrate };
}
