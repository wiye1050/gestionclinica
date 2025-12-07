import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "functions/dist/**",
      "functions/lib/**",
      "next-env.d.ts",
      "set-roles.js",
    ],
  },
  // Reglas estrictas globales
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }], // Permitir console.warn y console.error
      "@typescript-eslint/no-explicit-any": "error", // Prohibir 'any'
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react-hooks/exhaustive-deps": "error", // Dependencias correctas en useEffect/useMemo
      "react-hooks/rules-of-hooks": "error", // Reglas de Hooks
      "no-debugger": "error", // Prohibir debugger
      "prefer-const": "error", // Preferir const
    },
  },
  {
    files: ["types/**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["scripts/**/*.{js,ts}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];

export default eslintConfig;
