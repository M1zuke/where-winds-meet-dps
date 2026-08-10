/** @type {import("prettier").Config} */
export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: false,
  quoteProps: "as-needed",
  jsxSingleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",
  endOfLine: "auto",
  overrides: [
    {
      // Data tables read as rows; one record per line beats width-based wrapping.
      files: [
        "src/data/**/*.json",
        "tests/**/*.json",
        "src/data/skills/bellstrike-umbra/*.ts",
        "src/data/skills/universal/*.ts",
        "src/data/skills/buffs/*.ts",
      ],
      options: { printWidth: 120 },
    },
  ],
}
