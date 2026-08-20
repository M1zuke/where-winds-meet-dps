// A tick never reaches `buildArt`, where a regular hit's `extraCritDamage`
// sentinel is resolved, so the tick path resolves it separately — these pin the
// two to the same answer.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applyArmorSet, applyBowSet } from "../../src/engine/panel"
import { rotationPoolFor } from "../../src/definitions/rotations/registry"
import { DRONE_TICK } from "../../src/data/skills/silkbind-jade/droneTick"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import type { Inputs } from "../../src/engine/types"

const DRONE_ROW = "UmbDrone[20hit] (DoT)"

function droneDamage(dropTheGate: boolean): number {
  const rot = rotationPoolFor("silkbindJade").rotations.find(
    (r) => r.id === "builtin-silkbindJade-t5",
  )!
  const raw: Inputs = {
    ...defaultInputs,
    classId: "silkbindJade",
    activeCustomRotation: rot,
    // The tick SKILL is what supplies a tick its coefficients, overriding the
    // debuff's own dot — so the gate has to be dropped there to drop it at all.
    ...(dropTheGate
      ? {
          customSkills: builtinSkillsForClass("silkbindJade")
            .filter((skill) => skill.id.includes("umbdrone-"))
            .map((skill) => ({
              ...skill,
              hits: skill.hits.map((hit) => ({ ...hit, extraCritDamage: 0 })),
            })),
        }
      : {}),
  }
  const result = simulateTimeline(applyBowSet(applyArmorSet(withDerivedStats(raw))))
  return result.perSkill.find((row) => row.name === DRONE_ROW)!.expectedDamage
}

describe("a DoT tick resolves the min-phys crit sentinel", () => {
  it("the drone authors the sentinel every other Umbrella hit carries", () => {
    expect(DRONE_TICK.extraCritDamage).toBe(1)
  })

  it("the sentinel raises the drone's damage rather than being ignored", () => {
    expect(droneDamage(false)).toBeGreaterThan(droneDamage(true))
  })

  // Left raw, a sentinel of 1 would read as +100 % crit damage instead of the
  // gate's capped +36 %, so the tick must land far below double.
  it("resolves to the gated bonus, not a literal +100 % crit damage", () => {
    expect(droneDamage(false) / droneDamage(true)).toBeLessThan(1.2)
  })
})
