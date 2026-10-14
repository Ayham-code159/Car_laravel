import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".npm-cache/**",
      "test-results/**",
      "playwright-report/**",
      "scripts/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      "react-hooks/incompatible-library": "off",
    },
  },
  {
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        sessionStorage: "readonly",
        localStorage: "readonly",
        FormData: "readonly",
        File: "readonly",
        AbortSignal: "readonly",
        AbortController: "readonly",
        Date: "readonly",
        Intl: "readonly",
        URL: "readonly",
        Event: "readonly",
        BeforeUnloadEvent: "readonly",
        createImageBitmap: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        queueMicrotask: "readonly",
        process: "readonly",
      },
    },
  },
);
