import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "playwright/test";
import type { Page } from "playwright/test";
import type { GuitarWorld } from "../support/world";

function screenAnchor(page: Page, screen: string) {
  switch (screen) {
    case "welcome":  return page.getByText("Choisis un mode");
    case "config":   return page.getByRole("button", { name: "Commencer" });
    case "session":  return page.getByRole("button", { name: "Arrêter" });
    case "summary":  return page.getByRole("heading");
    case "settings": return page.getByRole("heading", { name: "Paramètres" });
    case "learning": return page.getByText("Learning details");
    default: throw new Error(`Unknown screen: ${screen}`);
  }
}

// ---- Navigation ---------------------------------------------------------

Given("I open the app", async function (this: GuitarWorld) {
  await this.open();
});

Given("the practice stats are cleared", async function (this: GuitarWorld) {
  await this.page.evaluate(() => window.localStorage.clear());
  await this.page.reload({ waitUntil: "domcontentloaded" });
});

When("I choose the {string} mode", async function (this: GuitarWorld, mode: string) {
  await this.page.getByRole("button", { name: mode }).click();
});

Then("I should see the {word} screen", async function (this: GuitarWorld, screen: string) {
  await expect(screenAnchor(this.page, screen)).toBeVisible();
});

When("I return to the home screen", async function (this: GuitarWorld) {
  await this.page.getByRole("button", { name: "Accueil" }).click();
});

When("I open my progress", async function (this: GuitarWorld) {
  await this.page.getByRole("button", { name: "Paramètres" }).click();
});

When("I leave my progress", async function (this: GuitarWorld) {
  await this.page.getByRole("button", { name: "Retour" }).click();
});

When("I reload the app", async function (this: GuitarWorld) {
  await this.page.reload({ waitUntil: "domcontentloaded" });
});

When(
  "I set the note naming to {string}",
  async function (this: GuitarWorld, naming: string) {
    await this.page.getByTestId(`note-naming-${naming}`).click();
  },
);

Then(
  "I should see the note {string} on the keyboard",
  async function (this: GuitarWorld, label: string) {
    await expect(this.page.getByRole("button", { name: label, exact: true })).toBeVisible();
  },
);

Then(
  "I should not see the note {string} on the keyboard",
  async function (this: GuitarWorld, label: string) {
    await expect(this.page.getByRole("button", { name: label, exact: true })).toHaveCount(0);
  },
);

Then("I should see the voice picker", async function (this: GuitarWorld) {
  await expect(this.page.getByTestId("voice-select")).toBeVisible();
  await expect(this.page.getByTestId("voice-preview")).toBeVisible();
});

Then("previewing the voice does not error", async function (this: GuitarWorld) {
  await this.page.getByTestId("voice-preview").click();
  // The button stays interactive (no crash / navigation away from settings).
  await expect(this.page.getByTestId("voice-preview")).toBeEnabled();
});

When(
  "I set the spoken note naming to {string}",
  async function (this: GuitarWorld, naming: string) {
    await this.page.getByTestId(`spoken-naming-${naming}`).click();
  },
);

Then(
  "the stored setting {string} should be {string}",
  async function (this: GuitarWorld, key: string, value: string) {
    const settings = await this.readStorage<Record<string, unknown>>("guitar-practice-settings");
    expect(settings?.[key]).toBe(value);
  },
);

// ---- Config -------------------------------------------------------------

When("I select the {string} preset", async function (this: GuitarWorld, label: string) {
  await this.page.getByRole("button", { name: label }).click();
});

When("I select the {string} progression", async function (this: GuitarWorld, label: string) {
  await this.page.getByRole("button", { name: label }).click();
});

Then("the chord total should be {string}", async function (this: GuitarWorld, total: string) {
  await expect(this.page.getByText(`${total} au total`)).toBeVisible();
});

When("I enable microphone detection", async function (this: GuitarWorld) {
  await this.page.getByRole("switch", { name: "Détecter les notes (micro)" }).click();
});

When("I start the session", async function (this: GuitarWorld) {
  await this.page.getByRole("button", { name: "Commencer" }).click();
});

// ---- Session ------------------------------------------------------------

When("I reveal the chord", async function (this: GuitarWorld) {
  await this.page.getByRole("button", { name: "Voir" }).click();
});

When("I grade the chord as {string}", async function (this: GuitarWorld, grade: string) {
  await this.page.getByRole("button", { name: grade }).click();
});

When("I stop the session", async function (this: GuitarWorld) {
  await this.page.getByRole("button", { name: "Arrêter" }).click();
});

When("I open the learning details", async function (this: GuitarWorld) {
  await this.page.getByRole("button", { name: "Details" }).click();
});

Then(
  "the detected note should be {string}",
  async function (this: GuitarWorld, label: string) {
    await expect(this.page.getByText(`Note · ${label}`)).toBeVisible({ timeout: 15_000 });
  },
);

// ---- Stats / persistence ------------------------------------------------

Then("the sessions stat should be {string}", async function (this: GuitarWorld, value: string) {
  const sessionsLabel = this.page.getByText("Sessions", { exact: true });
  await expect(sessionsLabel.locator("..").getByText(value, { exact: true })).toBeVisible();
});

When("I set the interval to {string}", async function (this: GuitarWorld, seconds: string) {
  await this.page.getByRole("slider", { name: "Intervalle" }).fill(seconds);
});

Then(
  "the interval display should show {string}",
  async function (this: GuitarWorld, seconds: string) {
    await expect(this.page.getByText(`${seconds}.0s`)).toBeVisible();
  },
);
