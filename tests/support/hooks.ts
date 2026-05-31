import {
  AfterAll,
  Before,
  BeforeAll,
  After,
  Status,
  setDefaultTimeout,
} from "@cucumber/cucumber";
import { chromium, type Browser } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { GuitarWorld, HEADLESS } from "./world";

setDefaultTimeout(30_000);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TONE_WAV = path.resolve(__dirname, "../fixtures/tone.wav");

let browser: Browser;
let audioBrowser: Browser | null = null;

BeforeAll(async () => {
  browser = await chromium.launch({ headless: HEADLESS });
});

AfterAll(async () => {
  await browser?.close();
  await audioBrowser?.close();
});

// Default: a fresh, isolated context per scenario (clean localStorage).
Before({ tags: "not @audio" }, async function (this: GuitarWorld) {
  this.browser = browser;
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
});

// @audio: dedicated Chromium launched with fake-audio capture so the real
// usePitchDetection pipeline runs against a known WAV tone — no app mocking.
Before({ tags: "@audio" }, async function (this: GuitarWorld) {
  if (!audioBrowser) {
    audioBrowser = await chromium.launch({
      headless: HEADLESS,
      // Full Chromium (not the headless-shell) — its new headless mode supports
      // fake audio capture, which the default headless-shell does not.
      channel: "chromium",
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        `--use-file-for-fake-audio-capture=${TONE_WAV}`,
      ],
    });
  }
  this.browser = audioBrowser;
  this.context = await audioBrowser.newContext({
    permissions: ["microphone"],
  });
  this.page = await this.context.newPage();
});

After(async function (this: GuitarWorld, { result }) {
  if (result?.status === Status.FAILED && this.page) {
    const png = await this.page.screenshot();
    this.attach(png, "image/png");
  }
  await this.context?.close();
});
