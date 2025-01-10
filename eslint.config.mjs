import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  // {
  //   rules: {
  //     // Disable rules causing current errors
  //     "@typescript-eslint/no-explicit-any": "off",
  //     "@typescript-eslint/no-unused-vars": "warn",
  //     "react/no-unescaped-entities": "off",
  //     "react-hooks/exhaustive-deps": "warn",
  //     // Add some reasonable defaults
  //     "no-console": "warn",
  //     "no-debugger": "warn"
  //   },
  //   ignorePatterns: [
  //     "node_modules/",
  //     ".next/",
  //     "dist/",
  //     "*.config.js",
  //     "*.config.mjs"
  //   ]
  // }
];

export default eslintConfig;
