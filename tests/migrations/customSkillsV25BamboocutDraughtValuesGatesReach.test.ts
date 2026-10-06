import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V25__bamboocutDraughtValuesGatesReach,
  healBamboocutDraughtValuesGatesReach,
} from "../../src/migrations/customSkills/V25__bamboocutDraughtValuesGatesReach"
import { healSkill as healMeterFieldsAndGains } from "../../src/migrations/customSkills/V38__meterFieldsAndGains"
import { healSkill as healCalmwatersPerfectDodgeGain } from "../../src/migrations/customSkills/V42__calmwatersPerfectDodgeGain"
import { healSkill as healEvasiveChargeDodgeRefund } from "../../src/migrations/customSkills/V43__evasiveChargeDodgeRefund"
import { healSkillFrames as healCastLengthAndHitFrameRepairs } from "../../src/migrations/customSkills/V45__castLengthAndHitFrameRepairs"
import { healSkill as healWeaponDrawnGates } from "../../src/migrations/customSkills/V47__weaponDrawnGates"
import { healQiRateDefault } from "../../src/migrations/customSkills/V48__qiRateDefaults"
import { healSkill as healBoundvesselSpringAwayToadAfterimageTiming } from "../../src/migrations/customSkills/V61__boundvesselSpringAwayToadAfterimageTiming"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Skill } from "../../src/engine/skill"
import storeV24File from "./testCustomSkills/v24/store.json"

const CLASS = "bamboocutDraught"
const EDITED_ID = "bamboocutDraught-heros-blood"
const UNRELATED_IDS = ["bamboocutDraught-falcons-pursuit", "sk-user-authored-bamboocut-slash"]

const REMOVED_SKILL_ID = "bamboocutDraught-nightwick-tipsylay"

const HEALED_IDS = [
  "bamboocutDraught-boundvessel",
  "bamboocutDraught-castlink",
  "bamboocutDraught-dragonquench-inebriate",
  "bamboocutDraught-dragonquench-inebriate-cancel",
  "bamboocutDraught-dragonquench-inebriate-second",
  "bamboocutDraught-dragonquench-inebriate-second-cancel",
  "bamboocutDraught-dragonquench-inebriate-third",
  "bamboocutDraught-dragonquench-inebriate-third-cancel",
  "bamboocutDraught-heros-blood-inebriate",
  "bamboocutDraught-light-attack",
  "bamboocutDraught-nightwick-grounddrift",
  "bamboocutDraught-nightwick-primepick",
  "bamboocutDraught-nightwick-primepick-follow-up",
  "bamboocutDraught-nightwick-primepick-follow-up-cancel",
  "bamboocutDraught-peakfall",
  "bamboocutDraught-peakfall-prepull",
  "bamboocutDraught-perfect-dodge",
  "bamboocutDraught-perfect-dodge-full",
  "bamboocutDraught-quick-drink",
  "bamboocutDraught-quick-drink-cancel",
  "bamboocutDraught-realmplay",
  "bamboocutDraught-reveldrift",
  "bamboocutDraught-reveldrift-cancel",
  "bamboocutDraught-whaledraft",
]

const STORE = storeV24File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

const builtinOf = (id: string): Skill =>
  builtinSkillsForClass(CLASS).find((skill) => skill.id === id)!

// Both Perfect Dodge forms gain their own Endurance meter gains at later
// hops, so their hits only match the live built-in once those hops run too.
const GAINS_ADDED_BY_LATER_STEP = new Set([
  "bamboocutDraught-perfect-dodge",
  "bamboocutDraught-perfect-dodge-full",
])

function throughLaterHops(id: string, skill: Skill): Skill {
  const withGains = GAINS_ADDED_BY_LATER_STEP.has(id)
    ? (healEvasiveChargeDodgeRefund(
        healCalmwatersPerfectDodgeGain(healMeterFieldsAndGains(skill)),
      ) as Skill)
    : skill
  const withFrames = healCastLengthAndHitFrameRepairs(withGains) as Skill
  const withDrawnGates = healWeaponDrawnGates(withFrames) as Skill
  const withQiRate = healQiRateDefault(withDrawnGates) as Skill
  return healBoundvesselSpringAwayToadAfterimageTiming(withQiRate) as Skill
}

describe("custom-skills v24 fixture", () => {
  it("is v24 and still stores every hop's pre-V25 shape", () => {
    expect(STORE.v).toBe(V25__bamboocutDraughtValuesGatesReach.to - 1)
    for (const id of HEALED_IDS) {
      expect(skillIn(STORE, id).hits, id).not.toEqual(builtinOf(id).hits)
    }
  })

  it("carries an edited copy that already diverges from the seed", () => {
    const edited = skillIn(STORE, EDITED_ID)
    expect(edited.hits[0].physMultiplier).toBe(999)
  })

  it("stores rows the built-ins no longer carry", () => {
    expect(builtinOf("bamboocutDraught-light-attack").hits).toHaveLength(8)
    expect(builtinOf("bamboocutDraught-boundvessel").hits).toHaveLength(15)
  })
})

describe("healBamboocutDraughtValuesGatesReach", () => {
  it("rewrites every untouched seeded copy to the current built-in's hits", () => {
    for (const id of HEALED_IDS) {
      const healed = healBamboocutDraughtValuesGatesReach(clone(skillIn(STORE, id))) as Skill
      expect(throughLaterHops(id, healed).hits, id).toEqual(builtinOf(id).hits)
    }
  })

  it("leaves an edited copy, an unrelated skill and a user-authored skill alone", () => {
    const edited = clone(skillIn(STORE, EDITED_ID))
    expect(healBamboocutDraughtValuesGatesReach(edited)).toEqual(edited)
    for (const id of UNRELATED_IDS) {
      const untouched = clone(skillIn(STORE, id))
      expect(healBamboocutDraughtValuesGatesReach(untouched), id).toEqual(untouched)
    }
  })
})

describe("V25__bamboocutDraughtValuesGatesReach — called directly", () => {
  it("rewrites every untouched seeded copy and nothing else", () => {
    const after = V25__bamboocutDraughtValuesGatesReach.migrate(clone(STORE))
    expect(after.v).toBe(25)
    for (const id of HEALED_IDS) {
      const afterSkill = skillIn(after, id)
      expect(throughLaterHops(id, afterSkill).hits, id).toEqual(builtinOf(id).hits)
      const { hits: _beforeHits, ...restBefore } = skillIn(STORE, id)
      const { hits: _afterHits, ...restAfter } = afterSkill
      void _beforeHits
      void _afterHits
      expect(restAfter, id).toEqual(restBefore)
    }
    for (const skill of STORE.skills) {
      if (HEALED_IDS.includes(skill.id) || skill.id === REMOVED_SKILL_ID) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V25__bamboocutDraughtValuesGatesReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V25__bamboocutDraughtValuesGatesReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V25__bamboocutDraughtValuesGatesReach — through the chain", () => {
  it("is registered and is exactly what the v24 → v25 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V25__bamboocutDraughtValuesGatesReach)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 25 })!
    expect(result.applied).toEqual(["V25__bamboocutDraughtValuesGatesReach"])
    expect(result.blob.v).toBe(25)
    expect(skillIn(result.blob, "bamboocutDraught-light-attack").hits).toEqual(
      builtinOf("bamboocutDraught-light-attack").hits,
    )
  })
})
