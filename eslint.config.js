import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "playwright-report", "test-results", "blob-report"]),
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    rules: {
      // Las páginas cargan datos con useEffect + setState. Queda como aviso hasta
      // pasar esa carga a un hook común (o TanStack Query); luego volver a "error".
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: ["e2e/**/*.ts", "*.config.ts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.node },
  },
]);
