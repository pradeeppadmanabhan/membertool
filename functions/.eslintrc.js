module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: ["eslint:recommended", "google", "plugin:prettier/recommended"],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    quotes: ["error", "double", { allowTemplateLiterals: true }],
    "comma-dangle": "off", // Turn off ESLint's comma-dangle rule
    "prettier/prettier": [
      "error",
      {
        // Let Prettier handle comma-dangle
        // ... other Prettier options
        trailingComma: "es5", // Or 'all' or 'none' depending on your preference
      },
    ],
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
