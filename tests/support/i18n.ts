import fr from "../../src/i18n/locales/fr.json";
import en from "../../src/i18n/locales/en.json";

type Dict = { [k: string]: string | Dict };

/**
 * Resolve a dot-path key from the app's locale files (default French — the
 * suite pins the browser locale to fr-FR). Steps select elements through this
 * helper so test selectors can never drift from the real UI strings.
 * Supports the same `{{var}}` interpolation syntax as i18next.
 */
export function t(
  key: string,
  vars?: Record<string, string | number>,
  locale: "fr" | "en" = "fr",
): string {
  const root: Dict = locale === "en" ? (en as Dict) : (fr as Dict);
  const value = key
    .split(".")
    .reduce<
      string | Dict | undefined
    >((node, part) => (typeof node === "object" && node !== null ? node[part] : undefined), root);
  if (typeof value !== "string") throw new Error(`Missing ${locale} translation key: ${key}`);
  return value.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    if (!vars || !(name in vars)) throw new Error(`Missing interpolation "${name}" for ${key}`);
    return String(vars[name]);
  });
}
