// Scoped to Bamboocut Draught — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V19__bamboocutDraughtArtBonusAttack,
  healBamboocutDraughtArtBonusAttack,
} from "../../src/migrations/customSkills/V19__bamboocutDraughtArtBonusAttack"
import type { Skill } from "../../src/engine/skill"
import storeV18File from "./testCustomSkills/v18/store.json"

const GAUNTLETS_SEEDED = "bamboocutDraught-castlink"
const GAUNTLETS_SEEDED_OTHER = "bamboocutDraught-peakfall"
const FALCONS_PURSUIT_SEEDED = "bamboocutDraught-falcons-pursuit"
const TWIN_BLADES_SEEDED = "bamboocutDraught-boundvessel"
const USER_AUTHORED = "sk-user-authored-bamboocut-slash"
const OTHER_CLASS_SKILL = "bellstrikeSplendor-swordq"
const GAUNTLETS_BUFF = "skystrikeGauntletsAdditionalAttack"
const TWIN_BLADES_BUFF = "rivenTwinbladesAdditionalAttack"
const FALCONS_PURSUIT_COEFFICIENT_BUFF = "skystrikeGauntletsAdditionalAttackCoefficient"
const STORE = storeV18File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

describe("custom-skills v18 fixture", () => {
  it("is v18 and lists neither art buff nor the coefficient buff on any Bamboocut Draught row", () => {
    expect(STORE.v).toBe(V19__bamboocutDraughtArtBonusAttack.to - 1)
    expect(skillIn(STORE, GAUNTLETS_SEEDED).receives ?? []).not.toContain(GAUNTLETS_BUFF)
    expect(skillIn(STORE, GAUNTLETS_SEEDED_OTHER).receives ?? []).not.toContain(GAUNTLETS_BUFF)
    expect(skillIn(STORE, TWIN_BLADES_SEEDED).receives ?? []).not.toContain(TWIN_BLADES_BUFF)
    expect(skillIn(STORE, FALCONS_PURSUIT_SEEDED).receives ?? []).not.toContain(
      FALCONS_PURSUIT_COEFFICIENT_BUFF,
    )
  })
})

describe("healBamboocutDraughtArtBonusAttack", () => {
  it("appends the Gauntlets buff to a stale Gauntlets-tagged copy, keeping the entries it already had", () => {
    const before = clone(skillIn(STORE, GAUNTLETS_SEEDED))
    const healed = healBamboocutDraughtArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([...(before.receives ?? []), GAUNTLETS_BUFF])
  })

  it("appends the Gauntlets buff to a stale Gauntlets-tagged copy with no prior receives", () => {
    const before = clone(skillIn(STORE, GAUNTLETS_SEEDED_OTHER))
    expect(before.receives).toBeUndefined()
    const healed = healBamboocutDraughtArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([GAUNTLETS_BUFF])
  })

  it("appends the Twin Blades buff to a stale Twin Blades-tagged copy", () => {
    const before = clone(skillIn(STORE, TWIN_BLADES_SEEDED))
    expect(before.receives).toBeUndefined()
    const healed = healBamboocutDraughtArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([TWIN_BLADES_BUFF])
  })

  it("appends both the Gauntlets buff and the coefficient buff to the Falcon's Pursuit copy", () => {
    const before = clone(skillIn(STORE, FALCONS_PURSUIT_SEEDED))
    const healed = healBamboocutDraughtArtBonusAttack(before) as Skill
    expect(healed.receives).toEqual([
      ...(before.receives ?? []),
      GAUNTLETS_BUFF,
      FALCONS_PURSUIT_COEFFICIENT_BUFF,
    ])
  })

  it("does not add the coefficient buff to another Gauntlets-tagged copy", () => {
    const healed = healBamboocutDraughtArtBonusAttack(
      clone(skillIn(STORE, GAUNTLETS_SEEDED)),
    ) as Skill
    expect(healed.receives).not.toContain(FALCONS_PURSUIT_COEFFICIENT_BUFF)
  })

  it("leaves an already-healed copy alone", () => {
    const healedOnce = healBamboocutDraughtArtBonusAttack(clone(skillIn(STORE, GAUNTLETS_SEEDED)))
    expect(healBamboocutDraughtArtBonusAttack(clone(healedOnce))).toEqual(healedOnce)
  })

  it("leaves the user-authored entry alone — same weaponOrAttribute, but no weapon tag to match on", () => {
    const userAuthored = clone(skillIn(STORE, USER_AUTHORED))
    expect(userAuthored.tags).toEqual([])
    expect(healBamboocutDraughtArtBonusAttack(userAuthored)).toEqual(userAuthored)
  })

  it("leaves a copy of another class's skill alone, even carrying a matching weapon tag", () => {
    const otherClass = clone(skillIn(STORE, OTHER_CLASS_SKILL))
    expect(healBamboocutDraughtArtBonusAttack(otherClass)).toEqual(otherClass)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(skillIn(STORE, FALCONS_PURSUIT_SEEDED))
    const snapshot = clone(input)
    const once = healBamboocutDraughtArtBonusAttack(input)
    expect(input).toEqual(snapshot)
    expect(healBamboocutDraughtArtBonusAttack(clone(once))).toEqual(once)
  })
})

describe("V19__bamboocutDraughtArtBonusAttack — called directly", () => {
  it("heals every Gauntlets and Twin Blades row, the Falcon's Pursuit coefficient, and nothing else", () => {
    const after = V19__bamboocutDraughtArtBonusAttack.migrate(clone(STORE))
    expect(after.v).toBe(19)
    expect(skillIn(after, GAUNTLETS_SEEDED).receives).toContain(GAUNTLETS_BUFF)
    expect(skillIn(after, GAUNTLETS_SEEDED_OTHER).receives).toContain(GAUNTLETS_BUFF)
    expect(skillIn(after, TWIN_BLADES_SEEDED).receives).toContain(TWIN_BLADES_BUFF)
    expect(skillIn(after, FALCONS_PURSUIT_SEEDED).receives).toContain(GAUNTLETS_BUFF)
    expect(skillIn(after, FALCONS_PURSUIT_SEEDED).receives).toContain(
      FALCONS_PURSUIT_COEFFICIENT_BUFF,
    )
    const healedIds = [
      GAUNTLETS_SEEDED,
      GAUNTLETS_SEEDED_OTHER,
      TWIN_BLADES_SEEDED,
      FALCONS_PURSUIT_SEEDED,
    ]
    for (const skill of STORE.skills) {
      if (healedIds.includes(skill.id)) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V19__bamboocutDraughtArtBonusAttack.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V19__bamboocutDraughtArtBonusAttack.migrate(clone(once))).toEqual(once)
  })
})

describe("V19__bamboocutDraughtArtBonusAttack — through the chain", () => {
  it("is registered and is exactly what the v18 → v19 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V19__bamboocutDraughtArtBonusAttack)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 19 })!
    expect(result.applied).toEqual(["V19__bamboocutDraughtArtBonusAttack"])
    expect(result.blob.v).toBe(19)
    expect(skillIn(result.blob, GAUNTLETS_SEEDED).receives).toContain(GAUNTLETS_BUFF)
    expect(skillIn(result.blob, TWIN_BLADES_SEEDED).receives).toContain(TWIN_BLADES_BUFF)
    expect(skillIn(result.blob, FALCONS_PURSUIT_SEEDED).receives).toContain(
      FALCONS_PURSUIT_COEFFICIENT_BUFF,
    )
  })
})
