import { describe, expect, it } from "vitest"
import { buffGateSatisfied, hiddenTimelineBuffIds } from "../../src/engine/buffs/catalog"
import { GLOBAL_BUFF_DEFS } from "../../src/data/skills/buffs"
import { CLASS_DEFS } from "../../src/definitions/classes/registry"
import type { BuffModule } from "../../src/engine/buffs/buffModule"

const module: BuffModule = {
  id: "class-scoped",
  name: "Class scoped",
  requires: { classId: "someClass" },
  alwaysActive: true,
  duration: 9999,
  effects: [],
}

describe("a buff module's requires.classId", () => {
  it("registers in that class's build", () => {
    expect(buffGateSatisfied(module, { classId: "someClass" })).toBe(true)
  })

  it("does not exist in any other class's build", () => {
    expect(buffGateSatisfied(module, { classId: "otherClass" })).toBe(false)
    expect(buffGateSatisfied(module, {})).toBe(false)
  })

  it("stacks with the other requirements rather than replacing them", () => {
    const withSet: BuffModule = { ...module, requires: { classId: "someClass", set: "someSet" } }
    expect(buffGateSatisfied(withSet, { classId: "someClass", armorSet: "someSet" })).toBe(true)
    expect(buffGateSatisfied(withSet, { classId: "someClass", armorSet: "otherSet" })).toBe(false)
  })

  it("an always-active module it scopes is hidden from that class's timeline chips and nobody else's", () => {
    const scoped = GLOBAL_BUFF_DEFS.filter(
      (candidate) => candidate.alwaysActive && candidate.requires?.classId,
    )
    expect(scoped.length).toBeGreaterThan(0)
    for (const candidate of scoped) {
      const owner = candidate.requires!.classId!
      expect(hiddenTimelineBuffIds(owner).has(candidate.id)).toBe(true)
      for (const classDef of CLASS_DEFS())
        if (classDef.id !== owner)
          expect(hiddenTimelineBuffIds(classDef.id).has(candidate.id)).toBe(false)
    }
  })
})
