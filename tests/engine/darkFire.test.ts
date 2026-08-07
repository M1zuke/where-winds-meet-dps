// Coefficients (1-hit 128.48 %, 2-hit 398.55 %, DoT 23.6 % / 44 flat) are
// sourced from the lvl-110 workbook's Smolder rows, distinct from the plain
// Dragon's Breath rows.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinSkillsForClass, builtinDebuffsForClass } from "../../src/engine/builtinLibrary"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeSkill, makeHit } from "../../src/engine/skill"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const DARK_FIRE_ID = "debuff-bellstrikeUmbra-dark-fire"
const ONE_HIT = "Dragon's Breath: Smolder 1 Hit"
const TWO_HITS = "Dragon's Breath: Smolder 2 Hits"

function skillNamed(name: string) {
  const skill = builtinSkillsForClass(CLASS).find((s) => s.name === name)
  if (!skill) throw new Error(`no built-in skill "${name}" for ${CLASS}`)
  return skill
}

const PAD = makeSkill(CLASS, { name: "Pad", castFrames: 1200, hits: [makeHit({ frame: 0 })] })

function run(skillNames: string[]): ReturnType<typeof simulateTimeline> {
  const steps = skillNames.map((name) => {
    const skill = skillNamed(name)
    return makeStep({ skillId: skill.id, hitCount: skill.hits.length })
  })
  steps.push(makeStep({ skillId: PAD.id, hitCount: 1 }))
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    customSkills: [PAD],
    activeCustomRotation: makeRotation(CLASS, { name: `test-${skillNames.join("+")}`, steps }),
  }
  return simulateTimeline(inputs)
}

const dotDamage = (r: ReturnType<typeof simulateTimeline>, label: string): number =>
  r.perSkill
    .filter((p) => p.name.includes(label) && p.name.includes("(DoT)"))
    .reduce((a, p) => a + p.expectedDamage, 0)

describe("Smolder debuff data", () => {
  const darkFire = builtinDebuffsForClass(CLASS).find((d) => d.id === DARK_FIRE_ID)

  it("exists as its own DoT, independent of Combustion", () => {
    expect(darkFire).toBeTruthy()
    expect(darkFire!.name).toBe("Smolder")
    const combustion = builtinDebuffsForClass(CLASS).find((d) => d.name === "Combustion")
    expect(combustion).toBeTruthy()
    expect(combustion!.id).not.toBe(darkFire!.id)
  })

  it("carries the workbook's Smolder DoT row verbatim", () => {
    const dot = darkFire!.dot!
    expect(dot.physMultiplier).toBeCloseTo(0.236, 10)
    expect(dot.attributeMultiplier).toBeCloseTo(0.354, 10)
    expect(dot.physFixed).toBeCloseTo(44, 10)
    expect(dot.attributeFixed).toBe(0)
    expect(dot.tickIntervalFrames).toBe(30)
    expect(darkFire!.maxStacks).toBe(1)
    expect(darkFire!.stackScaling).toBe("flat")
  })
})

describe("Dragon Fire (Smolder) skills", () => {
  it("both exist and carry the workbook's Smolder coefficients", () => {
    const one = skillNamed(ONE_HIT)
    const two = skillNamed(TWO_HITS)

    const sum = (s: typeof one, field: "physMultiplier" | "attributeMultiplier" | "physFixed") =>
      s.hits.reduce((a, h) => a + h[field], 0)

    expect(one.hits.length).toBe(1)
    expect(sum(one, "physMultiplier")).toBeCloseTo(1.2848, 10)
    expect(sum(one, "attributeMultiplier")).toBeCloseTo(1.9272, 10)
    expect(sum(one, "physFixed")).toBeCloseTo(241.5, 10)

    expect(two.hits.length).toBe(3)
    expect(sum(two, "physMultiplier")).toBeCloseTo(3.9855, 10)
    expect(sum(two, "attributeMultiplier")).toBeCloseTo(5.97825, 10)
    expect(sum(two, "physFixed")).toBeCloseTo(749, 10)
  })

  it("are distinct from the plain Dragon's Breath rows, which stay untouched", () => {
    const fb1 = skillNamed("Dragon's Breath 1 Hit")
    const fb2 = skillNamed("Dragon's Breath 2 Hits")
    expect(fb1.hits[0].physMultiplier).toBeCloseTo(1.36185, 10)
    expect(fb2.hits.reduce((a, h) => a + h.physMultiplier, 0)).toBeCloseTo(4.2245, 10)
    const fbTargets = [fb1, fb2].flatMap((s) =>
      s.hits.flatMap((h) => h.triggers.map((t) => t.targetId)),
    )
    expect(fbTargets.every((id) => id !== DARK_FIRE_ID)).toBe(true)
    expect(fbTargets).toContain("debuff-bellstrikeUmbra-combustion")
  })

  it("each applies Smolder", () => {
    for (const name of [ONE_HIT, TWO_HITS]) {
      const targets = skillNamed(name).hits.flatMap((h) => h.triggers.map((t) => t.targetId))
      expect(targets).toContain(DARK_FIRE_ID)
    }
  })
})

