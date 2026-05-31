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

  constructor(options: IWorldOptions) {
    super(options);
  }

  /** Navigate to the app root and wait for the SPA to mount. */
  async open(): Promise<void> {
    await this.page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  }

  /** Read a JSON value out of the app's real localStorage. */
  async readStorage<T>(key: string): Promise<T | null> {
    return this.page.evaluate((k) => {
      const raw = window.localStorage.getItem(k);
      return raw ? (JSON.parse(raw) as unknown) : null;
    }, key) as Promise<T | null>;
  }
}

setWorldConstructor(GuitarWorld);
