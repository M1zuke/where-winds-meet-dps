// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes". Pins the
// Skill Editor text for the eight buffs (of the 18 Umbra-scoped modules) whose
// rendering carries an author-written `summary` rather than one the catalog's
// generic label table can derive from the effect list, so a future edit can't
// move it silently. The other ten (zenithBar, potentRiverFlow, wineGu,
// revelryScript, vulnerabilityTeammate, mirage, mirageBonus,
// rainwhisperShield, resistanceResolve, dragonHeadLowHp) all express their
// bonus as a plain `allDamageBoost` `StatKey`, which that generic table
// already renders as "+N% all".
import { describe, expect, it } from "vitest"
import {
  appliesForSkill,
  alwaysActiveClassBuffs,
  receivesForSkill,
} from "../../src/engine/buffs/catalog"
import { defaultInputs } from "../../src/engine/defaults"
import { healerBuff } from "../../src/data/skills/buffs/healerBuff"
import type { Inputs } from "../../src/engine/types"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { SKILL as UNIVERSAL_SKILL } from "../../src/data/skills/universal/ids"

const CLASS = "bellstrikeUmbra"

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

// Sword Horizon gates bellstrikeUmbraBleedPen/bellstrikeUmbraBleedingDamage/
// zenithBar; Wolfchaser's Art tier 6 gates soulShaken — the two
// `requires` every scoped Class Buffs row actually reads. Insightful Strike's
// and Revelry Script's own params gate other, unscoped modules and stay
// closed here on purpose.
function inputsWithSwordHorizonAndWolfchasersArt(): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    mindMethods: [
      { name: "Sword Horizon", stacks: "tier 6" },
      { name: "Wolfchaser's Art", stacks: "tier 6" },
      { name: "", stacks: "" },
      { name: "", stacks: "" },
    ],
  }
}

describe("catalog summary pins — jadeware", () => {
  it("Applies row on Sword Martial Q reads the pre-conversion BuffDef text", () => {
    const rows = appliesForSkill(builtinSkill(CLASS, SKILL.swordq), CLASS)
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

  it("Receives row on Blood Burst reads the same point units", () => {
    const rows = receivesForSkill(
      builtinSkill(CLASS, SKILL.bleedDetonation),
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
    const rows = appliesForSkill(builtinSkill(CLASS, SKILL.spearq), CLASS)
    expect(rows.find((row) => row.id === "soulShaken")!.effect).toBe("+10.0% all/stack")
  })
})

describe("catalog summary pins — surgingWaves", () => {
  it("Applies row on Dragon Head - Plus reads the pre-conversion per-stack text", () => {
    const rows = appliesForSkill(builtinSkill(CLASS, UNIVERSAL_SKILL.dragonHeadPlus), CLASS)
    expect(rows.find((row) => row.id === "surgingWaves")!.effect).toBe("+1.3% all/stack")
  })
})

describe("catalog summary pins — fluteBoost", () => {
  it("Applies row on Flute of the Tides Full reads the pre-conversion param-sourced text", () => {
    const rows = appliesForSkill(builtinSkill(CLASS, UNIVERSAL_SKILL.fluteOfTheTidesFull), CLASS)
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

  it("Receives row on Blood Burst reads the same text", () => {
    const rows = receivesForSkill(
      builtinSkill(CLASS, SKILL.bleedDetonation),
      CLASS,
      inputsWithSwordHorizon("tier 6"),
    )
    expect(rows.find((row) => row.id === "bellstrikeUmbraBleedingDamage")!.effect).toBe(
      "affinityDmg +18%",
    )
  })
})

describe("Class Buffs column — scope, not alwaysActive, decides membership", () => {
  it("is exactly the four scoped modules, with Sword Horizon and Wolfchaser's Art both at tier 6", () => {
    const rows = alwaysActiveClassBuffs(inputsWithSwordHorizonAndWolfchasersArt())
    expect(rows.map((row) => `${row.id}: ${row.effect}`).sort()).toEqual(
      [
        "bellstrikeUmbraBleedPen: physPen +15, bellstrikePen +15",
        "bellstrikeUmbraBleedingDamage: affinityDmg +18%",
        "soulShaken: +10.0% all/stack",
        "buff-bellstrikeUmbra-zenith-bar: +15.0% all",
      ].sort(),
    )
  })
})

describe("catalog summary pins — concentration", () => {
  it("Receives row reads the mechanic's own effects, the ones it applies", () => {
    const rows = receivesForSkill(builtinSkill(CLASS, SKILL.swordq), CLASS, {
      ...defaultInputs,
      classId: CLASS,
    })
    const concentration = rows.find((row) => row.id === "concentration")!
    expect(concentration.effect).toBe(
      "Affinity Damage Boost +10.0%, Direct Affinity +3.0%, General Damage Boost +1.5%",
    )
    expect(concentration.requires).toBe("Insightful Strike")
  })
})
