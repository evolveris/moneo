import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

const tsFiles = ["**/*.ts", "**/*.tsx", "**/*.mts"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Type-aware rules (for example no-floating-promises) need the TypeScript
  // project, so they only apply to TypeScript files, not to config files.
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: tsFiles,
  })),
  {
    files: tsFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    rules: {
      eqeqeq: ["error", "always"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // All database access goes through data functions (AGENTS.md).
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@neondatabase/serverless",
              message:
                "Import the driver only in src/lib/db.ts. Use getSql() or a data function.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/lib/db.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  // Must come last: turns off rules that would fight Prettier.
  prettier,
  // Always use braces, even for one-line if, else and loops. eslint-config-prettier
  // lists curly as a rule that can be turned on again safely with "all".
  { rules: { curly: ["error", "all"] } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
