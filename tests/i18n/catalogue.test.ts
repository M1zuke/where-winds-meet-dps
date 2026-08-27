import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { collectStaticKeys } from "./sourceKeys"
import { collectContentKeys } from "./contentKeys"
import { writeFixture } from "../writeFixture"

const LOCALES_DIR = join(import.meta.dirname, "..", "..", "src", "i18n", "locales")
const ENGLISH_PATH = join(LOCALES_DIR, "en.json")
const KOREAN_PATH = join(LOCALES_DIR, "ko.json")
const REGENERATE = process.env.UPDATE_I18N_CATALOGUE === "1"

function read(path: string): Record<string, string> {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Record<string, string>) : {}
}

function sorted(catalogue: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(catalogue).sort(([left], [right]) => (left < right ? -1 : 1)),
  )
}

function usedKeys(): string[] {
  return collectStaticKeys().filter((key) => key.trim().length > 0)
}

function isContentKey(key: string): boolean {
  return key.startsWith("content.")
}

function topNamespace(key: string): string {
  return key.slice(0, key.indexOf("."))
}

function rebuiltEnglish(): Record<string, string> {
  const committed = read(ENGLISH_PATH)
  const content = collectContentKeys()
  const rebuilt: Record<string, string> = { ...content }
  const unauthored: string[] = []
  for (const key of usedKeys()) {
    if (key in rebuilt) continue
    const english = committed[key]
    if (english === undefined) unauthored.push(key)
    else rebuilt[key] = english
  }
  if (unauthored.length > 0)
    throw new Error(
      `en.json has no English for ${unauthored.length} key(s) — add it by hand:\n${unauthored.sort().join("\n")}`,
    )
  return sorted(rebuilt)
}

if (REGENERATE) {
  const english = rebuiltEnglish()
  const committedKorean = read(KOREAN_PATH)
  const korean: Record<string, string> = {}
  for (const key of Object.keys(english)) korean[key] = committedKorean[key] ?? ""
  await writeFixture(ENGLISH_PATH, english)
  await writeFixture(KOREAN_PATH, sorted(korean))
}

describe("translation catalogue", () => {
  const english = read(ENGLISH_PATH)
  const korean = read(KOREAN_PATH)
  const keys = usedKeys()

  it("carries English for every key the app renders", () => {
    const missing = keys.filter((key) => !(key in english))
    expect(
      missing.sort(),
      "add the English to en.json, then regenerate with UPDATE_I18N_CATALOGUE=1",
    ).toEqual([])
  })

  it("derives its content half from the registries", () => {
    const committedContent = Object.fromEntries(
      Object.entries(english).filter(([key]) => isContentKey(key)),
    )
    expect(committedContent, "regenerate with UPDATE_I18N_CATALOGUE=1").toEqual(
      sorted(collectContentKeys()),
    )
  })

  it("gives every locale the same key set", () => {
    expect(Object.keys(korean)).toEqual(Object.keys(english))
  })

  it("keeps its keys sorted so a translated diff stays readable", () => {
    for (const catalogue of [english, korean])
      expect(Object.keys(catalogue)).toEqual([...Object.keys(catalogue)].sort())
  })

  it("carries no key the app no longer renders", () => {
    const used = new Set([...keys, ...Object.keys(collectContentKeys())])
    const stale = Object.keys(english).filter((key) => !used.has(key))
    expect(stale.sort(), "regenerate with UPDATE_I18N_CATALOGUE=1").toEqual([])
  })

  it("shares one key for English repeated across features", () => {
    const namespacesByEnglish = new Map<string, Set<string>>()
    for (const [key, value] of Object.entries(english)) {
      if (isContentKey(key)) continue
      const namespaces = namespacesByEnglish.get(value) ?? new Set<string>()
      namespaces.add(topNamespace(key))
      namespacesByEnglish.set(value, namespaces)
    }
    const shared = [...namespacesByEnglish]
      .filter(([, namespaces]) => namespaces.size > 1)
      .map(([value]) => value)
    expect(shared.sort(), "move these under common.* and reuse the one key").toEqual([])
  })
})
