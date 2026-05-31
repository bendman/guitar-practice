// Cucumber configuration. Step definitions are TypeScript, loaded via the tsx
// loader registered through NODE_OPTIONS in the npm scripts.
const common = {
  import: ["tests/support/**/*.ts", "tests/steps/**/*.ts"],
  paths: ["tests/features/**/*.feature"],
  format: ["progress", "html:tests/report.html"],
  formatOptions: { snippetInterface: "async-await" },
};

// Default run: everything except the audio smoke test.
export default { ...common, tags: "not @audio" };

// `-p audio`: only the fake-audio microphone scenario (Chromium-only).
export const audio = { ...common, tags: "@audio" };
