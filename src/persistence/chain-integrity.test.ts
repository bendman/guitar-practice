import { describe, expect, it } from "vitest";
import { BLOBS } from "./registry";

// Discovered at build time by Vite — no node:fs needed, and the globs fail loudly
// if a schema/fixture file is added in the wrong place.
const SCHEMA_FILES = import.meta.glob("./**/schemas/v*.ts", { eager: false });
const FIXTURES = import.meta.glob("./__fixtures__/**/*.json", { eager: true });

/** Versions for which a frozen `schemas/vN.ts` file exists, ascending. */
function schemaVersions(schemaDir: string): number[] {
  const prefix = `./${schemaDir}/schemas/`;
  return Object.keys(SCHEMA_FILES)
    .filter((p) => p.startsWith(prefix))
    .map((p) => /\/v(\d+)\.ts$/.exec(p))
    .filter((m): m is RegExpExecArray => m != null)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

function fixture(name: string, version: number): unknown | undefined {
  const mod = FIXTURES[`./__fixtures__/${name}/v${version}.json`] as
    | { default: unknown }
    | undefined;
  return mod?.default;
}

describe("persistence chain integrity", () => {
  for (const entry of BLOBS) {
    describe(entry.name, () => {
      const versions = schemaVersions(entry.schemaDir);

      it("has at least a v1 schema file", () => {
        expect(versions).toContain(1);
      });

      it("LATEST_VERSION matches the highest schemas/vN.ts file", () => {
        expect(entry.latestVersion).toBe(Math.max(...versions));
      });

      it("has no gaps: every version 1..LATEST has a schema file", () => {
        const expected = Array.from({ length: entry.latestVersion }, (_, i) => i + 1);
        expect(versions).toEqual(expected);
      });

      it("has a migration step for every gap 1..LATEST-1", () => {
        for (let v = 1; v < entry.latestVersion; v++) {
          expect(typeof entry.migrations[v]).toBe("function");
        }
      });

      it("migrate() is a no-op when already at the latest version", () => {
        const value = { sentinel: true };
        expect(entry.blob.migrate(value, entry.latestVersion)).toBe(value);
      });

      it("has one fixture per version < LATEST, each migrating to a valid latest value", () => {
        for (let v = 1; v < entry.latestVersion; v++) {
          const data = fixture(entry.name, v);
          expect(data, `missing fixture __fixtures__/${entry.name}/v${v}.json`).toBeDefined();
          const migrated = entry.blob.migrate(data, v);
          const result = entry.latestSchema.safeParse(migrated);
          expect(result.success, `fixture ${entry.name}/v${v}.json failed latest schema`).toBe(
            true,
          );
        }
      });
    });
  }
});
