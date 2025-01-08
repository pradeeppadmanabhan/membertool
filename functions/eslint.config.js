module.exports = [
  {
    files: ["**/*.{js,ts}"], // Apply to JS and TS files
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      "no-restricted-globals": ["error", "name", "length"],
      "prefer-arrow-callback": "error",
      quotes: ["error", "double", { allowTemplateLiterals: true }],
      "require-jsdoc": 0,
    },
  },
  {
    files: ["**/*.spec.*"], // Specific to test files
    languageOptions: {
      globals: { mocha: true },
    },
    rules: {},
  },
];
