import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Config générale pour le backend Node.js (CommonJS)
  {
    files: ["**/*.{js,mjs,cjs}"],
    // Pas de redéfinition du plugin ici
    languageOptions: {
      globals: {
        ...globals.node,
        require: true,
        module: true,
        process: true,
        __dirname: true,
        exports: true,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
  // Config pour le frontend (si besoin)
  { files: ["**/*.{jsx,tsx}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  // Surcharge globale pour désactiver l'interdiction de require()
  {
    files: ["**/*.{js,mjs,cjs}"],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Bloc spécifique pour les tests Jest
  {
    files: ["tests/**/*.js", "**/*.test.js", "**/*.unit.test.js", "**/*.integration.test.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        test: true,
        expect: true,
        describe: true,
        beforeEach: true,
        beforeAll: true,
        afterEach: true,
        afterAll: true,
        jest: true,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
]);
