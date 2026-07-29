/**
 * Colour-scheme handling.
 *
 * Three settings, two outcomes: "light" and "dark" pin the scheme, "system"
 * follows the OS. Pinning is expressed by stamping `data-theme` on <html>;
 * "system" removes the attribute so the `prefers-color-scheme` media query in
 * index.css takes over. The stylesheet defines the tokens for all three cases,
 * so nothing here needs to know a single colour — except the browser chrome,
 * which cannot read CSS and has to be told the resolved background.
 */
export type Theme = "light" | "dark" | "system";

export const THEMES: Theme[] = ["light", "dark", "system"];

/** The background each scheme actually paints, mirroring `--bg` in index.css. */
const CHROME: Record<"light" | "dark", string> = {
  light: "#eadcc0",
  dark: "#1b1510",
};

const prefersDark = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;

/** What `theme` means right now — "system" resolved against the OS. */
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "light" || theme === "dark") return theme;
  return prefersDark() ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);

  const resolved = resolveTheme(theme);
  // `color-scheme` is what makes form controls and scrollbars follow suit.
  root.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", CHROME[resolved]);
}

/**
 * Keeps the browser chrome in step while the OS scheme changes underneath us.
 * Only meaningful in "system" mode; returns a cleanup function.
 */
export function watchSystemTheme(theme: Theme, onChange: () => void): () => void {
  if (theme !== "system" || typeof matchMedia !== "function") return () => {};
  const mq = matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
