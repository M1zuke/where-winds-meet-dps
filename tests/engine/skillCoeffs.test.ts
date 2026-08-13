// Guards the shipped skill library in `src/data/skills/` against silent drift.
// The expected coefficients below are the reference values a hand-edit must not
// change by accident — a change here should be deliberate and re-affirmed.
//
// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  builtinBuffsForClass,
  builtinDebuffsForClass,
  builtinSkillsForClass,
} from "../../src/engine/builtinLibrary"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"

const CLASS = "bellstrikeUmbra"

describe("built-in skill coefficient split — coeffsAreTotal only", () => {
  it("Bleed Tick (a DoT tick) carries the FULL per-hit coeff on every hit", () => {
    const bleedTick = builtinSkill(CLASS, SKILL.bleedTick)
    expect(bleedTick.hits.length).toBeGreaterThan(1)
    for (const hit of bleedTick.hits) {
      expect(hit.physMultiplier).toBeCloseTo(0.06864, 10)
      expect(hit.attributeMultiplier).toBeCloseTo(0.10296, 10)
    }
  })
})

describe("built-in skill effect-trigger wiring", () => {
  it("a bleed-applying skill carries a per-hit applyDot trigger targeting the class's bleed debuff", () => {
    const skills = builtinSkillsForClass(CLASS)
    const applier = skills.find((s) =>
      s.hits.some((h) =>
        h.triggers.some((t) => t.kind === "applyDot" && t.targetId.includes("bleed")),
      ),
    )
    expect(applier).toBeTruthy()
    const bleedTrigger = applier!.hits
      .flatMap((h) => h.triggers)
      .find((t) => t.targetId.includes("bleed"))
    expect(bleedTrigger?.kind).toBe("applyDot")
  })
})

// `timeline.ts` silently `continue`s past a trigger whose target is missing from
// the pool (`if (!status) continue` / `if (!sub) continue`). A dangling id costs
// damage with no crash, no warning and no type error — only this sweep catches it.
describe("built-in trigger targets all resolve", () => {
  it("every built-in trigger resolves within the class's own pools", () => {
    const skills = builtinSkillsForClass(CLASS)
    const skillIds = new Set(skills.map((s) => s.id))
    const statusIds = new Set([
      ...builtinBuffsForClass(CLASS).map((b) => b.id),
      ...builtinDebuffsForClass(CLASS).map((d) => d.id),
    ])

    const dangling: string[] = []
    for (const skill of skills) {
      for (const hit of skill.hits) {
        for (const trigger of hit.triggers) {
          const pool = trigger.kind === "castSkill" ? skillIds : statusIds
          if (!pool.has(trigger.targetId)) {
            dangling.push(`${skill.name} [${hit.id}] ${trigger.kind} -> ${trigger.targetId}`)
          }
        }
      }
    }
    expect(dangling, `dangling trigger targets in ${CLASS}`).toEqual([])
  })

  it("every built-in debuff detonation points at a real skill", () => {
    const skillIds = new Set(builtinSkillsForClass(CLASS).map((s) => s.id))
    const dangling: string[] = []
    for (const debuff of builtinDebuffsForClass(CLASS)) {
      const skillId = debuff.detonation?.skillId
      if (skillId && !skillIds.has(skillId)) {
        dangling.push(`${debuff.name} detonation -> ${skillId}`)
      }
    }
    expect(dangling, "dangling detonation skill ids").toEqual([])
  })
})
