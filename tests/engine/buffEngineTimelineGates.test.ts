// Skills, buffs and debuffs below are placeholder content authored only for this file, except the built-in buffs the cases read.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeDebuff, type Debuff } from "../../src/engine/debuff"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { PROP } from "../../src/data/skills/ids"
import { QI_BREAK_HP_DAMAGE_BONUS } from "../../src/data/baseStats/qiConstants"
import { makeStep, type Rotation } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { SET_ID } from "../../src/data/sets/ids"
import { gearSetFields } from "../helpers/withGearSet"
import type { Inputs } from "../../src/engine/types"

function inputsFor(
  classId: string,
  rotation: Rotation,
  skills: Skill[],
  debuffs: Debuff[] = [],
): Inputs {
  return {
    ...defaultInputs,
    classId,
    customSkills: skills,
    customDebuffs: debuffs,
    activeCustomRotation: rotation,
  }
}

function chipPresent(result: ReturnType<typeof simulateTimeline>, index: number, id: string) {
  return !!result.casts?.[index]?.buffs.some((chip) => chip.id === id)
}

function countOf(result: ReturnType<typeof simulateTimeline>, skillName: string): number {
  return result.perSkill.find((row) => row.name === skillName)?.count ?? 0
}

describe("a generated cast gated on a buff-engine status granted by a tick", () => {
  const CLASS = "silkbindJade"
  const MARKER_GRANTED_BY_GENERATED = BUFF.windrider

  function run(condition: { op: "gte" | "lte"; stacks: number }) {
    const pulse = makeDebuff(CLASS, {
      name: "Pulse",
      maxStacks: 1,
      durationFrames: 600,
      triggersBuffs: [BUFF.mirage],
      dot: {
        tickIntervalFrames: 30,
        physMultiplier: 0,
        physFixed: 1,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
      },
    })
    const generated = makeSkill(CLASS, {
      name: "Generated",
      castFrames: 10,
      triggersBuffs: [MARKER_GRANTED_BY_GENERATED],
      hits: [makeHit({ frame: 0, physFixed: 1 })],
    })
    const caster = makeSkill(CLASS, {
      name: "Caster",
      castFrames: 120,
      hits: [
        makeHit({
          frame: 0,
          physFixed: 1,
          triggers: [makeTrigger({ kind: "applyDebuff", targetId: pulse.id, stacks: 1 })],
        }),
        makeHit({
          frame: 100,
          physFixed: 1,
          triggers: [
            makeTrigger({
              kind: "castSkill",
              targetId: generated.id,
              conditions: [{ buffId: BUFF.mirage, source: "buffEngine", ...condition }],
            }),
          ],
        }),
      ],
    })
    return simulateTimeline(
      inputsFor(
        CLASS,
        makeRotation(CLASS, { steps: [makeStep({ skillId: caster.id })] }),
        [caster, generated],
        [pulse],
      ),
    )
  }

  it("is walked for its own grants when it is scored", () => {
    const result = run({ op: "gte", stacks: 1 })
    expect(countOf(result, "Generated")).toBe(1)
    expect(chipPresent(result, 0, MARKER_GRANTED_BY_GENERATED)).toBe(true)
  })

  it("is neither walked nor scored when the status rules it out", () => {
    const result = run({ op: "lte", stacks: 0 })
    expect(countOf(result, "Generated")).toBe(0)
    expect(chipPresent(result, 0, MARKER_GRANTED_BY_GENERATED)).toBe(false)
  })
})

describe("a detonation's burst hit", () => {
  const CLASS = "bellstrikeSplendor"

  it("feeds an on-damage grant of the skill it belongs to like any damaging hit", () => {
    const burst = makeSkill(CLASS, {
      name: "Burst",
      castFrames: 10,
      receives: [BUFF.qiankunsLockQiImbalance],
      hits: [makeHit({ frame: 0, physFixed: 1 })],
    })
    const bleed = makeDebuff(CLASS, {
      name: "Bleed",
      maxStacks: 1,
      durationFrames: 300,
      detonation: { skillId: burst.id },
      dot: {
        tickIntervalFrames: 30,
        physMultiplier: 0,
        physFixed: 1,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
      },
    })
    const detonator = makeSkill(CLASS, {
      name: "Detonator",
      castFrames: 120,
      hits: [
        makeHit({
          frame: 60,
          physFixed: 1,
          triggers: [
            makeTrigger({ kind: "applyDot", targetId: bleed.id, stacks: 1 }),
            makeTrigger({ kind: "detonateDot", targetId: bleed.id }),
          ],
        }),
      ],
    })
    const result = simulateTimeline(
      inputsFor(
        CLASS,
        makeRotation(CLASS, { steps: [makeStep({ skillId: detonator.id })] }),
        [detonator, burst],
        [bleed],
      ),
    )
    expect(countOf(result, "Burst")).toBe(1)
    expect(chipPresent(result, 0, BUFF.qiImbalance)).toBe(true)
  })
})

