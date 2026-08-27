import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const PACKAGE_JSON_PATH = join(import.meta.dirname, "..", "..", "package.json")
const packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8"))

describe("OCR asset copy script wiring", () => {
  it.each(["dev", "build"])(
    "invokes copyOcrAssets.mjs directly from the %s script",
    (scriptName) => {
      expect(packageJson.scripts[scriptName]).toContain("scripts/copyOcrAssets.mjs")
    },
  )

  it("does not rely on pnpm pre/post lifecycle hooks, which are disabled by default", () => {
    expect(packageJson.scripts.predev).toBeUndefined()
    expect(packageJson.scripts.prebuild).toBeUndefined()
  })
})
