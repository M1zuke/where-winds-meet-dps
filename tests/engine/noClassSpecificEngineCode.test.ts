// The acceptance condition from docs/CLASSES.md § "One definition per class":
// adding a class must not require editing the engine. This is the mechanical half of that — the
// engine may not name a class, an inner way, or a skill.
import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { INNER_WAY_ID } from "../../src/data/innerWays/ids"

const ENGINE_DIR = join(process.cwd(), "src/engine")

function engineFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return engineFiles(path)
    return path.endsWith(".ts") ? [path] : []
  })
}

const sources = engineFiles(ENGINE_DIR).map((path) => ({
  path: path
    .slice(process.cwd().length + 1)
    .split("\\")
    .join("/"),
  text: readFileSync(path, "utf8"),
}))

// `defaults.ts` is the build a new user starts on — seed content, not logic.
// Naming a class there is the point of the file.
const SEED_CONTENT = new Set(["src/engine/defaults.ts"])

describe("the engine names no class", () => {
  it("mentions no class id", () => {
    const offenders = sources
      .filter(({ path }) => !SEED_CONTENT.has(path))
      .filter(({ text }) => CLASS_IDS().some((classId) => text.includes(`"${classId}"`)))
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })

  it("mentions no inner-way id", () => {
    const innerWayIds = Object.values(INNER_WAY_ID)
    const offenders = sources
      .filter(({ path }) => !SEED_CONTENT.has(path))
      .filter(({ text }) => innerWayIds.some((id) => text.includes(`"${id}"`)))
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })

  it("compares no display name against a literal", () => {
    const patterns = [/skill\.name === "/, /debuff\.name === "/, /\.name === "[A-Z]/]
    const offenders = sources
      .filter(({ text }) => patterns.some((pattern) => pattern.test(text)))
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })

  it("pairs no two entities by comparing their display names", () => {
    const offenders = sources
      .filter(({ text }) => /\.name (===|!==) \w+\.name\b/.test(text))
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })

  it("matches no cast tag by prefix", () => {
    const offenders = sources
      .filter(({ text }) => /castTag\.startsWith|anyTagStartsWith/.test(text))
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })
})
