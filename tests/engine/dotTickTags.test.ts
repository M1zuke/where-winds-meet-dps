// Scoped to Bellstrike Umbra — see CLASSES.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { dotTickSkill } from "../../src/engine/dot"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { builtinDebuff } from "../builtins"
import { DEBUFF } from "../../src/data/skills/bellstrike-umbra/ids"

const CLASS_ID = "bellstrikeUmbra"
const bleedTickDebuff = builtinDebuff(CLASS_ID, DEBUFF.bleedTick)
const bleedTickSkill = builtinSkillsForClass(CLASS_ID).find(
  (s) => s.id === `${CLASS_ID}-bleed-tick`,
)!

describe("DoT ticks are addressable by tag, not only by name", () => {
  it("carries the tick-source skill's tags", () => {
    expect(bleedTickSkill.tags).toContain("weapon:Sword")
    expect(dotTickSkill(bleedTickDebuff, bleedTickSkill).tags).toEqual(bleedTickSkill.tags)
  })

  it("merges the debuff's own tags on top, deduped", () => {
    const tagged = { ...bleedTickDebuff, tags: ["role:probe", "weapon:Sword"] }
    const merged = dotTickSkill(tagged, bleedTickSkill).tags!
    expect(merged).toContain("role:probe")
    expect(merged.filter((tag) => tag === "weapon:Sword")).toHaveLength(1)
    expect(new Set(merged)).toEqual(new Set([...bleedTickSkill.tags!, "role:probe"]))
  })

  it("still yields a tag-less tick when neither side declares any", () => {
    const untagged = { ...bleedTickDebuff, tags: undefined }
    expect(dotTickSkill(untagged, undefined).tags).toEqual([])
  })
})

describe("DoT ticks merge `receives` the same way they merge tags", () => {
  it("carries the tick-source skill's receives", () => {
    const debuffWithoutReceives = { ...bleedTickDebuff, receives: undefined }
    const withReceives = { ...bleedTickSkill, receives: ["bleedPen"] }
    expect(dotTickSkill(debuffWithoutReceives, withReceives).receives).toEqual(["bleedPen"])
  })

  it("merges the debuff's own receives on top, deduped", () => {
    const skillReceives = { ...bleedTickSkill, receives: ["bleedPen"] }
    const debuffReceives = { ...bleedTickDebuff, receives: ["bleedPen", "soulShaken"] }
    const merged = dotTickSkill(debuffReceives, skillReceives).receives!
    expect(new Set(merged)).toEqual(new Set(["bleedPen", "soulShaken"]))
  })

  it("still yields a receives-less tick when both sides are cleared, even though the real Bleed Tick debuff/skill both carry receives", () => {
    const debuffWithoutReceives = { ...bleedTickDebuff, receives: undefined }
    const skillWithoutReceives = { ...bleedTickSkill, receives: undefined }
    expect(dotTickSkill(debuffWithoutReceives, skillWithoutReceives).receives).toEqual([])
  })
})
