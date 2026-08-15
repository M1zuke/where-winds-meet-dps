// `extraDebuffHits` has two independent shapes in the shipped skill data:
// generic (a zero-damage hit that re-applies a DoT via applyDebuff) and
// dragonBreath (pure extend-only triggers on Combustion — see docs/CALCULATION.md).
// Both are asserted on the data the app actually loads, since `timeline.ts` reads
// `extendFrames` / `extendOnly` at runtime.
import { describe, expect, it } from "vitest"
import { CLASS_IDS, classDefinition } from "../../src/definitions/classes/registry"
import { builtinSkill } from "../builtins"
import { SKILL as UNIVERSAL_SKILL } from "../../src/data/skills/universal/ids"

const FPS = 60

describe("extraDebuffHits wiring", () => {
  it("emits a zero-damage applyDebuff hit that re-applies the DoT (generic path)", () => {
    const flute = builtinSkill("bellstrikeUmbra", UNIVERSAL_SKILL.fluteOfTheTidesCancel)
    const [hit] = flute.hits
    expect(hit.physMultiplier).toBe(0)
    expect(hit.attributeMultiplier).toBe(0)
    expect(hit.triggers).toHaveLength(1)
    const [trigger] = hit.triggers
    expect(trigger.kind).toBe("applyDebuff")
    expect(trigger.targetId).toBe("debuff-bellstrikeUmbra-flute-ripple")
    expect(trigger.stacks).toBe(1)
    expect(trigger.condition).toBeNull()
    // Generic path re-applies; it must NOT carry the extend-only machinery.
    expect(trigger.extendFrames).toBeUndefined()
    expect(trigger.extendOnly).toBeFalsy()
  })

  it("wires Dragon's Breath 2 Hits as one apply plus pure Combustion-extend triggers (dragonBreath path)", () => {
    const breath = builtinSkill("bellstrikeUmbra", UNIVERSAL_SKILL.fireBreath2Hit)
    expect(breath.hits).toHaveLength(3)
    const [first, ...rest] = breath.hits

    // First hit applies Combustion (and sets its duration); the rest only extend.
    expect(first.triggers).toHaveLength(1)
    expect(first.triggers[0].targetId).toBe("debuff-bellstrikeUmbra-combustion")
    expect(first.triggers[0].extendOnly).toBeFalsy()
    expect(first.triggers[0].extendFrames).toBe(Math.round(1.5 * FPS))

    const extendFrames = rest.map((h) => {
      expect(h.triggers).toHaveLength(1)
      expect(h.triggers[0].kind).toBe("applyDebuff")
      expect(h.triggers[0].targetId).toBe("debuff-bellstrikeUmbra-combustion")
      expect(h.triggers[0].extendOnly).toBe(true)
      return h.triggers[0].extendFrames
    })
    expect(extendFrames).toEqual([Math.round(1 * FPS), Math.round(1.5 * FPS)])
  })

  // `timeline.ts` only consults `extendOnly` inside its `extendFrames != null`
  // branch. An extendOnly trigger with no extendFrames therefore falls through to
  // the plain apply path and re-applies the debuff instead of extending it —
  // silently wrong, and invisible to the type checker since both fields are
  // optional.
  it("every extend-only trigger in the library carries a positive extendFrames", () => {
    const broken: string[] = []
    for (const classId of CLASS_IDS()) {
      const skills = classDefinition(classId)?.skills ?? []
      for (const skill of skills) {
        for (const hit of skill.hits) {
          for (const trigger of hit.triggers) {
            if (!trigger.extendOnly) continue
            if (!trigger.extendFrames || trigger.extendFrames <= 0) {
              broken.push(`${classId}: ${skill.name} [${hit.id}] -> ${trigger.targetId}`)
            }
          }
        }
      }
    }
    expect(broken, "extendOnly triggers with no usable extendFrames").toEqual([])
  })
})
