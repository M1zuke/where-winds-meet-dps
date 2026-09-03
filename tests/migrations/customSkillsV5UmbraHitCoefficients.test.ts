// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V5__umbraHitCoefficients,
  umbraHitSwapsFor,
} from "../../src/migrations/customSkills/V5__umbraHitCoefficients"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill, SkillHit } from "../../src/engine/skill"
import storeV4File from "./testCustomSkills/v4/store.json"

const CLASS = "bellstrikeUmbra"
const QQ = `${CLASS}-swordqfollowup`
const Q = `${CLASS}-swordq`
const SPEAR_SPECIAL = `${CLASS}-spearspecial`
const USER_AUTHORED = "sk-user-authored-slash"
const STORE = storeV4File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const rowOf = (
  hit: Pick<SkillHit, "physMultiplier" | "attributeMultiplier" | "physFixed" | "attributeFixed">,
) => [hit.physMultiplier, hit.attributeMultiplier, hit.physFixed, hit.attributeFixed]

const builtin = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

describe("custom-skills v4 fixture", () => {
  it("is v4 and still stores the averaged QQ rows the built-in no longer carries", () => {
    expect(STORE.v).toBe(V5__umbraHitCoefficients.to - 1)
    for (const hit of skillIn(STORE, QQ).hits) expect(rowOf(hit)).toEqual([0.5441, 0.8161, 150, 82])
    expect(rowOf(builtin(QQ).hits[1])).not.toEqual([0.5441, 0.8161, 150, 82])
  })

  it("holds an edited copy, a River Flow variant and a user-authored skill sharing the old row", () => {
    expect(skillIn(STORE, Q).hits[0].physMultiplier).toBe(0.6)
    expect(skillIn(STORE, SPEAR_SPECIAL).hits[0].variants?.[0].physMultiplier).toBe(2.5683)
    expect(rowOf(skillIn(STORE, USER_AUTHORED).hits[0])).toEqual([0.5441, 0.8161, 150, 82])
  })
})

describe("umbraHitSwapsFor", () => {
  it("names only built-in Umbra skills and lands every row on the built-in's current hit", () => {
    const covered = builtinSkillsForClass(CLASS).filter((skill) => umbraHitSwapsFor(skill.id))
    expect(covered.length).toBeGreaterThan(0)
    for (const skill of covered) {
      const swaps = umbraHitSwapsFor(skill.id)!
      expect(swaps.length, skill.id).toBe(skill.hits.length)
      swaps.forEach((swap, index) => {
        expect(rowOf(skill.hits[index]), `${skill.id} hit ${index}`).toEqual([...swap.to])
        swap.variants?.forEach((variantSwap, variantIndex) => {
          expect(
            rowOf(skill.hits[index].variants![variantIndex]),
            `${skill.id} variant ${variantIndex}`,
          ).toEqual([...variantSwap.to])
        })
      })
    }
  })

  it("knows nothing about a user-authored id", () => {
    expect(umbraHitSwapsFor(USER_AUTHORED)).toBeUndefined()
  })
})

describe("V5__umbraHitCoefficients — called directly", () => {
  it("rewrites every untouched hit of a seeded copy to the built-in's current row", () => {
    const after = V5__umbraHitCoefficients.migrate(clone(STORE))
    expect(after.v).toBe(5)
    const healed = skillIn(after, QQ)
    healed.hits.forEach((hit, index) => expect(rowOf(hit)).toEqual(rowOf(builtin(QQ).hits[index])))
  })

  it("rewrites the hit and its River Flow variant of the spear special", () => {
    const after = V5__umbraHitCoefficients.migrate(clone(STORE))
    const healed = skillIn(after, SPEAR_SPECIAL).hits[0]
    const current = builtin(SPEAR_SPECIAL).hits[0]
    expect(rowOf(healed)).toEqual(rowOf(current))
    expect(rowOf(healed.variants![0])).toEqual(rowOf(current.variants![0]))
    expect(healed.variants![0].id).toBe(skillIn(STORE, SPEAR_SPECIAL).hits[0].variants![0].id)
  })

  it("leaves an edited copy and a user-authored skill with the same old row alone", () => {
    const after = V5__umbraHitCoefficients.migrate(clone(STORE))
    expect(skillIn(after, Q)).toEqual(skillIn(STORE, Q))
    expect(skillIn(after, USER_AUTHORED)).toEqual(skillIn(STORE, USER_AUTHORED))
  })

  it("touches nothing but the four coefficients of a rewritten hit", () => {
    const after = V5__umbraHitCoefficients.migrate(clone(STORE))
    const strip = (skill: Skill) => ({
      ...skill,
      hits: skill.hits.map(
        ({ physMultiplier, attributeMultiplier, physFixed, attributeFixed, variants, ...rest }) => {
          void physMultiplier
          void attributeMultiplier
          void physFixed
          void attributeFixed
          void variants
          return rest
        },
      ),
    })
    for (const skill of STORE.skills) expect(strip(skillIn(after, skill.id))).toEqual(strip(skill))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V5__umbraHitCoefficients.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V5__umbraHitCoefficients.migrate(clone(once))).toEqual(once)
  })
})

describe("V5__umbraHitCoefficients — through the chain", () => {
  it("is registered and is exactly what the v4 → v5 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V5__umbraHitCoefficients)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 5 })!
    expect(result.applied).toEqual(["V5__umbraHitCoefficients"])
    expect(result.blob.v).toBe(5)
    expect(rowOf(skillIn(result.blob, QQ).hits[3])).toEqual(rowOf(builtin(QQ).hits[3]))
  })
})
