// Synthetic skills only — the rule under test holds for every class alike.
import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { makeHit, makeSkill, makeTrigger } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { makeDebuff } from "../../src/engine/debuff"
import { BUFF } from "../../src/data/skills/buffs/ids"
import type { Inputs } from "../../src/engine/types"

const CLASS = "bellstrikeUmbra"
const FPS = 60

describe("the fight timer starts at the first damaging hit", () => {
  it("ignores a leading zero-coefficient hit and starts at the first hit that deals damage", () => {
    const grant = makeSkill(CLASS, { name: "Grant", castFrames: 10, hits: [makeHit({ frame: 0 })] })
    const damaging = makeSkill(CLASS, {
      name: "Damaging",
      castFrames: 10,
      hits: [makeHit({ frame: 0, physMultiplier: 1 })],
    })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: grant.id }), makeStep({ skillId: damaging.id })],
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      customSkills: [grant, damaging],
      activeCustomRotation: rotation,
    }
    const result = simulateTimeline(inputs)
    expect(result.fightStartSec).toBeCloseTo(10 / FPS, 6)
  })

  it("a zero-coefficient hit inside the same cast that opens the fight does not start it", () => {
    const skill = makeSkill(CLASS, {
      name: "GrantThenHit",
      castFrames: 8,
      hits: [makeHit({ frame: 0 }), makeHit({ frame: 5, physMultiplier: 1 })],
    })
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id })] })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      customSkills: [skill],
      activeCustomRotation: rotation,
    }
    const result = simulateTimeline(inputs)
    expect(result.fightStartSec).toBeCloseTo(5 / FPS, 6)
  })

  it("a pre-pull hit that lands before the first active step counts, and starts the fight", () => {
    const prePullHit = makeSkill(CLASS, {
      name: "PrePullHit",
      prePull: true,
      castFrames: 20,
      hits: [makeHit({ frame: 10, physMultiplier: 1 })],
    })
    const active = makeSkill(CLASS, {
      name: "Active",
      castFrames: 10,
      hits: [makeHit({ frame: 0, physMultiplier: 1 })],
    })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: prePullHit.id }), makeStep({ skillId: active.id })],
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      customSkills: [prePullHit, active],
      activeCustomRotation: rotation,
    }
    const result = simulateTimeline(inputs)
    // The pre-pull step's cast is bounded by its own castFrames (20), starting
    // at -20; its hit at local frame 10 lands at -10, before the active step's
    // own frame 0.
    expect(result.fightStartSec).toBeCloseTo(-10 / FPS, 6)
    const prePullRow = result.perSkill.find((row) => row.name === "PrePullHit")
    expect(prePullRow?.count).toBe(1)
    expect(prePullRow?.expectedDamage).toBeGreaterThan(0)
  })

  it("finds the same, earlier fight start whichever order the pre-pull and active steps are authored in", () => {
    const prePullHit = makeSkill(CLASS, {
      name: "PrePullHit",
      prePull: true,
      castFrames: 20,
      hits: [makeHit({ frame: 10, physMultiplier: 1 })],
    })
    const active = makeSkill(CLASS, {
      name: "Active",
      castFrames: 10,
      hits: [makeHit({ frame: 0, physMultiplier: 1 })],
    })
    // The pre-pull step is authored second here, after the active step — its
    // own frame stays negative regardless (docs/TIMELINE.md § "Identity and
    // tags"), so discovery must not depend on authoring order.
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: active.id }), makeStep({ skillId: prePullHit.id })],
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      customSkills: [prePullHit, active],
      activeCustomRotation: rotation,
    }
    const result = simulateTimeline(inputs)
    expect(result.fightStartSec).toBeCloseTo(-10 / FPS, 6)
  })

  it("duration without a fixed window is measured from the first damaging hit, not from 0", () => {
    const grant = makeSkill(CLASS, { name: "Grant", castFrames: 10, hits: [makeHit({ frame: 0 })] })
    const damaging = makeSkill(CLASS, {
      name: "Damaging",
      castFrames: 10,
      hits: [makeHit({ frame: 0, physMultiplier: 1 })],
    })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: grant.id }), makeStep({ skillId: damaging.id })],
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      customSkills: [grant, damaging],
      activeCustomRotation: rotation,
    }
    const result = simulateTimeline(inputs)
    expect(result.castDuration).toBeCloseTo(20 / FPS, 6)
    expect(result.rotationDuration).toBeCloseTo(result.castDuration - result.fightStartSec, 6)
    expect(result.rotationDuration).toBeCloseTo(10 / FPS, 6)
  })
})

