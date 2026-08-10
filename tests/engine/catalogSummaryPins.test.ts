// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes". Pins the
// Skill Editor text for the eight buffs (of the 18 Umbra-scoped conversions)
// whose `BuffDef → BuffModule` rendering moved off the exact pre-conversion
// string, so a future edit can't move it silently again. The other ten
// (crosswindSpirit, potentRiverFlow, wineGu, revelryScript,
// vulnerabilityTeammate, mirage, mirageBonus, rainwhisperShield,
// resistanceResolve, dragonHeadLowHp) render identically before and after —
// all express their bonus as a plain `allDamageBoost` `StatKey`, which the
// catalog's generic label table already renders as the old "+N% all" text.
import { describe, expect, it } from "vitest"
import {
  appliesForSkill,
  alwaysActiveClassBuffs,
  receivesForSkill,
} from "../../src/engine/buffs/catalog"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { defaultInputs } from "../../src/engine/defaults"
import { healerBuff } from "../../src/data/skills/buffs/healerBuff"
import type { Inputs } from "../../src/engine/types"
import type { Skill } from "../../src/engine/skill"

const CLASS = "bellstrikeUmbra"

function findSkill(name: string): Skill {
  const skill = builtinSkillsForClass(CLASS).find((candidate) => candidate.name === name)
  if (!skill) throw new Error(`missing built-in skill: ${name}`)
  return skill
}

function inputsWithSwordHorizon(tier: string): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    mindMethods: [
      { name: "Sword Horizon", stacks: tier },
      { name: "", stacks: "" },
      { name: "", stacks: "" },
      { name: "", stacks: "" },
    ],
  }
}

describe("catalog summary pins — jadeware", () => {
  it("Applies row on Sword Martial Q reads the pre-conversion BuffDef text", () => {
    const rows = appliesForSkill(findSkill("Sword Martial Q"), CLASS)
    expect(rows.find((row) => row.id === "jadeware")!.effect).toBe(
      "affinityDmg +10%, directAffinity +8%",
    )
  })
})

describe("catalog summary pins — healerBuff", () => {
  // `healerBuff` is a `GROUP_BUFF_DEFS` entry, and `catalogBuffDefs` never
  // merges the group list — true before this conversion as well as after —
  // so no Receives/Applies/Class-Buffs row ever renders it. Pin the module's
  // own summary directly; it is the only text this buff carries.
  it("carries the (team) marker, the only signal it's a groupDamage bonus", () => {
    expect(healerBuff.summary).toBe("+20.0% all (team)")
  })
})

describe("catalog summary pins — bellstrikeUmbraBleedPen", () => {
  it("Class Buffs row reads point units, not the app's internal fraction", () => {
    const rows = alwaysActiveClassBuffs(inputsWithSwordHorizon("tier 6"))
    expect(rows.find((row) => row.id === "bellstrikeUmbraBleedPen")!.effect).toBe(
      "physPen +15, bellstrikePen +15",
    )
  })

  it("Receives row on Bleed Detonation reads the same point units", () => {
    const rows = receivesForSkill(
      findSkill("Bleed Detonation"),
      CLASS,
      inputsWithSwordHorizon("tier 6"),
    )
    expect(rows.find((row) => row.id === "bellstrikeUmbraBleedPen")!.effect).toBe(
      "physPen +15, bellstrikePen +15",
    )
  })
})

describe("catalog summary pins — soulShaken", () => {
  it("Applies row on SpearQ reads the pre-conversion per-stack text", () => {
    const rows = appliesForSkill(findSkill("SpearQ"), CLASS)
    expect(rows.find((row) => row.id === "soulShaken")!.effect).toBe("+10.0% all/stack")
  })
})

describe("catalog summary pins — surgingWaves", () => {
  it("Applies row on Dragon Head - Plus reads the pre-conversion per-stack text", () => {
    const rows = appliesForSkill(findSkill("Dragon Head - Plus"), CLASS)
    expect(rows.find((row) => row.id === "surgingWaves")!.effect).toBe("+1.3% all/stack")
  })
})

describe("catalog summary pins — fluteBoost", () => {
  it("Applies row on Flute of the Tides Full reads the pre-conversion param-sourced text", () => {
    const rows = appliesForSkill(findSkill("Flute of the Tides Full"), CLASS)
    expect(rows.find((row) => row.id === "fluteBoost")!.effect).toBe("+all (from fluteBoostValue)")
  })
})

describe("catalog summary pins — bellstrikeUmbraBleedingDamage", () => {
  it("Class Buffs row reads the pre-conversion key name and percent", () => {
    const rows = alwaysActiveClassBuffs(inputsWithSwordHorizon("tier 6"))
    expect(rows.find((row) => row.id === "bellstrikeUmbraBleedingDamage")!.effect).toBe(
      "affinityDmg +18%",
    )
  })

  it("Receives row on Bleed Detonation reads the same text", () => {
    const rows = receivesForSkill(
      findSkill("Bleed Detonation"),
      CLASS,
      inputsWithSwordHorizon("tier 6"),
    )
    expect(rows.find((row) => row.id === "bellstrikeUmbraBleedingDamage")!.effect).toBe(
      "affinityDmg +18%",
    )
  })
})

describe("catalog summary pins — concentration", () => {
  it("Receives row omits the tier-6 pair, matching the pre-conversion display path", () => {
    const rows = receivesForSkill(findSkill("Sword Martial Q"), CLASS, {
      ...defaultInputs,
      classId: CLASS,
    })
    expect(rows.find((row) => row.id === "concentration")!.effect).toBe(
      "affinityDmg +10%, directAffinity +3%",
    )
  })
})
