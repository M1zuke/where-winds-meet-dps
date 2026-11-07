// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V13__spearHeavyChargedCoefficients,
  healSpearHeavyChargedCoefficients,
  spearHeavyHitSwapsFor,
} from "../../src/migrations/customSkills/V13__spearHeavyChargedCoefficients"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill, SkillHit } from "../../src/engine/skill"
import storeV12File from "./testCustomSkills/v12/store.json"

const CLASS = "bellstrikeUmbra"
const FIVE_HIT = `${CLASS}-spearheavy`
const ONE_HIT = `${CLASS}-spearheavy-1-hit`
const ONE_HIT_PREPULL = `${CLASS}-spearheavy-1-hit-prepull`
const USER_AUTHORED = "sk-user-authored-slash"
const STORE = storeV12File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const rowOf = (
  hit: Pick<SkillHit, "physMultiplier" | "attributeMultiplier" | "physFixed" | "attributeFixed">,
) => [hit.physMultiplier, hit.attributeMultiplier, hit.physFixed, hit.attributeFixed]

// The v12 → v13 hop's own target rows, frozen here rather than read from
// `spearHeavyHitSwapsFor` or the live built-in — both move on for reasons
// this hop never claimed.
const FIRST_AND_FOURTH = [1.250878, 1.876317, 346, 188.6]
const SECOND = [0.750527, 1.12579, 207.6, 113.16]
const THIRD = [0.375263, 0.562895, 103.8, 56.58]
const FIFTH = [0.331483, 0.497224, 91.69, 49.98]
const V13_ROWS: Record<string, readonly number[][]> = {
  [FIVE_HIT]: [FIRST_AND_FOURTH, SECOND, THIRD, FIRST_AND_FOURTH, FIFTH],
  [ONE_HIT]: [FIRST_AND_FOURTH],
  [ONE_HIT_PREPULL]: [FIRST_AND_FOURTH],
}
const v13Rows = (id: string) => V13_ROWS[id]!

describe("custom-skills v12 fixture", () => {
  it("is v12 and still spreads the Special Skill's flat row across every SpearHeavy hit", () => {
    expect(STORE.v).toBe(V13__spearHeavyChargedCoefficients.to - 1)
    for (const hit of skillIn(STORE, FIVE_HIT).hits) {
      expect(rowOf(hit)).toEqual([0.30346, 0.45518000000000003, 70.2, 39.2])
    }
    expect(rowOf(skillIn(STORE, ONE_HIT).hits[0])).toEqual([0.30346, 0.45518, 70.2, 39.2])
    expect(rowOf(skillIn(STORE, ONE_HIT_PREPULL).hits[0])).toEqual([0.30346, 0.45518, 70.2, 39.2])
  })

  it("holds the corrected, unevenly-weighted rows the copies were seeded from", () => {
    const fiveHitRows = v13Rows(FIVE_HIT)
    const distinctRows = new Set(fiveHitRows.map((row) => row.join(",")))
    expect(distinctRows.size).toBeGreaterThan(1)
    expect(fiveHitRows[0]).not.toEqual([0.30346, 0.45518000000000003, 70.2, 39.2])
    expect(v13Rows(ONE_HIT)[0]).toEqual(fiveHitRows[0])
    expect(v13Rows(ONE_HIT_PREPULL)[0]).toEqual(fiveHitRows[0])
  })
})

describe("spearHeavyHitSwapsFor", () => {
  it("names only the three SpearHeavy modules and lands every row on this hop's own target", () => {
    const covered = builtinSkillsForClass(CLASS).filter((skill) => spearHeavyHitSwapsFor(skill.id))
    expect(covered.map((skill) => skill.id).sort()).toEqual(
      [FIVE_HIT, ONE_HIT, ONE_HIT_PREPULL].sort(),
    )
    for (const id of [FIVE_HIT, ONE_HIT, ONE_HIT_PREPULL]) {
      const swaps = spearHeavyHitSwapsFor(id)!
      swaps.forEach((swap, index) => {
        expect([...swap.to], `${id} hit ${index}`).toEqual(v13Rows(id)[index])
      })
    }
  })

  it("knows nothing about a user-authored id", () => {
    expect(spearHeavyHitSwapsFor(USER_AUTHORED)).toBeUndefined()
  })
})

describe("healSpearHeavyChargedCoefficients", () => {
  it("rewrites every untouched hit of a seeded SpearHeavy copy to this hop's target row", () => {
    const healed = healSpearHeavyChargedCoefficients(clone(skillIn(STORE, FIVE_HIT))) as Skill
    healed.hits.forEach((hit, index) => expect(rowOf(hit)).toEqual(v13Rows(FIVE_HIT)[index]))
  })

  it("rewrites the single hit of each 1-hit copy", () => {
    for (const id of [ONE_HIT, ONE_HIT_PREPULL]) {
      const healed = healSpearHeavyChargedCoefficients(clone(skillIn(STORE, id))) as Skill
      expect(rowOf(healed.hits[0])).toEqual(v13Rows(FIVE_HIT)[0])
    }
  })

  it("leaves a copy whose row has been edited alone", () => {
    const edited = clone(skillIn(STORE, ONE_HIT))
    edited.hits[0].physMultiplier = 0.5
    expect(healSpearHeavyChargedCoefficients(clone(edited))).toEqual(edited)
  })

  it("leaves an unrelated skill alone", () => {
    const other = clone(skillIn(STORE, USER_AUTHORED))
    expect(healSpearHeavyChargedCoefficients(other)).toEqual(other)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(skillIn(STORE, FIVE_HIT))
    const snapshot = clone(input)
    const once = healSpearHeavyChargedCoefficients(input)
    expect(input).toEqual(snapshot)
    expect(healSpearHeavyChargedCoefficients(clone(once))).toEqual(once)
  })
})

describe("V13__spearHeavyChargedCoefficients — called directly", () => {
  it("heals all three SpearHeavy copies and nothing else", () => {
    const after = V13__spearHeavyChargedCoefficients.migrate(clone(STORE))
    expect(after.v).toBe(13)
    for (const id of [FIVE_HIT, ONE_HIT, ONE_HIT_PREPULL]) {
      skillIn(after, id).hits.forEach((hit, index) =>
        expect(rowOf(hit)).toEqual(v13Rows(id)[index]),
      )
    }
    for (const skill of STORE.skills) {
      if ([FIVE_HIT, ONE_HIT, ONE_HIT_PREPULL].includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V13__spearHeavyChargedCoefficients.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V13__spearHeavyChargedCoefficients.migrate(clone(once))).toEqual(once)
  })
})

describe("V13__spearHeavyChargedCoefficients — through the chain", () => {
  it("is registered and is exactly what the v12 → v13 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V13__spearHeavyChargedCoefficients)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 13 })!
    expect(result.applied).toEqual(["V13__spearHeavyChargedCoefficients"])
    expect(result.blob.v).toBe(13)
    for (const id of [FIVE_HIT, ONE_HIT, ONE_HIT_PREPULL]) {
      skillIn(result.blob, id).hits.forEach((hit, index) =>
        expect(rowOf(hit)).toEqual(v13Rows(id)[index]),
      )
    }
  })
})
