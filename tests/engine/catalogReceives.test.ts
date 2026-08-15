import { describe, expect, it } from "vitest"
import {
  hiddenTimelineBuffIds,
  receivesForSkill,
  specMechanicIds,
} from "../../src/engine/buffs/catalog"
import { builtinDebuffsForClass } from "../../src/engine/builtinLibrary"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultCombatSettings, type Inputs } from "../../src/engine/types"
import { builtinSkill } from "../builtins"
import { DEBUFF, SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { SKILL as UNIVERSAL_SKILL } from "../../src/data/skills/universal/ids"

const CLASS = "bellstrikeUmbra"
const RETENTION_ROW_ID = `dotRetention:${DEBUFF.bleedTick}`

function inputsWithSwordHorizon(tier: string | null): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    mindMethods: [
      tier ? { name: "Sword Horizon", stacks: tier } : { name: "", stacks: "" },
      { name: "", stacks: "" },
      { name: "", stacks: "" },
      { name: "", stacks: "" },
    ],
  }
}

describe("catalog receives — Sword Horizon retention on Bleed Tick", () => {
  it("Bleed Tick carries the retention row as an ordinary (non-spec-mechanic) buff", () => {
    const bleedTick = builtinSkill(CLASS, SKILL.bleedTick)
    const rows = receivesForSkill(bleedTick, CLASS, inputsWithSwordHorizon("tier 6"))
    const row = rows.find((r) => r.id === RETENTION_ROW_ID)
    expect(row).toBeTruthy()
    expect(row!.isSpecMechanic).toBe(false)
  })

  it("is active at Sword Horizon tier 6, inactive at tier 5, inactive with no Sword Horizon at all", () => {
    const bleedTick = builtinSkill(CLASS, SKILL.bleedTick)
    const at6 = receivesForSkill(bleedTick, CLASS, inputsWithSwordHorizon("tier 6"))
    expect(at6.find((r) => r.id === RETENTION_ROW_ID)!.active).toBe(true)

    const at5 = receivesForSkill(bleedTick, CLASS, inputsWithSwordHorizon("tier 5"))
    expect(at5.find((r) => r.id === RETENTION_ROW_ID)!.active).toBe(false)

    const none = receivesForSkill(bleedTick, CLASS, inputsWithSwordHorizon(null))
    expect(none.find((r) => r.id === RETENTION_ROW_ID)!.active).toBe(false)
  })

  it("survives renaming the debuff away from its tick skill — the row is matched by id", () => {
    const bleedTick = builtinSkill(CLASS, SKILL.bleedTick)
    const inputs = inputsWithSwordHorizon("tier 6")
    const renamed = builtinDebuffsForClass(CLASS).map((debuff) => ({
      ...debuff,
      name: `${debuff.name} renamed`,
    }))

    const rows = receivesForSkill(bleedTick, CLASS, { ...inputs, customDebuffs: renamed })

    expect(rows.some((row) => row.id === RETENTION_ROW_ID)).toBe(true)
  })

  it("does not appear on Blood Burst or Crosswind Blade (appliers, not the DoT skill)", () => {
    const inputs = inputsWithSwordHorizon("tier 6")
    const detonation = receivesForSkill(builtinSkill(CLASS, SKILL.bleedDetonation), CLASS, inputs)
    const crosswind = receivesForSkill(builtinSkill(CLASS, SKILL.crosswindBlade), CLASS, inputs)
    expect(detonation.some((r) => r.id === RETENTION_ROW_ID)).toBe(false)
    expect(crosswind.some((r) => r.id === RETENTION_ROW_ID)).toBe(false)
  })
})

