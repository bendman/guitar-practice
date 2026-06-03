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
    case "builder":  return page.getByRole("dialog", { name: "Créer un accord" });
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

// Maps the stored naming value to the radio button's visible label.
const NAMING_LABEL: Record<string, string> = {
  solfege: "Do Re Mi",
  letters: "C D E",
};

When(
  "I set the note naming to {string}",
  async function (this: GuitarWorld, naming: string) {
    await this.page
      .getByRole("radiogroup", { name: "Notes écrites" })
      .getByRole("radio", { name: NAMING_LABEL[naming] })
      .click();
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
  await expect(this.page.getByRole("combobox", { name: "Voix" })).toBeVisible();
  await expect(this.page.getByRole("button", { name: "Écouter un aperçu" })).toBeVisible();
});

Then("previewing the voice does not error", async function (this: GuitarWorld) {
  const preview = this.page.getByRole("button", { name: "Écouter un aperçu" });
  await preview.click();
  // The button stays interactive (no crash / navigation away from settings).
  await expect(preview).toBeEnabled();
});

When(
  "I set the spoken note naming to {string}",
  async function (this: GuitarWorld, naming: string) {
    await this.page
      .getByRole("radiogroup", { name: "Notes parlées" })
      .getByRole("radio", { name: NAMING_LABEL[naming] })
      .click();
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

When("I select the QCM progression mode", async function (this: GuitarWorld) {
  await this.page.getByRole("button", { name: "QCM", exact: true }).click();
});

When("I select the {string} progression mode", async function (this: GuitarWorld, label: string) {
  await this.page.getByRole("button", { name: label, exact: true }).click();
});

Then("the practice should advance past the first card", async function (this: GuitarWorld) {
  await expect(this.page.getByRole("status")).not.toHaveText("#1", { timeout: 8_000 });
});

Then("the QCM mode should be disabled", async function (this: GuitarWorld) {
  await expect(this.page.getByRole("button", { name: "QCM", exact: true })).toBeDisabled();
});

function quizChoices(page: Page) {
  return page.getByRole("group", { name: "Choix d'accord" }).getByRole("button");
}

Then("the quiz should show 4 choices", async function (this: GuitarWorld) {
  await expect(quizChoices(this.page)).toHaveCount(4);
});

Then("the quiz choice names should be hidden", async function (this: GuitarWorld) {
  await expect(quizChoices(this.page).filter({ hasText: "?" })).toHaveCount(4);
});

When("I pick a quiz choice", async function (this: GuitarWorld) {
  await quizChoices(this.page).first().click();
});

Then("the quiz choice names should be revealed", async function (this: GuitarWorld) {
  await expect(quizChoices(this.page).filter({ hasText: "?" })).toHaveCount(0);
});

Then("the Next button should be disabled", async function (this: GuitarWorld) {
  await expect(this.page.getByRole("button", { name: "Suivant" })).toBeDisabled();
});

Then("the Next button should be enabled", async function (this: GuitarWorld) {
  await expect(this.page.getByRole("button", { name: "Suivant" })).toBeEnabled();
});

When("I advance to the next quiz round", async function (this: GuitarWorld) {
  await this.page.getByRole("button", { name: "Suivant" }).click();
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

// ---- Chord builder ------------------------------------------------------

When("I open the chord builder", async function (this: GuitarWorld) {
  await this.page.getByRole("button", { name: "Créer un accord" }).click();
});

Then("I should see the chord builder", async function (this: GuitarWorld) {
  await expect(this.page.getByRole("dialog", { name: "Créer un accord" })).toBeVisible();
});

function builder(page: Page) {
  return page.getByRole("dialog", { name: "Créer un accord" });
}

When("I select the chord root {string}", async function (this: GuitarWorld, root: string) {
  await builder(this.page)
    .getByRole("radiogroup", { name: "Fondamentale" })
    .getByRole("radio", { name: root, exact: true })
    .click();
});

When("I select the chord family {string}", async function (this: GuitarWorld, family: string) {
  await builder(this.page)
    .getByRole("radiogroup", { name: "Famille" })
    .getByRole("radio", { name: family, exact: true })
    .click();
});

When("I tap string {int} at fret {int}", async function (this: GuitarWorld, str: number, fret: number) {
  await builder(this.page).getByRole("button", { name: `corde ${str} case ${fret}` }).click();
});

When("I save the chord", async function (this: GuitarWorld) {
  await this.page.getByRole("button", { name: "Enregistrer" }).click();
});

Then("the save chord button should be disabled", async function (this: GuitarWorld) {
  await expect(this.page.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
});

Then("I should see the duplicate warning", async function (this: GuitarWorld) {
  await expect(this.page.getByText("Cet accord existe déjà")).toBeVisible();
});

When("I expand the chord {string}", async function (this: GuitarWorld, label: string) {
  await this.page.getByText(label, { exact: true }).click();
});

Then("I should see a custom voicing for {string}", async function (this: GuitarWorld, label: string) {
  await expect(this.page.getByRole("button", { name: `Supprimer la position 1 ${label}` })).toBeVisible();
});

When("I delete the custom voicing for {string}", async function (this: GuitarWorld, label: string) {
  await this.page.getByRole("button", { name: `Supprimer la position 1 ${label}` }).click();
});

Then("there should be no custom voicing for {string}", async function (this: GuitarWorld, label: string) {
  await expect(this.page.getByRole("button", { name: `Supprimer la position 1 ${label}` })).toHaveCount(0);
});

Then("the custom voicings store should contain {string}", async function (this: GuitarWorld, chordId: string) {
  const store = await this.readStorage<Record<string, unknown>>("guitar-practice-custom-voicings");
  expect(store?.[chordId]).toBeTruthy();
});

Then("the custom voicing {string} should have a barre", async function (this: GuitarWorld, chordId: string) {
  const store = await this.readStorage<Record<string, { barres?: unknown[] }[]>>("guitar-practice-custom-voicings");
  const voicing = store?.[chordId]?.[0];
  expect(voicing?.barres?.length ?? 0).toBeGreaterThan(0);
});

Then("the custom voicing {string} should not have a barre", async function (this: GuitarWorld, chordId: string) {
  const store = await this.readStorage<Record<string, { barres?: unknown[] }[]>>("guitar-practice-custom-voicings");
  const voicing = store?.[chordId]?.[0];
  expect(voicing?.barres?.length ?? 0).toBe(0);
});

Then("the custom voicings store should be empty", async function (this: GuitarWorld) {
  const store = await this.readStorage<Record<string, unknown>>("guitar-practice-custom-voicings");
  expect(store == null || Object.keys(store).length === 0).toBe(true);
});

When("I add a voicing from the session", async function (this: GuitarWorld) {
  await this.page.getByRole("button", { name: "Ajouter une position", exact: true }).click();
});

Then("I should be back at the revealed chord", async function (this: GuitarWorld) {
  // The "+" lives in the revealed state, which pauses the timer; returning
  // lands the user on the same revealed card with its grading controls.
  await expect(this.page.getByRole("button", { name: "Trouvé" })).toBeVisible();
});

Then(
  "the interval display should show {string}",
  async function (this: GuitarWorld, seconds: string) {
    await expect(this.page.getByText(`${seconds}.0s`)).toBeVisible();
  },
);