describe("Dragon Fire (Smolder) → Smolder in the simulator", () => {
  it("casting either opens a Smolder window that actually ticks", () => {
    for (const name of [ONE_HIT, TWO_HITS]) {
      const result = run([name])
      expect(dotDamage(result, "Smolder")).toBeGreaterThan(0)
      const ticks = result.timeline!.filter(
        (ev) => ev.kind === "dot" && ev.skillName.includes("Smolder"),
      )
      expect(ticks.length).toBeGreaterThan(0)
      for (const tick of ticks) expect(tick.damage).toBeGreaterThan(0)
    }
  })

  it("the 2-hit cast deals more direct damage than the 1-hit cast", () => {
    const one = run([ONE_HIT]).perSkill.find((p) => p.name === ONE_HIT)!.expectedDamage
    const two = run([TWO_HITS]).perSkill.find((p) => p.name === TWO_HITS)!.expectedDamage
    expect(two).toBeGreaterThan(one)
  })

  it("does not open a Combustion window, and Dragon's Breath does not open a Smolder one", () => {
    const smolder = run([ONE_HIT])
    expect(dotDamage(smolder, "Combustion")).toBe(0)

    const plain = run(["Dragon's Breath 1 Hit"])
    expect(dotDamage(plain, "Smolder")).toBe(0)
    expect(dotDamage(plain, "Combustion")).toBeGreaterThan(0)
  })
})

describe("Smolder duration", () => {
  const darkFire = builtinDebuffsForClass(CLASS).find((d) => d.id === DARK_FIRE_ID)!

  it("has a 4 s base window, and every Smolder hit extends it 4 s", () => {
    expect(darkFire.durationFrames).toBe(240)
    for (const name of [ONE_HIT, TWO_HITS]) {
      const skill = skillNamed(name)
      for (const hit of skill.hits) {
        const t = hit.triggers.find((tr) => tr.targetId === DARK_FIRE_ID)
        expect(t).toBeTruthy()
        expect(t!.extendFrames).toBe(240)
        expect(t!.extendOnly).toBeFalsy()
      }
    }
  })

  it("each extra hit lengthens the window by 4 s (1 hit = 4 s, 3 hits = 12 s)", () => {
    const pad = makeSkill(CLASS, { name: "Pad", castFrames: 2000, hits: [makeHit({ frame: 0 })] })
    const windowSecOf = (name: string) => {
      const skill = skillNamed(name)
      const inputs: Inputs = {
        ...defaultInputs,
        classId: CLASS,
        customSkills: [pad],
        activeCustomRotation: makeRotation(CLASS, {
          name: "pad-" + name,
          steps: [
            makeStep({ skillId: skill.id, hitCount: skill.hits.length }),
            makeStep({ skillId: pad.id, hitCount: 1 }),
          ],
        }),
      }
      const r = simulateTimeline(inputs)
      const ticks = r.timeline!.filter(
        (ev) => ev.kind === "dot" && ev.skillName.includes("Smolder"),
      )
      const first = r.timeline!.find(
        (ev) => ev.kind === "hit" && /Smolder/.test(ev.skillName),
      )!.frame
      return (ticks[ticks.length - 1].frame + 30 - first) / 60
    }
    expect(windowSecOf(ONE_HIT)).toBeCloseTo(4, 5)
    expect(windowSecOf(TWO_HITS)).toBeCloseTo(12, 5)
  })
})

