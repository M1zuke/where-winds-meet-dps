import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { beforeEach, describe, expect, it } from "vitest"
import { loadCustomSkills } from "../../src/storage"
import {
  LATEST_CUSTOM_SKILLS_VERSION,
  migrateNeverAbradesSkill,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { MYSTIC_ARTS_CLASS_ID, type Skill } from "../../src/engine/skill"
import { migrateMysticId } from "../../src/migrations"

const SKILLS_KEY = "wwm.customSkills"
const ROOT = join(process.cwd(), "tests/migrations/testCustomSkills")
const CLASS = "bellstrikeUmbra"

type StoreFile = { v: number; skills: Skill[] }
type Fixture = { version: number; blob: StoreFile }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

function allFixtures(): Fixture[] {
  return readdirSync(ROOT)
    .filter((entry) => statSync(join(ROOT, entry)).isDirectory())
    .map((folder) => ({
      version: Number(folder.slice(1)),
      blob: JSON.parse(readFileSync(join(ROOT, folder, "store.json"), "utf8")) as Fixture["blob"],
    }))
    .sort((left, right) => left.version - right.version)
}

const FIXTURES = allFixtures()
const OLDEST = FIXTURES[0]

const cases = (list: Fixture[]): [string, Fixture][] =>
  list.map((fixture) => [`v${fixture.version}`, fixture])

const rowOf = (hit: Skill["hits"][number]) => [
  hit.physMultiplier,
  hit.attributeMultiplier,
  hit.physFixed,
  hit.attributeFixed,
]

const walkedIdentities = (skills: Skill[]): Pick<Skill, "id" | "classId">[] => {
  const stored = new Set(skills.map((skill) => skill.id))
  const claimed = new Set<string>()
  return skills.map((skill) => {
    const id = migrateMysticId(skill.id)
    if (id === skill.id || stored.has(id) || claimed.has(id)) {
      return { id: skill.id, classId: skill.classId }
    }
    claimed.add(id)
    return { id, classId: MYSTIC_ARTS_CLASS_ID }
  })
}

describe("every captured custom-skill store walks the whole chain", () => {
  it.each(cases(FIXTURES))(
    "%s lands at the latest version with every skill kept",
    (_name, fixture) => {
      const result = runCustomSkillMigrations(clone(fixture.blob))!
      expect(result.blob.v).toBe(LATEST_CUSTOM_SKILLS_VERSION)
      expect((result.blob.skills as Skill[]).map((skill) => skill.id)).toEqual(
        walkedIdentities(fixture.blob.skills).map((identity) => identity.id),
      )
    },
  )

  it.each(cases(FIXTURES))(
    "%s keeps every field a step does not claim across every hop",
    (_name, fixture) => {
      const result = runCustomSkillMigrations(clone(fixture.blob))!
      const strip = (skill: Skill) => ({
        ...skill,
        hits: skill.hits.map(({ id, frame }) => ({ id, frame })),
      })
      const identities = walkedIdentities(fixture.blob.skills)
      ;(result.blob.skills as Skill[]).forEach((walked, index) => {
        const stored = fixture.blob.skills[index]
        const expected = migrateNeverAbradesSkill({ ...stored, ...identities[index] }) as Skill
        expect(strip(walked)).toEqual(strip(expected))
      })
    },
  )
})

describe("the oldest custom-skill store survives loadCustomSkills end to end", () => {
  beforeEach(() => localStorage.clear())

  it("is persisted once at the latest version with every seeded copy on the built-in's current rows", () => {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(OLDEST.blob))
    const loaded = loadCustomSkills()
    const identities = walkedIdentities(OLDEST.blob.skills)
    expect(loaded.map((skill) => skill.id)).toEqual(identities.map((identity) => identity.id))

    const persisted = JSON.parse(localStorage.getItem(SKILLS_KEY)!) as RawCustomSkillsBlob
    expect(persisted.v).toBe(LATEST_CUSTOM_SKILLS_VERSION)

    for (const skill of loaded) {
      const builtin = builtinSkillsForClass(CLASS).find((candidate) => candidate.id === skill.id)
      const stored =
        OLDEST.blob.skills[identities.findIndex((identity) => identity.id === skill.id)]
      const edited = stored.hits.some(
        (hit, index) =>
          hit.physMultiplier === 0.6 && builtin && builtin.hits[index].physMultiplier !== 0.6,
      )
      if (!builtin || edited) {
        stored.hits.forEach((hit, index) => expect(rowOf(skill.hits[index])).toEqual(rowOf(hit)))
      } else {
        builtin.hits.forEach((hit, index) =>
          expect(rowOf(skill.hits[index]), skill.id).toEqual(rowOf(hit)),
        )
      }
    }
  })

  it("loads the same on a second load — the walk ran once", () => {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(OLDEST.blob))
    const once = loadCustomSkills()
    const written = localStorage.getItem(SKILLS_KEY)
    expect(loadCustomSkills()).toEqual(once)
    expect(localStorage.getItem(SKILLS_KEY)).toBe(written)
  })
})
