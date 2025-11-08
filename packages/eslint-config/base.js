import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      "max-len": ["error", {"code": 120, "ignoreUrls": true}],
      "quotes": ["error", "single", { "avoidEscape": true, "allowTemplateLiterals": false }],
      "no-unmodified-loop-condition": "error",
      "default-param-last": ["error"],
      "dot-notation": "error",
      "eqeqeq": ["error", "always"],
      "func-name-matching": "error",
      "func-style": ["error", "declaration", { "allowArrowFunctions": true }],
      "max-lines-per-function": ["error", { "max": 45 }],
      "max-params": ["error", 3],
      "multiline-comment-style": ["error", "starred-block"],
      "new-cap": ["error", {
        "newIsCap": true,
        "capIsNew": true,
        "properties": false
      }],
      "no-bitwise": "error",
      "no-console": ["error", { "allow": ["warn", "error", "info"] }],
      "no-global-assign": "error",
      "no-param-reassign": "error",
      "no-new-func": "error",
      "no-new-wrappers": "error",
      "no-sequences": "error",
      "no-script-url": "error",
      "no-unused-expressions": ["error", { "allowShortCircuit": true }],
      "no-useless-call": "error",
      "no-useless-concat": "error",
      "no-useless-rename": "error",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-destructuring": "error",
      "require-await": "error",
      "prefer-spread": "error",
      "sort-imports": ["error", {
        "ignoreCase": false,
        "ignoreDeclarationSort": false,
        "ignoreMemberSort": false,
        "memberSyntaxSortOrder": ["none", "all", "multiple", "single"],
        "allowSeparatedGroups": false
      }],
      "sort-vars": "error",
      "spaced-comment": ["error", "always"],
      "yoda": ["error", "never"],
      "comma-dangle": ["error", "never", { "object": "only-multiline" }],
      "comma-style": ["error", "last"],
      "indent": ["error", "tab"],
      "no-extra-parens": "error",
      "no-multi-spaces": "error",
      "no-multiple-empty-lines": "error"
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
];