describe("Zenith detonation extends Smolder", () => {
  it("Bleed Detonation carries an extend-only, zenith-gated Smolder trigger", () => {
    const det = builtinSkillsForClass(CLASS).find((s) => s.name === "Bleed Detonation")!
    const t = det.hits.flatMap((h) => h.triggers).find((tr) => tr.targetId === DARK_FIRE_ID)
    expect(t).toBeTruthy()
    expect(t!.extendFrames).toBe(600)
    expect(t!.extendOnly).toBe(true)
    expect(t!.condition?.buffId).toBe("buff-bellstrikeUmbra-zenith-detonation")
  })

  it("a zenith detonation lengthens an active window; a non-zenith one does not", () => {
    const swordHorizon: Inputs["mindMethods"] = [
      { name: "Sword Horizon", stacks: "tier 6" },
      { name: "Wolfchaser's Art", stacks: "tier 6" },
      { name: "Insightful Strike", stacks: "tier 6" },
      { name: "Morale Chant", stacks: "tier 6" },
    ]
    const detonation = skillNamed("Bleed Detonation")
    const smolder = skillNamed(TWO_HITS)
    const filler = skillNamed("Soaring")
    const ticksFor = (detonations: number) => {
      const steps = [makeStep({ skillId: smolder.id, hitCount: smolder.hits.length })]
      for (let i = 0; i < detonations; i++)
        steps.push(makeStep({ skillId: detonation.id, hitCount: 1 }))
      for (let i = 0; i < 20; i++)
        steps.push(makeStep({ skillId: filler.id, hitCount: filler.hits.length }))
      const inputs: Inputs = {
        ...defaultInputs,
        classId: CLASS,
        mindMethods: swordHorizon,
        activeCustomRotation: makeRotation(CLASS, { name: `zenith-${detonations}`, steps }),
      }
      return simulateTimeline(inputs).timeline!.filter(
        (ev) => ev.kind === "dot" && ev.skillName.includes("Smolder"),
      ).length
    }
    // See `ZENITH_MAX_EXTENDED_DURATION_FRAMES` (builtinBuffs.ts). No further
    // Smolder cast follows in this rotation, so once the window closes a
    // later detonation's extend-only trigger finds nothing active to extend.
    const noZenith = ticksFor(5)
    const oneZenith = ticksFor(6)
    expect(oneZenith - noZenith).toBe(11)
    expect(ticksFor(12) - oneZenith).toBe(0)
  })

  it("never shortens an already-longer window — a Zenith detonation can only extend, never truncate", () => {
    const swordHorizon: Inputs["mindMethods"] = [
      { name: "Sword Horizon", stacks: "tier 6" },
      { name: "Wolfchaser's Art", stacks: "tier 6" },
      { name: "Insightful Strike", stacks: "tier 6" },
      { name: "Morale Chant", stacks: "tier 6" },
    ]
    const detonation = skillNamed("Bleed Detonation")
    const smolder = skillNamed(TWO_HITS)
    const filler = skillNamed("Soaring")
    const ticksFor = (smolderCasts: number, detonations: number) => {
      const steps: ReturnType<typeof makeStep>[] = []
      for (let i = 0; i < smolderCasts; i++)
        steps.push(makeStep({ skillId: smolder.id, hitCount: smolder.hits.length }))
      for (let i = 0; i < detonations; i++)
        steps.push(makeStep({ skillId: detonation.id, hitCount: 1 }))
      for (let i = 0; i < 30; i++)
        steps.push(makeStep({ skillId: filler.id, hitCount: filler.hits.length }))
      const inputs: Inputs = {
        ...defaultInputs,
        classId: CLASS,
        mindMethods: swordHorizon,
        activeCustomRotation: makeRotation(CLASS, {
          name: `zenith-${smolderCasts}-${detonations}`,
          steps,
        }),
      }
      return simulateTimeline(inputs).timeline!.filter(
        (ev) => ev.kind === "dot" && ev.skillName.includes("Smolder"),
      ).length
    }
    for (const smolderCasts of [1, 2, 3, 4]) {
      expect(ticksFor(smolderCasts, 6)).toBeGreaterThanOrEqual(ticksFor(smolderCasts, 5))
    }
  })
})
