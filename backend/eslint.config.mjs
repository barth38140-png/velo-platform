import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    settings: {
      react: { version: 'detect' }
    },
  },
  {
    files: ["tests/**/*.js", "**/*.test.js", "**/*.unit.test.js", "**/*.integration.test.js"],
    rules: {
      "no-unused-vars": "warn",
      "no-empty": "warn",
      "no-unreachable": "warn"
    }
  },
  pluginReact.configs.flat.recommended,
]);
