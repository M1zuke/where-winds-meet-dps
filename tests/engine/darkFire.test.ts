// Skill coefficients are recalibrated to the mystic art's actual reachable
// rank, in-game values as of 2026-09-09 — the same rank the plain Dragon's
// Breath rows carry, so the two share identical multipliers and differ only
// in which debuff they apply. The DoT's own coefficients are recalibrated the
// same way — see `debuffs.ts`.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { builtinDebuff, builtinSkill, dotRow } from "../builtins"
import { DEBUFF } from "../../src/data/skills/bellstrike-umbra/ids"
import { SKILL as UNIVERSAL_SKILL } from "../../src/data/skills/universal/ids"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import { makeSkill, makeHit } from "../../src/engine/skill"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const DARK_FIRE_ID = DEBUFF.darkFire
const ONE_HIT = SKILL.dragonFireSmolder1Hit
const TWO_HITS = SKILL.dragonFireSmolder2Hits

const skillOf = (skillId: string) => builtinSkill(CLASS, skillId)

const PAD = makeSkill(CLASS, { name: "Pad", castFrames: 1200, hits: [makeHit({ frame: 0 })] })

function run(skillIds: string[]): ReturnType<typeof simulateTimeline> {
  const steps = skillIds.map((skillId) => {
    const skill = skillOf(skillId)
    return makeStep({ skillId: skill.id, hitCount: skill.hits.length })
  })
  steps.push(makeStep({ skillId: PAD.id, hitCount: 1 }))
  const inputs: Inputs = {
    ...defaultInputs,
    classId: CLASS,
    customSkills: [PAD],
    activeCustomRotation: makeRotation(CLASS, { name: `test-${skillIds.join("+")}`, steps }),
  }
  return simulateTimeline(inputs)
}

const dotDamage = (r: ReturnType<typeof simulateTimeline>, debuffId: string): number =>
  r.perSkill
    .filter((p) => p.name === dotRow(CLASS, debuffId))
    .reduce((a, p) => a + p.expectedDamage, 0)

describe("Smolder debuff data", () => {
  const darkFire = builtinDebuff(CLASS, DARK_FIRE_ID)

  it("exists as its own DoT, independent of Combustion", () => {
    expect(darkFire).toBeTruthy()
    expect(darkFire!.name).toBe("Smolder")
    const combustion = builtinDebuff(CLASS, DEBUFF.combustion)
    expect(combustion).toBeTruthy()
    expect(combustion!.id).not.toBe(darkFire!.id)
  })

  it("carries the DoT row recalibrated to the mystic art's actual reachable rank", () => {
    const dot = darkFire!.dot!
    expect(dot.physMultiplier).toBeCloseTo(0.24991, 10)
    expect(dot.attributeMultiplier).toBeCloseTo(0.374865, 10)
    expect(dot.physFixed).toBeCloseTo(37.74, 10)
    expect(dot.attributeFixed).toBe(0)
    expect(dot.tickIntervalFrames).toBe(30)
    expect(darkFire!.maxStacks).toBe(1)
    expect(darkFire!.stackScaling).toBe("flat")
  })
})

describe("Dragon Fire (Smolder) skills", () => {
  it("both exist and carry the workbook's Smolder coefficients", () => {
    const one = skillOf(ONE_HIT)
    const two = skillOf(TWO_HITS)

    const sum = (s: typeof one, field: "physMultiplier" | "attributeMultiplier" | "physFixed") =>
      s.hits.reduce((a, h) => a + h[field], 0)

    expect(one.hits.length).toBe(1)
    expect(sum(one, "physMultiplier")).toBeCloseTo(1.36064, 10)
    expect(sum(one, "attributeMultiplier")).toBeCloseTo(2.04096, 10)
    expect(sum(one, "physFixed")).toBeCloseTo(205.5, 10)

    expect(two.hits.length).toBe(3)
    expect(sum(two, "physMultiplier")).toBeCloseTo(4.22076, 10)
    expect(sum(two, "attributeMultiplier")).toBeCloseTo(6.33114, 10)
    expect(sum(two, "physFixed")).toBeCloseTo(637.47, 10)
  })

  it("apply Combustion, never Smolder, even though the coefficients now match", () => {
    const fb1 = skillOf(UNIVERSAL_SKILL.fireBreath1Hit)
    const fb2 = skillOf(UNIVERSAL_SKILL.fireBreath2Hit)
    expect(fb1.hits[0].physMultiplier).toBeCloseTo(1.36064, 10)
    expect(fb2.hits.reduce((a, h) => a + h.physMultiplier, 0)).toBeCloseTo(4.22076, 10)
    const fbTargets = [fb1, fb2].flatMap((s) =>
      s.hits.flatMap((h) => h.triggers.map((t) => t.targetId)),
    )
    expect(fbTargets.every((id) => id !== DARK_FIRE_ID)).toBe(true)
    expect(fbTargets).toContain(DEBUFF.combustion)
  })

  it("each applies Smolder", () => {
    for (const skillId of [ONE_HIT, TWO_HITS]) {
      const targets = skillOf(skillId).hits.flatMap((h) => h.triggers.map((t) => t.targetId))
      expect(targets).toContain(DARK_FIRE_ID)
    }
  })
})

