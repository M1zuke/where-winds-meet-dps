import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import { V73__draughtGauntletRetimingAndReveldriftNerf } from "../../src/migrations/customSkills/V73__draughtGauntletRetimingAndReveldriftNerf"
import { healSkill as healReviewedTimingsGrantsAndNames } from "../../src/migrations/customSkills/V78__reviewedTimingsGrantsAndNames"
import { healSkill as healDraughtGrantTimingAndAbrasionTalent } from "../../src/migrations/customSkills/V87__draughtGrantTimingAndAbrasionTalent"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV72File from "./testCustomSkills/v72/store.json"

const STORE = storeV72File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const REVELDRIFT = "bamboocutDraught-reveldrift"
const GROUNDDRIFT = "bamboocutDraught-nightwick-grounddrift"
const CASTLINK = "bamboocutDraught-castlink"
const HEALED_IDS = [
  REVELDRIFT,
  "bamboocutDraught-reveldrift-cancel",
  CASTLINK,
  "bamboocutDraught-peakfall",
  "bamboocutDraught-nightwick-primepick-follow-up-cancel",
  GROUNDDRIFT,
  "bamboocutDraught-bloombreak",
  "bamboocutDraught-gauntlets-dual",
  "bamboocutDraught-light-attack",
]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtin = (id: string): Skill =>
  builtinSkillsForClass("bamboocutDraught").find((skill) => skill.id === id)!

const coefficientsOf = (skill: Skill) =>
  skill.hits.map(({ physMultiplier, attributeMultiplier, physFixed, attributeFixed }) => ({
    physMultiplier,
    attributeMultiplier,
    physFixed,
    attributeFixed,
  }))

describe("custom-skills v72 fixture", () => {
  it("is v72 and stores every Draught skill on its pre-V73 values", () => {
    expect(STORE.v).toBe(V73__draughtGauntletRetimingAndReveldriftNerf.to - 1)
    expect(skillIn(STORE, CASTLINK).castFrames).toBe(49)
    expect(skillIn(STORE, REVELDRIFT).hits[1]!.physMultiplier).toBe(0.528025)
  })
})

describe("V73__draughtGauntletRetimingAndReveldriftNerf — called directly", () => {
  const after = V73__draughtGauntletRetimingAndReveldriftNerf.migrate(clone(STORE))

  it("moves every untouched copy onto the built-in's frames, cast lengths and coefficients", () => {
    expect(after.v).toBe(73)
    for (const id of HEALED_IDS) {
      const healed = healDraughtGrantTimingAndAbrasionTalent(
        healReviewedTimingsGrantsAndNames(skillIn(after, id)),
      ) as Skill
      expect(healed.castFrames, id).toBe(builtin(id).castFrames)
      if (id === GROUNDDRIFT) continue
      expect(
        healed.hits.map((hit) => hit.frame),
        id,
      ).toEqual(builtin(id).hits.map((hit) => hit.frame))
    }
    const [firstHit, ...otherHits] = coefficientsOf(skillIn(after, REVELDRIFT))
    const [builtinFirstHit, ...builtinOtherHits] = coefficientsOf(builtin(REVELDRIFT))
    expect(otherHits).toEqual(builtinOtherHits)
    expect(firstHit!.attributeFixed).toBe(builtinFirstHit!.attributeFixed)
  })

  it("gives the Jadeflush variants of Castlink their own frames", () => {
    const healed = skillIn(after, CASTLINK)
    expect(healed.hits.map((hit) => hit.variants?.[0]?.frame)).toEqual([
      20,
      31,
      undefined,
      undefined,
    ])
  })

  it("rewrites only the value that still matches what was seeded", () => {
    const editedReveldrift = skillIn(STORE, REVELDRIFT)
    const healedReveldrift = skillIn(after, REVELDRIFT)
    expect(editedReveldrift.hits[0]!.physMultiplier).toBe(0.6)
    expect(healedReveldrift.hits[0]!.physMultiplier).toBe(0.6)
    expect(healedReveldrift.hits[0]!.attributeMultiplier).toBe(0.39601875)
    expect(skillIn(STORE, GROUNDDRIFT).hits[1]!.frame).toBe(26)
    expect(skillIn(after, GROUNDDRIFT).hits[1]!.frame).toBe(26)
    expect(skillIn(after, GROUNDDRIFT).hits[0]!.frame).toBe(15)
  })

  it("leaves every other skill alone", () => {
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V73__draughtGauntletRetimingAndReveldriftNerf.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V73__draughtGauntletRetimingAndReveldriftNerf.migrate(clone(once))).toEqual(once)
  })
})

describe("V73__draughtGauntletRetimingAndReveldriftNerf — through the chain", () => {
  it("is registered and is exactly what the v72 → v73 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V73__draughtGauntletRetimingAndReveldriftNerf)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 73 })!
    expect(result.applied).toEqual(["V73__draughtGauntletRetimingAndReveldriftNerf"])
    expect(skillIn(result.blob, CASTLINK).castFrames).toBe(44)
  })
})
