// Scoped to Silkbind Jade metadata; guards against a non-player factor baked
// into a skill's own coefficient stacking with the buff that reapplies it.
import { describe, expect, it } from "vitest"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { BUFF } from "../../src/data/skills/buffs/ids"

const skills = builtinSkillsForClass("silkbindJade")
const byId = (id: string) => skills.find((skill) => skill.id === id)!

describe("non-player damage factors are authored once, not baked in twice", () => {
  it.each([
    ["silkbindJade-fanlightcharged", BUFF.nonPlayerBaseDamage145],
    ["silkbindJade-fanheavypursuit-3-hit", BUFF.nonPlayerBaseDamage145],
    ["silkbindJade-fanheavypursuit-5-hit", BUFF.nonPlayerBaseDamage145],
    ["silkbindJade-umbdrone-20hit", BUFF.nonPlayerBaseDamage115],
    ["silkbindJade-umblightcharge", BUFF.nonPlayerBaseDamage125],
  ])("%s receives its non-player buff exactly once", (id, buffId) => {
    const skill = byId(id)
    const occurrences = (skill.receives ?? []).filter((entry) => entry === buffId).length
    expect(occurrences, id).toBe(1)
  })

  it("Forsaken Fame's coefficient is the player-target row, not the non-player total", () => {
    const hit = byId("silkbindJade-fanlightcharged").hits[0]
    expect(hit.physMultiplier).toBe(1.9044)
    expect(hit.attributeMultiplier).toBe(2.8566)
    expect(hit.physFixed).toBe(527)
    expect(hit.attributeFixed).toBe(287)
  })

  it("the drone tick's coefficient is the player-target row, not the non-player total", () => {
    const hit = byId("silkbindJade-umbdrone-20hit").hits[0]
    expect(hit.physMultiplier).toBe(0.510829)
    expect(hit.attributeMultiplier).toBe(0.766243)
    expect(hit.physFixed).toBe(141.375)
    expect(hit.attributeFixed).toBe(77)
  })
})
