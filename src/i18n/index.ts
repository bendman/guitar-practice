import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { load as loadSettings } from "../persistence/settings";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

export type Language = "fr" | "en";

/** Language persisted in the settings blob, if the user ever chose one. */
export function storedLanguage(): Language | undefined {
  const { language } = loadSettings().data;
  return language;
}

const persisted = storedLanguage();

const instance = persisted ? i18n : i18n.use(LanguageDetector);

instance.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  // The persisted setting wins; only fall back to navigator detection when the
  // user never chose a language. The detector must not cache (the settings
  // blob is the single source of truth).
  ...(persisted ? { lng: persisted } : {}),
  detection: { order: ["navigator"], caches: [] },
  fallbackLng: "fr",
  supportedLngs: ["fr", "en"],
  load: "languageOnly",
  interpolation: { escapeValue: false },
});

function applyLanguageToDocument(lng: string) {
  document.documentElement.lang = lng;
  document.title = i18n.t("welcome.title");
}

i18n.on("languageChanged", applyLanguageToDocument);
applyLanguageToDocument(i18n.resolvedLanguage ?? "fr");

/** The language currently in effect (persisted choice or detected). */
export function effectiveLanguage(): Language {
  return i18n.resolvedLanguage === "en" ? "en" : "fr";
}

export default i18n;