describe("a fixed window measured from the fight start", () => {
  it("counts a hit landing exactly at fightStart + window and drops one landing a frame later, with the window itself shifted off a leading zero-damage hit", () => {
    const skill = makeSkill(CLASS, {
      name: "FourHits",
      castFrames: 17,
      hits: [
        makeHit({ frame: 0 }),
        makeHit({ frame: 5, physMultiplier: 1 }),
        makeHit({ frame: 15, physMultiplier: 1 }),
        makeHit({ frame: 16, physMultiplier: 1 }),
      ],
    })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: skill.id })],
      fixedWindowSec: 10 / FPS,
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      customSkills: [skill],
      activeCustomRotation: rotation,
    }
    const result = simulateTimeline(inputs)
    expect(result.fightStartSec).toBeCloseTo(5 / FPS, 6)
    const row = result.perSkill.find((entry) => entry.name === "FourHits")
    expect(row?.count).toBe(2)
    const frames = (result.timeline ?? [])
      .filter((event) => event.kind === "hit")
      .map((event) => event.frame)
    expect(frames).toEqual([0, 5, 15])
  })
})

describe("a DoT tick can start the fight, and its own triggers fire regardless", () => {
  function tickingDebuff(
    name: string,
    { damaging, triggersBuffs }: { damaging: boolean; triggersBuffs?: string[] },
  ) {
    return makeDebuff(CLASS, {
      name,
      durationFrames: 40,
      triggersBuffs,
      dot: {
        tickIntervalFrames: 30,
        physMultiplier: damaging ? 1 : 0,
        physFixed: 0,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
      },
    })
  }

  it("a damaging DoT tick, with no damaging hit before it, starts the fight timer", () => {
    const debuff = tickingDebuff("Poison", { damaging: true })
    // The rotation's own natural end — no later step exists to push it out
    // — must still reach past the tick at frame 30, or the tick would land
    // past the (still-undiscovered) window's own end.
    const opener = makeSkill(CLASS, {
      name: "Opener",
      castFrames: 40,
      hits: [
        makeHit({
          frame: 0,
          triggers: [makeTrigger({ kind: "applyDebuff", targetId: debuff.id, stacks: 1 })],
        }),
      ],
    })
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: opener.id })] })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      customSkills: [opener],
      customDebuffs: [debuff],
      activeCustomRotation: rotation,
    }
    const result = simulateTimeline(inputs)
    // The debuff opens at frame 0 (the opener hit deals none itself); its
    // first tick, one interval later, is the run's only damaging event.
    expect(result.fightStartSec).toBeCloseTo(30 / FPS, 6)
    expect(result.totalDamage).toBeGreaterThan(0)
  })

  // Mirage / Mirage Bonus are global class-buff modules (any registered
  // class's engine carries them — see tests/engine/dotTriggersBuffs.test.ts),
  // so they stand in here for a real proc mechanic like Mistwing's own.
  function buildZeroTickFeedScenario(withTriggers: boolean) {
    const grantsMirage = tickingDebuff("GrantsMirage", {
      damaging: false,
      triggersBuffs: withTriggers ? [BUFF.mirage] : undefined,
    })
    const grantsMirageBonus = makeDebuff(CLASS, {
      name: "GrantsMirageBonus",
      durationFrames: 60,
      triggersBuffs: withTriggers ? [BUFF.mirageBonus] : undefined,
      dot: {
        tickIntervalFrames: 40,
        physMultiplier: 0,
        physFixed: 0,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
      },
    })
    const opener = makeSkill(CLASS, {
      name: "Opener",
      castFrames: 60,
      hits: [
        makeHit({
          frame: 0,
          triggers: [
            makeTrigger({ kind: "applyDebuff", targetId: grantsMirage.id, stacks: 1 }),
            makeTrigger({ kind: "applyDebuff", targetId: grantsMirageBonus.id, stacks: 1 }),
          ],
        }),
      ],
    })
    const later = makeSkill(CLASS, {
      name: "Later",
      castFrames: 10,
      hits: [makeHit({ frame: 0, physMultiplier: 1 })],
    })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: opener.id }), makeStep({ skillId: later.id })],
    })
    const inputs: Inputs = {
      ...defaultInputs,
      classId: CLASS,
      customSkills: [opener, later],
      customDebuffs: [grantsMirage, grantsMirageBonus],
      activeCustomRotation: rotation,
    }
    return simulateTimeline(inputs)
  }

  it("a zero-damage tick before the fight starts still fires its own triggersBuffs", () => {
    const without = buildZeroTickFeedScenario(false)
    const withTriggers = buildZeroTickFeedScenario(true)

    // Both ticks (frame 30, frame 40) deal no damage, so `Later`'s own hit at
    // frame 60 is what starts the fight in either run — the ticks land well
    // before it, yet still boost `Later`'s own damage in the triggered run.
    expect(without.fightStartSec).toBeCloseTo(60 / FPS, 6)
    expect(withTriggers.fightStartSec).toBeCloseTo(60 / FPS, 6)
    expect(withTriggers.totalDamage).toBeGreaterThan(without.totalDamage)
  })
})
