// Ladder [2, 2.5, 3, 4, 5] source: Bellstrike Umbra v1.5 lvl-110 coefficient
// table (`reference/workbook/umbraSkillCoefficients.wb1.5-lvl110.json`), bleed
// rows 0.13728 / 0.1716 / 0.20592 / 0.27456 / 0.3432 phys = unit 0.06864 ×
// that ladder.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinDebuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { seedDebuffFromBuiltin } from "../../src/engine/debuff"
import { seedSkillFromBuiltin } from "../../src/engine/skill"

const UNIT_PHYS = 0.06864
const UNIT_ATTR = 0.10296
const LADDER = [2, 2.5, 3, 4, 5]
const REFERENCE_PHYS = [0.13728, 0.1716, 0.20592, 0.27456, 0.3432]
const REFERENCE_ATTR = [0.20592, 0.2574, 0.30888, 0.41184, 0.5148]

const bleedTickDebuff = () =>
  builtinDebuffsForClass("bellstrikeUmbra").find(
    (d) => d.id === "debuff-bellstrikeUmbra-bleed-tick",
  )!
const bleedTickSkill = () =>
  builtinSkillsForClass("bellstrikeUmbra").find((s) => s.id === "bellstrikeUmbra-bleed-tick")!

const umbraInputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
const bleedDamage = (r: ReturnType<typeof runEngine>) =>
  r.perSkill.find((p) => p.name === "Bleeding (DoT)")?.expectedDamage ?? 0
const bleedTickCount = (r: ReturnType<typeof runEngine>) =>
  r.timeline!.filter((e) => e.kind === "dot" && e.skillName.includes("Bleeding")).length

describe("bleed per-stack ladder — data", () => {
  it("carries the ladder and a max of 5 stacks on a 1 s cadence", () => {
    const d = bleedTickDebuff()
    expect(d.maxStacks).toBe(5)
    expect(d.dot!.tickIntervalFrames).toBe(60)
    expect(d.dot!.perStackMultipliers).toEqual(LADDER)
    expect(d.dot!.perStackShapes).toBeNull()
  })

  it("unit × ladder reproduces the coefficient table's five bleed rows exactly", () => {
    const d = bleedTickDebuff()
    expect(d.dot!.physMultiplier).toBe(UNIT_PHYS)
    expect(d.dot!.attributeMultiplier).toBe(UNIT_ATTR)
    LADDER.forEach((m, i) => {
      expect(d.dot!.physMultiplier * m).toBeCloseTo(REFERENCE_PHYS[i], 10)
      expect(d.dot!.attributeMultiplier * m).toBeCloseTo(REFERENCE_ATTR[i], 10)
    })
  })

  it("the skill's per-tick hits all carry the same unit as the debuff's base shape", () => {
    const skill = bleedTickSkill()
    const dot = bleedTickDebuff().dot!
    expect(skill.hits.length).toBeGreaterThan(1)
    for (const h of skill.hits) {
      expect(h.physMultiplier).toBe(dot.physMultiplier)
      expect(h.attributeMultiplier).toBe(dot.attributeMultiplier)
    }
  })
})

describe("bleed per-stack ladder — engine behaviour", () => {
  const withLadder = runEngine(umbraInputs)

  it("beats the old linear × stacks model without changing tick scheduling", () => {
    const d = seedDebuffFromBuiltin("bellstrikeUmbra", bleedTickDebuff())
    const linear = runEngine({
      ...umbraInputs,
      customDebuffs: [
        { ...d, dot: { ...d.dot!, perStackShapes: null, perStackMultipliers: null } },
      ],
    })
    expect(bleedTickCount(withLadder)).toBe(bleedTickCount(linear))
    expect(bleedDamage(withLadder)).toBeGreaterThan(bleedDamage(linear))
  })

  it("scales every stack tier when the SKILL's per-tick unit is edited", () => {
    const s = seedSkillFromBuiltin("bellstrikeUmbra", bleedTickSkill())
    const doubled = {
      ...s,
      hits: s.hits.map((h) => ({
        ...h,
        physMultiplier: h.physMultiplier * 2,
        attributeMultiplier: h.attributeMultiplier * 2,
      })),
    }
    const edited = runEngine({ ...umbraInputs, customSkills: [doubled] })
    expect(bleedDamage(edited)).toBeCloseTo(bleedDamage(withLadder) * 2, 4)
  })

  it("skips ticks at 0 live stacks (post-detonation) rather than flooring to 1", () => {
    const ticks = withLadder.timeline!.filter(
      (e) => e.kind === "dot" && e.skillName.includes("Bleeding"),
    )
    expect(ticks.length).toBeGreaterThan(0)
    for (const tick of ticks) expect(tick.damage).toBeGreaterThan(0)
  })

  it("a ladder entry of 0 zeroes only that tier, and a malformed entry degrades to ×1", () => {
    const d = seedDebuffFromBuiltin("bellstrikeUmbra", bleedTickDebuff())
    const zeroed = runEngine({
      ...umbraInputs,
      customDebuffs: [{ ...d, dot: { ...d.dot!, perStackMultipliers: [0, 0, 0, 0, 0] } }],
    })
    expect(bleedDamage(zeroed)).toBe(0)
  })
})
