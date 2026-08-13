import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { applyBuffEffects } from "../../src/engine/statRegistry"
import { getBreakthrough } from "../../src/definitions/baseStats/breakthroughs"
import { builtinDebuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import {
  RIVER_FLOW_BUFF_ID,
  SPEAR_SPECIAL_COOLDOWN_BUFF_ID,
} from "../../src/data/classes/bellstrike-umbra/gates"
import { DEBUFF } from "../../src/data/skills/bellstrike-umbra/ids"

const CLASS = "bellstrikeUmbra"
const SPEAR_SPECIAL_IDS = [
  "bellstrikeUmbra-spearspecial",
  "bellstrikeUmbra-spearspecial-1-hit-cancel",
]

describe("target.defensePct — a fraction of the breakthrough's own defense", () => {
  it("resolves against base target defense instead of landing on inputs", () => {
    const baseDefense = getBreakthrough(defaultInputs.breakthrough).defense
    const { inputs, targetOverride } = applyBuffEffects(defaultInputs, [
      { statKey: "target.defensePct", amount: -0.05 },
    ])
    expect(targetOverride.defenseDelta).toBeCloseTo(-0.05 * baseDefense, 10)
    expect(inputs).toBe(defaultInputs)
  })

  it("scales with the breakthrough, so the same effect is not a fixed number of points", () => {
    const lowTier = { ...defaultInputs, breakthrough: 12 }
    const highTier = { ...defaultInputs, breakthrough: 21 }
    const deltaAt = (inputs: typeof defaultInputs) =>
      applyBuffEffects(inputs, [{ statKey: "target.defensePct", amount: -0.05 }]).targetOverride
        .defenseDelta!
    expect(deltaAt(highTier)).toBeLessThan(deltaAt(lowTier))
  })

  it("sums with a flat target.defense delta", () => {
    const baseDefense = getBreakthrough(defaultInputs.breakthrough).defense
    const { targetOverride } = applyBuffEffects(defaultInputs, [
      { statKey: "target.defensePct", amount: -0.05 },
      { statKey: "target.defense", amount: -10 },
    ])
    expect(targetOverride.defenseDelta).toBeCloseTo(-0.05 * baseDefense - 10, 10)
  })
})

describe("Defense Down — the Spear Special's target defense reduction", () => {
  const debuff = builtinDebuffsForClass(CLASS).find((d) => d.id === DEBUFF.defenseDown)!

  it("is a 10-second, effect-carrying debuff with no DoT of its own", () => {
    expect(debuff).toBeTruthy()
    expect(debuff.name).toBe("Defense Down")
    expect(debuff.durationFrames).toBe(600)
    expect(debuff.dot).toBeNull()
    expect(debuff.maxStacks).toBe(1)
    expect(debuff.effects).toEqual([{ statKey: "target.defensePct", amount: -0.05 }])
  })

  it("is applied by every hit of both Spear Special variants, gated on River Flow up and the cooldown down", () => {
    const skills = builtinSkillsForClass(CLASS)
    for (const id of SPEAR_SPECIAL_IDS) {
      const skill = skills.find((s) => s.id === id)!
      expect(skill.hits.length).toBeGreaterThan(0)
      for (const hit of skill.hits) {
        const applied = hit.triggers.filter(
          (t) => t.kind === "applyDebuff" && t.targetId === DEBUFF.defenseDown,
        )
        expect(applied).toHaveLength(1)
        expect(applied[0].condition).toEqual({
          buffId: RIVER_FLOW_BUFF_ID,
          op: "gte",
          stacks: 1,
        })
        expect(applied[0].conditions).toEqual([
          { buffId: SPEAR_SPECIAL_COOLDOWN_BUFF_ID, op: "eq", stacks: 0 },
        ])
      }
    }
  })

  it("no other skill applies it", () => {
    const appliers = builtinSkillsForClass(CLASS).filter((s) =>
      s.hits.some((hit) =>
        hit.triggers.some((t) => t.kind === "applyDebuff" && t.targetId === DEBUFF.defenseDown),
      ),
    )
    expect(appliers.map((s) => s.id).sort()).toEqual([...SPEAR_SPECIAL_IDS].sort())
  })

  it("opens windows on the default rotation, none of them before the first Spear Special", () => {
    const result = runEngine({ ...defaultInputs, classId: CLASS })
    const windows = result.buffWindows!.filter((w) => w.id === DEBUFF.defenseDown)
    expect(windows.length).toBeGreaterThan(0)
    for (const window of windows) {
      expect(window.endSec - window.startSec).toBeCloseTo(10, 6)
    }
    const firstSpearSpecial = result
      .timeline!.filter((ev) => ev.skillName.startsWith("Spear Special"))
      .reduce((earliest, ev) => Math.min(earliest, ev.timeSec), Infinity)
    expect(Math.min(...windows.map((w) => w.startSec))).toBeGreaterThanOrEqual(firstSpearSpecial)
  })

  it("raises the rotation's damage — the reduction reaches the damage kernel", () => {
    const withDebuff = runEngine({ ...defaultInputs, classId: CLASS })
    const withoutDebuff = runEngine({
      ...defaultInputs,
      classId: CLASS,
      customDebuffs: [{ ...debuff, effects: [] }],
    })
    expect(withDebuff.totalDamage).toBeGreaterThan(withoutDebuff.totalDamage)
  })
})
