import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { collectStaticKeys } from "./sourceKeys"
import { collectContentKeys } from "./contentKeys"
import { writeFixture } from "../writeFixture"

const CATALOGUE_PATH = join(import.meta.dirname, "..", "..", "src", "i18n", "locales", "ko.json")
const REGENERATE = process.env.UPDATE_I18N_CATALOGUE === "1"

function expectedKeys(): string[] {
  return [...new Set([...collectStaticKeys(), ...collectContentKeys()])]
    .filter((key) => key.trim().length > 0)
    .sort()
}

function committed(): Record<string, string> {
  return existsSync(CATALOGUE_PATH)
    ? (JSON.parse(readFileSync(CATALOGUE_PATH, "utf8")) as Record<string, string>)
    : {}
}

function merged(keys: readonly string[], existing: Record<string, string>): Record<string, string> {
  const catalogue: Record<string, string> = {}
  for (const key of keys) catalogue[key] = existing[key] ?? ""
  return catalogue
}

if (REGENERATE) {
  await writeFixture(CATALOGUE_PATH, merged(expectedKeys(), committed()))
}

describe("translation catalogue", () => {
  const catalogue = committed()
  const keys = expectedKeys()

  it("has an entry for every translatable string in the app", () => {
    const missing = keys.filter((key) => !(key in catalogue))
    expect(
      missing,
      `${missing.length} untranslatable strings — regenerate with UPDATE_I18N_CATALOGUE=1`,
    ).toEqual([])
  })

  it("carries no entry the app no longer shows", () => {
    const known = new Set(keys)
    const stale = Object.keys(catalogue).filter((key) => !known.has(key))
    expect(stale, `regenerate with UPDATE_I18N_CATALOGUE=1`).toEqual([])
  })

  it("keeps its keys sorted so a translated diff stays readable", () => {
    expect(Object.keys(catalogue)).toEqual([...Object.keys(catalogue)].sort())
  })
})
