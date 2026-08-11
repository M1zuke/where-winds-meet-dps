// The ban list is derived from the registries rather than hand-written, so
// content added later is covered without editing this file.
import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { CLASS_DEFS } from "../../src/definitions/classes/registry"
import { INNER_WAYS } from "../../src/definitions/innerWays/registry"
import { SET_DEFS } from "../../src/definitions/sets/registry"
import { allBuffDefsDeduped, groupBuffDefs } from "../../src/engine/buffs/data"

const DOCS_DIR = join(process.cwd(), "docs")

// Ordinary English that happens to also be a content name. A rule may use these
// words for the concept; only the entity is banned, and these are
// indistinguishable from prose.
const GENERIC_TERMS = new Set(
  [
    "Delay",
    "Damage Over Time",
    "HP Shield",
    "Healer Buff",
    "Perfect Dodge",
    "Mirage",
    "Mirage Bonus",
    "Combustion",
  ].map((term) => term.toLowerCase()),
)

// A class name is a project constraint, not skill content: which classes are
// validated, and that the suite is scoped to one of them, are rules an
// implementer has to satisfy. Everywhere else in `docs/` they are content.
const CLASS_NAMES_ALLOWED_IN = new Set(["CLASSES.md", "TESTING.md", "REFERENCE-DATA.md"])

function docFiles(): string[] {
  return readdirSync(DOCS_DIR).filter((entry) => entry.endsWith(".md"))
}

// "Hawkwing (4-pc)" must also ban the bare "Hawkwing" a doc would actually
// write.
function withoutQualifier(name: string): string[] {
  const base = name.split(" (")[0].trim()
  return base === name ? [name] : [name, base]
}

function contentTerms(): string[] {
  const classDefs = CLASS_DEFS()
  const skills = classDefs.flatMap((classDef) => classDef.skills)
  const debuffs = classDefs.flatMap((classDef) => classDef.debuffs)
  const gateBuffs = classDefs.flatMap((classDef) => classDef.gateBuffs)
  const buffModules = [...allBuffDefsDeduped(), ...groupBuffDefs()]

  const named = [...skills, ...debuffs, ...gateBuffs, ...buffModules, ...INNER_WAYS, ...SET_DEFS]
  const terms = named.flatMap((entity) => [...withoutQualifier(entity.name), entity.id])

  return [...new Set(terms)]
    .filter((term) => term.length >= 4)
    .filter((term) => !GENERIC_TERMS.has(term.toLowerCase()))
}

function classTerms(): string[] {
  return CLASS_DEFS().flatMap((classDef) => [classDef.id, classDef.displayName])
}

function offendingLines(text: string, term: string): number[] {
  return text
    .split("\n")
    .map((line, index) => (line.includes(term) ? index + 1 : 0))
    .filter((lineNumber) => lineNumber > 0)
}

describe("docs stay general", () => {
  const terms = contentTerms()

  it("derives a non-trivial ban list from the registries", () => {
    expect(terms.length).toBeGreaterThan(50)
  })

  it.each(docFiles())("%s names no skill, buff, debuff, inner way or gear set", (file) => {
    const text = readFileSync(join(DOCS_DIR, file), "utf8")
    const found = terms
      .filter((term) => text.includes(term))
      .map((term) => `${term} (line ${offendingLines(text, term).join(", ")})`)
    expect(found).toEqual([])
  })

  it.each(docFiles())("%s carries no date", (file) => {
    const text = readFileSync(join(DOCS_DIR, file), "utf8")
    const found = [...text.matchAll(/\b20\d{2}-\d{2}-\d{2}\b/g)].map((match) => match[0])
    expect(found).toEqual([])
  })

  it.each(docFiles().filter((file) => !CLASS_NAMES_ALLOWED_IN.has(file)))(
    "%s names no class",
    (file) => {
      const text = readFileSync(join(DOCS_DIR, file), "utf8")
      const found = classTerms().filter((term) => text.includes(term))
      expect(found).toEqual([])
    },
  )
})
