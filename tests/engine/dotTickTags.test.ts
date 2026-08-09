// Scoped to Bellstrike Umbra — see CLASSES.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { dotTickSkill } from "../../src/engine/timeline"
import { builtinDebuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"

const CLASS_ID = "bellstrikeUmbra"
const bleedTickDebuff = builtinDebuffsForClass(CLASS_ID).find((d) => d.name === "Bleed Tick")!
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
