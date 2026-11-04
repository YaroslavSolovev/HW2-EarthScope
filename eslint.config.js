export default [
  {
    files: ["src/**/*.{js,jsx}", "vite.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        document: "readonly",
        fetch: "readonly",
        AbortController: "readonly",
        ResizeObserver: "readonly",
      },
    },
    rules: { "no-undef": "error" },
  },
];