describe("Dragon Fire (Smolder) → Smolder in the simulator", () => {
  it("casting either opens a Smolder window that actually ticks", () => {
    for (const skillId of [ONE_HIT, TWO_HITS]) {
      const result = run([skillId])
      expect(dotDamage(result, DEBUFF.darkFire)).toBeGreaterThan(0)
      const ticks = result.timeline!.filter(
        (ev) => ev.kind === "dot" && ev.skillName === dotRow(CLASS, DEBUFF.darkFire),
      )
      expect(ticks.length).toBeGreaterThan(0)
      for (const tick of ticks) expect(tick.damage).toBeGreaterThan(0)
    }
  })

  it("the 2-hit cast deals more direct damage than the 1-hit cast", () => {
    const one = run([ONE_HIT]).perSkill.find(
      (p) => p.name === skillOf(ONE_HIT).name,
    )!.expectedDamage
    const two = run([TWO_HITS]).perSkill.find(
      (p) => p.name === skillOf(TWO_HITS).name,
    )!.expectedDamage
    expect(two).toBeGreaterThan(one)
  })

  it("does not open a Combustion window, and Dragon's Breath does not open a Smolder one", () => {
    const smolder = run([ONE_HIT])
    expect(dotDamage(smolder, DEBUFF.combustion)).toBe(0)

    const plain = run([UNIVERSAL_SKILL.fireBreath1Hit])
    expect(dotDamage(plain, DEBUFF.darkFire)).toBe(0)
    expect(dotDamage(plain, DEBUFF.combustion)).toBeGreaterThan(0)
  })
})

describe("Smolder duration", () => {
  const darkFire = builtinDebuff(CLASS, DARK_FIRE_ID)

  it("has a 4 s base window, and every Smolder hit extends it 4 s", () => {
    expect(darkFire.durationFrames).toBe(240)
    for (const skillId of [ONE_HIT, TWO_HITS]) {
      const skill = skillOf(skillId)
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
    const windowSecOf = (skillId: string) => {
      const skill = skillOf(skillId)
      const inputs: Inputs = {
        ...defaultInputs,
        classId: CLASS,
        customSkills: [pad],
        activeCustomRotation: makeRotation(CLASS, {
          name: "pad-" + skillId,
          steps: [
            makeStep({ skillId: skill.id, hitCount: skill.hits.length }),
            makeStep({ skillId: pad.id, hitCount: 1 }),
          ],
        }),
      }
      const r = simulateTimeline(inputs)
      const ticks = r.timeline!.filter(
        (ev) => ev.kind === "dot" && ev.skillName === dotRow(CLASS, DEBUFF.darkFire),
      )
      const first = r.timeline!.find(
        (ev) => ev.kind === "hit" && /Smolder/.test(ev.skillName),
      )!.frame
      return (ticks[ticks.length - 1].frame + 30 - first) / 60
    }
    // The ticks only sample the window, and where the first one sits cancels in
    // the difference — the two extra hits are what must be worth 8 s.
    expect(windowSecOf(TWO_HITS) - windowSecOf(ONE_HIT)).toBeCloseTo(8, 1)
  })
})

describe("Zenith detonation extends Smolder", () => {
  it("Blood Burst carries an extend-only, zenith-gated Smolder trigger", () => {
    const det = skillOf(SKILL.bleedDetonation)
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
    const detonation = skillOf(SKILL.bleedDetonation)
    const smolder = skillOf(TWO_HITS)
    const filler = skillOf(UNIVERSAL_SKILL.soaring)
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
        (ev) => ev.kind === "dot" && ev.skillName === dotRow(CLASS, DEBUFF.darkFire),
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
    const detonation = skillOf(SKILL.bleedDetonation)
    const smolder = skillOf(TWO_HITS)
    const filler = skillOf(UNIVERSAL_SKILL.soaring)
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
        (ev) => ev.kind === "dot" && ev.skillName === dotRow(CLASS, DEBUFF.darkFire),
      ).length
    }
    for (const smolderCasts of [1, 2, 3, 4]) {
      expect(ticksFor(smolderCasts, 6)).toBeGreaterThanOrEqual(ticksFor(smolderCasts, 5))
    }
  })
})
