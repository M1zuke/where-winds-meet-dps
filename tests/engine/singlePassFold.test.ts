// Skills, buffs and debuffs below are placeholder content authored only for this file.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeBuff, type Buff } from "../../src/engine/buff"
import { makeDebuff, type Debuff } from "../../src/engine/debuff"
import { makeHit, makeSkill, makeTrigger, type Skill } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation } from "../builtins"
import { enduranceMeter, enduranceRequires } from "../../src/data/resources/enduranceMeter"
import type { Inputs, UnclaimedOddityNodes } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"

const NO_ODDITY_ENDURANCE: UnclaimedOddityNodes = {
  Qinghe: [101, 112, 126, 139],
  Kaifeng: [205, 222],
  Hexi: [305, 324],
  Jiangnan: [705, 719],
}

function inputsFor(
  skills: Skill[],
  rotationSkills: Skill[],
  extra: { buffs?: Buff[]; debuffs?: Debuff[] } = {},
): Inputs {
  return {
    ...defaultInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: extra.buffs ?? [],
    customDebuffs: extra.debuffs ?? [],
    unclaimedOddityNodes: NO_ODDITY_ENDURANCE,
    activeCustomRotation: testRotation(CLASS, {
      steps: rotationSkills.map((skill) => makeStep({ skillId: skill.id })),
    }),
  }
}

describe("a window that opens and closes as the run advances", () => {
  const burstAfterTheLastLaidHit = () => {
    const burst = makeSkill(CLASS, {
      name: "Late Burst",
      castFrames: 10,
      hits: [makeHit({ frame: 60, physFixed: 100 })],
    })
    const mark = makeDebuff(CLASS, {
      name: "Mark",
      maxStacks: 1,
      durationFrames: 300,
      detonation: { skillId: burst.id },
    })
    const detonator = makeSkill(CLASS, {
      name: "Detonator",
      castFrames: 30,
      hits: [
        makeHit({
          frame: 0,
          physFixed: 100,
          triggers: [
            makeTrigger({ kind: "applyDot", targetId: mark.id, stacks: 1 }),
            makeTrigger({ kind: "detonateDot", targetId: mark.id }),
          ],
        }),
      ],
    })
    return simulateTimeline(inputsFor([detonator, burst], [detonator], { debuffs: [mark] }))
  }

  it("ends at a detonation burst that lands after the last hit the rotation lays", () => {
    const result = burstAfterTheLastLaidHit()
    expect(result.perSkill.find((row) => row.name === "Late Burst")?.count).toBe(1)
    expect(result.rotationDuration).toBeCloseTo(1, 6)
  })

  it("lets a tick that precedes a trailing zero-damage hit run without counting it", () => {
    const pulse = makeDebuff(CLASS, {
      name: "Pulse",
      durationFrames: 300,
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
    const applier = makeSkill(CLASS, {
      name: "Applier",
      castFrames: 20,
      hits: [
        makeHit({
          frame: 0,
          physFixed: 100,
          triggers: [makeTrigger({ kind: "applyDot", targetId: pulse.id, stacks: 1 })],
        }),
      ],
    })
    const markerOnly = makeSkill(CLASS, {
      name: "Marker",
      castFrames: 120,
      hits: [makeHit({ frame: 100 })],
    })
    const result = simulateTimeline(
      inputsFor([applier, markerOnly], [applier, markerOnly], { debuffs: [pulse] }),
    )
    expect(result.rotationDuration).toBe(0)
    expect(result.perSkill.some((row) => row.name.includes("Pulse"))).toBe(false)
    expect(result.timeline!.some((event) => event.kind === "dot")).toBe(false)
  })
})

describe("a meter on the one ledger", () => {
  const meterId = enduranceMeter.id

  it("is read by a hit's triggers as it stood before the gain that hit makes later in the same list", () => {
    const flag = makeBuff(CLASS, {
      name: "Flag",
      activation: "triggered",
      durationFrames: 600,
      effects: [],
    })
    const spender = makeSkill(CLASS, {
      name: "Spender",
      castFrames: 20,
      meterCosts: [{ meterId, amount: 60 }],
      hits: [makeHit({ frame: 0, physFixed: 1 })],
    })
    const gainer = makeSkill(CLASS, {
      name: "Gainer",
      castFrames: 20,
      hits: [
        makeHit({
          frame: 0,
          physFixed: 1,
          triggers: [
            makeTrigger({ kind: "meterDelta", targetId: meterId, stacks: 60 }),
            makeTrigger({
              kind: "applyBuff",
              targetId: flag.id,
              stacks: 1,
              condition: enduranceRequires("gte", 70),
            }),
          ],
        }),
      ],
    })
    const result = simulateTimeline(
      inputsFor([spender, gainer], [spender, gainer], { buffs: [flag] }),
    )
    expect(result.buffWindows?.some((window) => window.name === "Flag")).toBe(false)
  })
})

describe("a release gate decided at its own frame", () => {
  const GATE_FRAME = 10

  function gatedRun(passes: boolean) {
    const spender = makeSkill(CLASS, {
      name: "Spender",
      castFrames: 80,
      meterCosts: [{ meterId: enduranceMeter.id, amount: passes ? 0 : 40 }],
      hits: [makeHit({ frame: 0, physFixed: 1 })],
    })
    const low = makeSkill(CLASS, {
      name: "Low Stage",
      castFrames: 60,
      hits: [makeHit({ frame: 0, physFixed: 1 })],
    })
    const high = makeSkill(CLASS, {
      name: "High Stage",
      castFrames: 60,
      releaseGates: [
        { atFrame: GATE_FRAME, requires: [enduranceRequires("gt", 60)], fallbackSkillId: low.id },
      ],
      hits: [makeHit({ frame: 0, physFixed: 1 })],
    })
    const result = simulateTimeline(inputsFor([spender, low, high], [spender, high]))
    const castStart = result.casts!.find((cast) => cast.skillName !== "Spender")!.timeSec * 60
    return { result, castStart }
  }

  it("lands a released skill's hit no earlier than the gate that chose it", () => {
    const { result, castStart } = gatedRun(false)
    const lowHit = result.timeline!.find((event) => event.skillName === "Low Stage")!
    expect(lowHit.frame).toBe(castStart + GATE_FRAME)
  })

  it("lands the named skill's own hit no earlier than the gate that confirmed it", () => {
    const { result, castStart } = gatedRun(true)
    const highHit = result.timeline!.find((event) => event.skillName === "High Stage")!
    expect(highHit.frame).toBe(castStart + GATE_FRAME)
  })
})
