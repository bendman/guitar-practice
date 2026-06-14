import { setWorldConstructor, World, type IWorldOptions } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "playwright";

// Base URL respects Vite's `base: '/guitar-practice/'`. Override with BASE_URL.
export const BASE_URL =
  process.env.BASE_URL ?? "http://localhost:4173/guitar-practice/";

export const HEADLESS = process.env.HEADLESS !== "false";

export class GuitarWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  /** Carries the root label between "I select the chord root" and "I select the chord family" steps. */
  pendingChordRoot: string = "";

  constructor(options: IWorldOptions) {
    super(options);
  }

  /** Navigate to the app root and wait for the SPA to mount. */
  async open(): Promise<void> {
    await this.page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  }

  /**
   * Read the persisted payload out of the app's real localStorage. Values are
   * stored in a `{ version, data }` envelope by the persistence chokepoint; this
   * unwraps it so steps assert against the payload, not the versioning mechanics.
   */
  async readStorage<T>(key: string): Promise<T | null> {
    return this.page.evaluate((k) => {
      const raw = window.localStorage.getItem(k);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (
        parsed != null &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        typeof (parsed as Record<string, unknown>).version === "number" &&
        "data" in parsed
      ) {
        return (parsed as { data: unknown }).data;
      }
      return parsed;
    }, key) as Promise<T | null>;
  }
}

setWorldConstructor(GuitarWorld);
