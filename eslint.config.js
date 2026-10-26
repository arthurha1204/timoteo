// Regras mínimas: pegam variável não definida e sobra de código. Não mexem em estilo.
import globals from "globals";

const navegador = { ...globals.browser, L: "readonly", QRCode: "readonly" };

export default [
  { ignores: ["vendor/**", "data/**", "node_modules/**", "docs/**"] },
  {
    files: ["js/**/*.js", "sw.js"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: { ...navegador, ...globals.serviceworker } },
    rules: { "no-undef": "error", "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }], "no-redeclare": "error", "no-dupe-keys": "error", "no-unreachable": "warn" }
  },
  {
    files: ["tests/**/*.js", "tests/**/*.mjs", "scripts/**/*.mjs", "supabase/**/*.mjs", "eslint.config.js"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: { ...globals.node, WebSocket: "readonly" } },
    rules: { "no-undef": "error", "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }], "no-redeclare": "error" }
  }
];
