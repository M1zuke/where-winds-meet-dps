import { describe, expect, it } from "vitest"
import { buffGateSatisfied } from "../../src/engine/buffs/catalog"
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
})
