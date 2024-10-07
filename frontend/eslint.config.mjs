import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ["**/Graph.js", "**/useGraph.js"],
  },
  ...compat.extends("plugin:react/recommended", "plugin:prettier/recommended"),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },

      ecmaVersion: 12,
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      "import/resolver": {
        node: {
          paths: ["src"],
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
        react: {
          version: "17",
        },
      },
    },

    rules: {
      "no-param-reassign": 0,
      "no-console": 0,
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-props-no-spreading": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "react/jsx-no-bind": "off",

      "react/jsx-filename-extension": [
        1,
        {
          extensions: [".js", ".jsx", ".ts", ".tsx", ".test.js"],
        },
      ],
      "prettier/prettier": [
        "warn",
        {
          endOfLine: "auto",
        },
      ],

      "no-unused-vars": "warn",
      "no-underscore-dangle": "off",
    },
  },
];