describe("catalog receives — Vulnerability (Teammate) follows the Tank Spear Debuff toggle", () => {
  it("reads inactive by default (toggle off) and requires names the Tank Spear Debuff", () => {
    const swordQ = builtinSkill(CLASS, SKILL.swordq)
    const rows = receivesForSkill(swordQ, CLASS, { ...defaultInputs, classId: CLASS })
    const row = rows.find((r) => r.id === "vulnerabilityTeammate")
    expect(row).toBeTruthy()
    expect(row!.active).toBe(false)
    expect(row!.requires).toMatch(/Tank Spear Debuff/)
  })

  it("reads active once the Tank Spear Debuff (Vulnerability) toggle is on", () => {
    const swordQ = builtinSkill(CLASS, SKILL.swordq)
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      shareEasyHurt: true,
      combatSettings: { ...defaultCombatSettings() },
    }
    const rows = receivesForSkill(swordQ, CLASS, inputs)
    expect(rows.find((r) => r.id === "vulnerabilityTeammate")!.active).toBe(true)
  })
})

describe("catalog receives — Mirage Bonus surfaces its cast condition", () => {
  it("triggeredBy names the triggering skill and the Mirage prerequisite", () => {
    const swordQ = builtinSkill(CLASS, SKILL.swordq)
    const rows = receivesForSkill(swordQ, CLASS, { ...defaultInputs, classId: CLASS })
    const row = rows.find((r) => r.id === "mirageBonus")
    expect(row).toBeTruthy()
    expect(row!.triggeredBy).toMatch(/Perfect Dodge/)
    expect(row!.triggeredBy).toMatch(/Mirage/)
  })
})

describe("catalog receives — gear-stat boost rows follow the skill's typing", () => {
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    swordBoost: 0.05,
    allMartialBoost: 0.03,
  }

  it("Bleed Tick and Blood Burst list Sword Martial Boost and All Martial Boost", () => {
    for (const skillId of [SKILL.bleedTick, SKILL.bleedDetonation]) {
      const rows = receivesForSkill(builtinSkill(CLASS, skillId), CLASS, inputs)
      const sword = rows.find((r) => r.id === "stat:swordBoost")
      const allMartial = rows.find((r) => r.id === "stat:allMartialBoost")
      expect(sword, `${skillId} should list swordBoost`).toBeTruthy()
      expect(sword!.effect).toBe("+5.0% damage")
      expect(allMartial, `${skillId} should list allMartialBoost`).toBeTruthy()
      expect(allMartial!.effect).toBe("+3.0% damage")
    }
  })

  it("a burst-mystic cast lists the single-target mystic stat and no weapon stats", () => {
    const rows = receivesForSkill(
      builtinSkill(CLASS, UNIVERSAL_SKILL.fireBreath1Hit),
      CLASS,
      inputs,
    )
    expect(rows.some((r) => r.id === "stat:singleMysticBoost")).toBe(true)
    expect(rows.some((r) => r.id === "stat:allMartialBoost")).toBe(false)
    expect(rows.some((r) => r.id === "stat:swordBoost")).toBe(false)
  })
})

// Both derivations stay scoped to a class's own `classBuffDefs`, never
// `buffDefsForClass`'s composed set (which folds in `GLOBAL_BUFF_DEFS`):
// `dragonHeadLowHp` is a global and `alwaysActive`, and must not be caught
// by either.
describe("specMechanicIds and hiddenTimelineBuffIds stay scoped to the class's own classBuffDefs", () => {
  it("the Spec Mechanics column is exactly the two bleed passives", () => {
    const ids = specMechanicIds(CLASS)
    expect(ids).toEqual(new Set(["bellstrikeUmbraBleedPen", "bellstrikeUmbraBleedingDamage"]))
    expect(ids.has("soulShaken")).toBe(false)
    expect(ids.has("dragonHeadLowHp")).toBe(false)
  })

  it("the timeline chip-hiding set is the same two", () => {
    const ids = hiddenTimelineBuffIds(CLASS)
    expect(ids).toEqual(new Set(["bellstrikeUmbraBleedPen", "bellstrikeUmbraBleedingDamage"]))
    expect(ids.has("dragonHeadLowHp")).toBe(false)
  })
})
