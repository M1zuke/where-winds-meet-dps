// `resolveTickDot` reads a tick source's `hits[0]` and nothing else, and the
// debuff owns the cadence and the count — so a second hit on a tick source is a
// copy that never fires, and one that drifts from `hits[0]` reads as a data
// error rather than the dead weight it is.
import { describe, expect, it } from "vitest"
import { CLASS_IDS } from "../../src/definitions/classes/registry"
import { builtinDebuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { tickSourceSkillId, dotTicksPerWindow } from "../../src/engine/dot"

function tickSources() {
  return CLASS_IDS().flatMap((classId) => {
    const skills = new Map(builtinSkillsForClass(classId).map((skill) => [skill.id, skill]))
    return builtinDebuffsForClass(classId)
      .filter((debuff) => debuff.dot)
      .map((debuff) => ({
        classId,
        debuff,
        source: skills.get(tickSourceSkillId(debuff) ?? ""),
      }))
      .filter((entry) => entry.source !== undefined)
  })
}

describe("every DoT tick source authors exactly one hit", () => {
  it("finds tick sources to check at all", () => {
    expect(tickSources().length).toBeGreaterThan(0)
  })

  it.each(tickSources().map((entry) => [`${entry.classId} ${entry.debuff.id}`, entry] as const))(
    "%s",
    (_label, entry) => {
      expect(entry.source!.hits).toHaveLength(1)
    },
  )

  it("takes its tick count from the debuff, which is the only thing that states one", () => {
    for (const { debuff } of tickSources()) {
      expect(dotTicksPerWindow(debuff)).toBeGreaterThan(0)
    }
  })
})
