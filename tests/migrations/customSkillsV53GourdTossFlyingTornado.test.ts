import { beforeEach, describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_SKILL_MIGRATIONS,
  runCustomSkillMigrations,
  type RawCustomSkillsBlob,
} from "../../src/migrations/customSkills"
import {
  V53__gourdTossFlyingTornado,
  healSkill,
} from "../../src/migrations/customSkills/V53__gourdTossFlyingTornado"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import storeV52File from "./testCustomSkills/v52/store.json"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const SPECIAL_ID = "silkbindJade-fanspecial"
const LIGHT_CHARGED_ID = "silkbindJade-fanlightcharged"

const STORE = storeV52File as unknown as RawCustomSkillsBlob & { skills: Skill[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const skillIn = (blob: RawCustomSkillsBlob, id: string): Skill =>
  (blob.skills as Skill[]).find((skill) => skill.id === id)!

function grantsFlyingTornado(skill: Skill): boolean {
  const lastHit = skill.hits[skill.hits.length - 1]!
  return lastHit.triggers.some(
    (trigger) => trigger.kind === "applyBuff" && trigger.targetId === "gourdTossFlyingTornado",
  )
}

function carriesFlyingTornadoVariant(skill: Skill): boolean {
  return (skill.hits[0]?.variants ?? []).some(
    (variant) => variant.id === "hv-fanlightcharged-hit-0-flying-tornado",
  )
}

describe("custom-skills v52 fixture", () => {
  it("is v52 and still lacks the Flying Tornado wiring", () => {
    expect(STORE.v).toBe(V53__gourdTossFlyingTornado.to - 1)
    expect(grantsFlyingTornado(skillIn(STORE, SPECIAL_ID))).toBe(false)
    expect(carriesFlyingTornadoVariant(skillIn(STORE, LIGHT_CHARGED_ID))).toBe(false)
  })
})

describe("healSkill", () => {
  it("grants Flying Tornado at Peak's Springless Silence's last hit", () => {
    const healed = healSkill(clone(skillIn(STORE, SPECIAL_ID))) as Skill
    expect(grantsFlyingTornado(healed)).toBe(true)
  })

  it("adds the Flying Tornado hit variant to Forsaken Fame's first hit", () => {
    const healed = healSkill(clone(skillIn(STORE, LIGHT_CHARGED_ID))) as Skill
    expect(carriesFlyingTornadoVariant(healed)).toBe(true)
    const variant = healed.hits[0]!.variants!.find(
      (candidate) => candidate.id === "hv-fanlightcharged-hit-0-flying-tornado",
    )!
    expect(variant.frame).toBe(60)
    expect(variant.castFrames).toBe(86)
  })

  it("does not double-heal a copy that already carries both", () => {
    const specialOnce = healSkill(clone(skillIn(STORE, SPECIAL_ID))) as Skill
    const specialTwice = healSkill(clone(specialOnce))
    expect(specialTwice).toEqual(specialOnce)

    const lightChargedOnce = healSkill(clone(skillIn(STORE, LIGHT_CHARGED_ID))) as Skill
    const lightChargedTwice = healSkill(clone(lightChargedOnce))
    expect(lightChargedTwice).toEqual(lightChargedOnce)
  })

  it("leaves a skill the migration does not target alone", () => {
    const untouched = skillIn(STORE, "bellstrikeUmbra-bleed-detonation")
    expect(healSkill(clone(untouched))).toEqual(untouched)
  })
})

describe("V53__gourdTossFlyingTornado — called directly", () => {
  it("heals both targeted ids and leaves every other skill untouched", () => {
    const after = V53__gourdTossFlyingTornado.migrate(clone(STORE))
    expect(after.v).toBe(53)
    expect(grantsFlyingTornado(skillIn(after, SPECIAL_ID))).toBe(true)
    expect(carriesFlyingTornadoVariant(skillIn(after, LIGHT_CHARGED_ID))).toBe(true)

    for (const skill of STORE.skills) {
      if (skill.id === SPECIAL_ID || skill.id === LIGHT_CHARGED_ID) continue
      expect(skillIn(after, skill.id)).toEqual(skill)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V53__gourdTossFlyingTornado.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V53__gourdTossFlyingTornado.migrate(clone(once))).toEqual(once)
  })
})

describe("V53__gourdTossFlyingTornado — through the chain", () => {
  it("is registered and is exactly what the v52 → v53 hop applies", () => {
    expect(CUSTOM_SKILL_MIGRATIONS).toContain(V53__gourdTossFlyingTornado)
    const result = runCustomSkillMigrations(clone(STORE), { toVersion: 53 })!
    expect(result.applied).toEqual(["V53__gourdTossFlyingTornado"])
    expect(result.blob.v).toBe(53)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_SKILL_MIGRATIONS.filter(
      (step) => step !== V53__gourdTossFlyingTornado,
    )
    const result = runChain(withoutStep, 53, clone(STORE))!
    expect(result.applied).not.toContain("V53__gourdTossFlyingTornado")
    expect(grantsFlyingTornado(skillIn(result.blob, SPECIAL_ID))).toBe(false)
  })
})

describe("every healed skill survives the hydrator too", () => {
  beforeEach(() => localStorage.clear())

  it("keeps both additions after loadCustomSkills, not just after the migration step", () => {
    localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomSkills()
    const special = loaded.find((candidate) => candidate.id === SPECIAL_ID)!
    const lightCharged = loaded.find((candidate) => candidate.id === LIGHT_CHARGED_ID)!
    expect(grantsFlyingTornado(special)).toBe(true)
    expect(carriesFlyingTornadoVariant(lightCharged)).toBe(true)
  })
})
