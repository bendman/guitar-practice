import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

// Persistence is the single chokepoint allowed to touch Web Storage.
const noStorageRule = {
  "no-restricted-syntax": [
    "error",
    {
      selector: "Identifier[name='localStorage']",
      message: "Access localStorage only through src/persistence/* modules.",
    },
    {
      selector: "Identifier[name='sessionStorage']",
      message: "Access sessionStorage only through src/persistence/* modules.",
    },
  ],
};

export default defineConfig([
  globalIgnores(["dist", "src/routeTree.gen.ts"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // Ban direct Web Storage access in app source; only the persistence
  // chokepoint may touch it. Parse-only (no TS ruleset) to avoid changing the
  // lint baseline — this block exists solely to enforce the storage boundary.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/persistence/**"],
    languageOptions: {
      parser: tsParser,
      globals: globals.browser,
    },
    // Register react-hooks only so the inline `react-hooks/*` disable directives
    // in these files resolve; its rules stay off (not extended) to keep the
    // baseline unchanged. This block enforces the storage ban alone.
    plugins: { "react-hooks": reactHooks },
    // Those react-hooks rules are off here, so their inline disables look
    // "unused"; don't report that — they're meaningful to the js/jsx block.
    linterOptions: { reportUnusedDisableDirectives: "off" },
    rules: noStorageRule,
  },
]);