describe("the hit that empties the Qi bar, with a pre-score grant gated on the bar", () => {
  const CLASS = "bellstrikeUmbra"
  const EMPTYING_QI = 1_000_000

  function inputs(firstHitQiFlat: number, withBreakingPoint: boolean): Inputs {
    const probe = makeSkill(CLASS, {
      name: "Probe Pair",
      castFrames: 30,
      tags: [PROP.hasQiBreakDoubleDamage],
      hits: [
        makeHit({ frame: 0, physMultiplier: 1, qiFlat: firstHitQiFlat }),
        makeHit({ frame: 0, physMultiplier: 1, qiFlat: 0 }),
      ],
    })
    const base = inputsFor(
      CLASS,
      makeRotation(CLASS, { steps: [makeStep({ skillId: probe.id })] }),
      [probe],
    )
    return withBreakingPoint
      ? {
          ...base,
          mindMethods: [
            { name: "Breaking Point", stacks: "tier 5" },
            ...base.mindMethods.slice(1),
          ] as Inputs["mindMethods"],
        }
      : base
  }

  const hitDamages = (firstHitQiFlat: number) =>
    simulateTimeline(inputs(firstHitQiFlat, true), {})
      .timeline!.filter((event) => event.kind === "hit")
      .map((event) => event.damage)

  const [unbrokenFirst] = hitDamages(0)
  const [emptyingHit, nextHit] = hitDamages(EMPTYING_QI)

  it("grants the emptying hit nothing", () => {
    expect(emptyingHit).toBeCloseTo(unbrokenFirst, 6)
  })

  it("grants the next hit inside the break a stack before it is scored", () => {
    expect(nextHit / unbrokenFirst).toBeGreaterThan(2 * (1 + QI_BREAK_HP_DAMAGE_BONUS) + 1e-6)
  })
})

describe("a damage-over-time tick as a damage event", () => {
  const CLASS = "bellstrikeUmbra"
  const PROBE_FRAME = 400

  function probeDamage(options: { withTicks: boolean; setId: string | null }): number {
    const pulse = makeDebuff(CLASS, {
      name: "Pulse",
      maxStacks: 1,
      durationFrames: 600,
      dot: {
        tickIntervalFrames: 30,
        physMultiplier: 0,
        physFixed: 1,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 10,
      },
    })
    const carrier = makeSkill(CLASS, {
      name: "Carrier",
      castFrames: PROBE_FRAME + 10,
      hits: [
        makeHit({
          frame: 0,
          physFixed: 1,
          triggers: options.withTicks
            ? [makeTrigger({ kind: "applyDot", targetId: pulse.id, stacks: 1 })]
            : [],
        }),
        makeHit({ frame: PROBE_FRAME, physFixed: 1000 }),
      ],
    })
    const base = inputsFor(
      CLASS,
      makeRotation(CLASS, { steps: [makeStep({ skillId: carrier.id })] }),
      [carrier],
      [pulse],
    )
    const inputs: Inputs = {
      ...base,
      ...gearSetFields(options.setId, { fabricatePieces: true }, base),
    }
    return simulateTimeline(inputs).timeline!.find((event) => event.frame === PROBE_FRAME)!.damage
  }

  it("keeps a grant that listens to any damage stacked past the direct hit's own window", () => {
    const unboosted = probeDamage({ withTicks: false, setId: null })
    const withoutTicks = probeDamage({ withTicks: false, setId: SET_ID.cleftpeak })
    const withTicks = probeDamage({ withTicks: true, setId: SET_ID.cleftpeak })
    expect(withoutTicks / unboosted).toBeLessThan(1.02)
    expect(withTicks / unboosted).toBeGreaterThan(1.04)
  })
})
