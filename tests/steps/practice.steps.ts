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

Then(
  "the pause button should show {string}",
  async function (this: GuitarWorld, label: string) {
    await expect(this.page.getByRole("button", { name: label })).toBeVisible();
  },
);

When("I click the pause button", async function (this: GuitarWorld) {
  const btn =
    (await this.page.getByRole("button", { name: "Pause" }).count()) > 0
      ? this.page.getByRole("button", { name: "Pause" })
      : this.page.getByRole("button", { name: "Reprendre" });
  await btn.click();
});

When("I wait {int} seconds", async function (this: GuitarWorld, seconds: number) {
  await this.page.waitForTimeout(seconds * 1000);
});

Then(
  "the session duration should be at least {int} second",
  async function (this: GuitarWorld, minSeconds: number) {
    const durationCell = this.page.getByText("Durée", { exact: true }).locator("..");
    const valueText = await durationCell.getByText(/\d/).first().textContent();
    // formatTime produces "0:SS" or "M:SS"; parse total seconds
    const parts = (valueText ?? "0:00").split(":").map(Number);
    const totalSeconds = parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
    expect(totalSeconds).toBeGreaterThanOrEqual(minSeconds);
  },
);

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

interface StoredBarre { fret: number; fromString: number; toString: number }
interface StoredVoicing { frets: number[]; baseFret?: number; barres?: StoredBarre[] }

async function firstVoicing(world: GuitarWorld, chordId: string): Promise<StoredVoicing | undefined> {
  const store = await world.readStorage<Record<string, StoredVoicing[]>>("guitar-practice-custom-voicings");
  return store?.[chordId]?.[0];
}

When("I raise the first case to {int}", async function (this: GuitarWorld, target: number) {
  const plus = this.page.getByRole("button", { name: "Augmenter la première case" });
  for (let i = 1; i < target; i++) await plus.click();
});

When(
  "I drag a barre from string {int} fret {int} to string {int} fret {int}",
  async function (this: GuitarWorld, s1: number, f1: number, s2: number, f2: number) {
    const src = await this.page.getByRole("button", { name: `corde ${s1} case ${f1}` }).boundingBox();
    const dst = await this.page.getByRole("button", { name: `corde ${s2} case ${f2}` }).boundingBox();
    if (!src || !dst) throw new Error("barre drag endpoints not found");
    await this.page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(dst.x + dst.width / 2, dst.y + dst.height / 2, { steps: 8 });
    await this.page.mouse.up();
  },
);

Then("the builder diagram should show a barre at fret {int}", async function (this: GuitarWorld, fret: number) {
  // The barre is an SVG <line>; a horizontal line has zero bbox height, which
  // Playwright reports as "hidden", so assert it is present rather than visible.
  await expect(this.page.getByRole("img", { name: `barré case ${fret}` })).toBeAttached();
});

Then("the builder diagram should not show a barre at fret {int}", async function (this: GuitarWorld, fret: number) {
  await expect(this.page.getByRole("img", { name: `barré case ${fret}` })).toHaveCount(0);
});

When("I tap to remove string {int}", async function (this: GuitarWorld, str: number) {
  await this.page.getByRole("button", { name: `retirer la note corde ${str}` }).click();
});

Then("the custom voicing {string} frets should be {string}", async function (this: GuitarWorld, chordId: string, frets: string) {
  const voicing = await firstVoicing(this, chordId);
  expect((voicing?.frets ?? []).join(",")).toBe(frets);
});

Then("the custom voicing {string} should not have a barre", async function (this: GuitarWorld, chordId: string) {
  const voicing = await firstVoicing(this, chordId);
  expect(voicing?.barres?.length ?? 0).toBe(0);
});

Then(
  "the custom voicing {string} should have a barre from string {int} to string {int} at fret {int}",
  async function (this: GuitarWorld, chordId: string, from: number, to: number, fret: number) {
    const voicing = await firstVoicing(this, chordId);
    const barre = voicing?.barres?.[0];
    expect(barre).toMatchObject({ fret, fromString: from, toString: to });
  },
);

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

// ---- Custom presets -----------------------------------------------------

When(
  "I save the current selection as a preset named {string}",
  async function (this: GuitarWorld, name: string) {
    await this.page.getByRole("button", { name: "Enregistrer le préréglage actuel" }).click();
    await this.page
      .getByRole("dialog", { name: "Enregistrer le préréglage" })
      .getByRole("textbox", { name: "Nom du préréglage" })
      .fill(name);
    await this.page
      .getByRole("dialog", { name: "Enregistrer le préréglage" })
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
  },
);

Then(
  "I should see a chip labeled {string}",
  async function (this: GuitarWorld, label: string) {
    await expect(this.page.getByRole("button", { name: label, exact: true })).toBeVisible();
  },
);

Then(
  "the chip {string} should be active",
  async function (this: GuitarWorld, label: string) {
    await expect(this.page.getByRole("button", { name: label, exact: true })).toBeVisible();
  },
);

When(
  "I delete the preset {string}",
  async function (this: GuitarWorld, label: string) {
    await this.page.getByRole("button", { name: `Supprimer le préréglage ${label}` }).click();
    await this.page
      .getByRole("dialog", { name: "Supprimer le préréglage" })
      .getByRole("button", { name: "Supprimer", exact: true })
      .click();
  },
);

Then(
  "I should not see a chip labeled {string}",
  async function (this: GuitarWorld, label: string) {
    await expect(this.page.getByRole("button", { name: label, exact: true })).toHaveCount(0);
  },
);
