// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { builtinSkill, dotRow, testRotation } from "../builtins"
import { SCRIPT_MIN_BREAKTHROUGH } from "../../src/data/skills/buffs/scriptOptions"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import { makeStep } from "../../src/engine/rotation"
import { makeHit, makeSkill, type Skill } from "../../src/engine/skill"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultCombatSettings, type Inputs } from "../../src/engine/types"
import { SKILL as MYSTIC_SKILL, DEBUFF as MYSTIC_DEBUFF } from "../../src/data/skills/mystic/ids"
import { SKILL as UNIVERSAL_SKILL } from "../../src/data/skills/universal/ids"

const CLASS = "bellstrikeUmbra"
const BONUS_PER_STACK = 0.04
const UNLOCKED_BREAKTHROUGH = 18
const STACK_DURATION_FRAMES = 120 * 60

const withScript: Partial<Inputs> = {
  combatSettings: { ...defaultCombatSettings(), script: "purewrathScript" },
}

const withStacks = (stacks: number): Partial<Inputs> => ({
  allMysticBoost: defaultInputs.allMysticBoost + BONUS_PER_STACK * stacks,
})

function run(skills: Skill[], patch: Partial<Inputs>) {
  const rotation = testRotation(CLASS, {
    steps: skills.map((skill) => makeStep({ skillId: skill.id })),
  })
  return simulateTimeline({
    ...defaultInputs,
    classId: CLASS,
    breakthrough: UNLOCKED_BREAKTHROUGH,
    customSkills: skills,
    activeCustomRotation: rotation,
    ...patch,
  })
}

function damagesOf(result: ReturnType<typeof run>, skillName: string): number[] {
  return result
    .timeline!.filter((event) => event.skillName === skillName)
    .sort((left, right) => left.frame - right.frame)
    .map((event) => event.damage)
}

const opener = makeSkill(CLASS, {
  name: "Opener",
  castFrames: 30,
  hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
})

function mysticCast(name: string, vitalityCost: number, castFrames = 30, hitFrames = [0]): Skill {
  return makeSkill(CLASS, {
    name,
    skillType: "mystic",
    vitalityCost,
    castFrames,
    hits: hitFrames.map((frame) => makeHit({ frame, physMultiplier: 1, physFixed: 1 })),
  })
}

function expectStacksPerCast(
  skills: Skill[],
  expectedStacks: number[],
  breakthrough = UNLOCKED_BREAKTHROUGH,
) {
  const scripted = run(skills, { ...withScript, breakthrough })
  expectedStacks.forEach((stacks, index) => {
    const expected = damagesOf(
      run(skills, { ...withStacks(stacks), breakthrough }),
      skills[index].name,
    )
    expect(damagesOf(scripted, skills[index].name), skills[index].name).toEqual(
      expected.map((damage) => expect.closeTo(damage, 6)),
    )
  })
}

describe("purewrathScript — Vitality spent in combat", () => {
  it("ignores a spend made before combat entry, the opener's own included", () => {
    const first = mysticCast("First", 120)
    const second = mysticCast("Second", 0)
    expectStacksPerCast([first, second], [0, 0])
  })

  it("applies a stack gained at a cast's start to that cast's own hits, frame 0 included", () => {
    const spendBig = mysticCast("Spend 100", 100)
    const spendSmall = mysticCast("Spend 20", 20, 30, [0, 10])
    const probe = mysticCast("Probe", 0)
    expectStacksPerCast([opener, spendBig, spendSmall, probe], [0, 0, 1, 1])
  })

  it("fires once per 120 spent, resets the sum on firing and loses the overshoot", () => {
    const skills = [
      opener,
      mysticCast("A", 100),
      mysticCast("B", 100),
      mysticCast("C", 100),
      mysticCast("D", 20),
    ]
    expectStacksPerCast(skills, [0, 0, 1, 1, 2])
  })

  it("counts a pre-pull spend made after a damaging pre-pull hit and ignores one made before it", () => {
    const prePullHit = makeSkill(CLASS, {
      name: "Pre-pull hit",
      prePull: true,
      castFrames: 60,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    const prePullSpend = { ...mysticCast("Pre-pull spend", 120, 60), prePull: true }
    const probe = mysticCast("Probe", 0)
    expectStacksPerCast([prePullHit, prePullSpend, probe], [0, 1, 1])
    expectStacksPerCast([prePullSpend, prePullHit, probe], [0, 0, 0])
  })

  it("gains only one stack from a single spend far above the threshold", () => {
    const skills = [opener, mysticCast("Huge", 500), mysticCast("After", 0)]
    expectStacksPerCast(skills, [0, 1, 1])
  })

  it("caps at three stacks", () => {
    const skills = [
      opener,
      ...[1, 2, 3, 4, 5].map((index) => mysticCast(`Spend ${index}`, 120)),
      mysticCast("After", 0),
    ]
    expectStacksPerCast(skills, [0, 1, 2, 3, 3, 3, 3])
  })

  it("drops all stacks together 120 s after the last gain", () => {
    const first = mysticCast("First", 120, STACK_DURATION_FRAMES - 60)
    const stillLive = mysticCast("Still live", 0, 120)
    const expired = mysticCast("Expired", 0)
    expectStacksPerCast([opener, first, stillLive, expired], [0, 1, 1, 0])
  })

  it("refreshes every stack on a gain", () => {
    const first = mysticCast("First", 120, STACK_DURATION_FRAMES - 60)
    const second = mysticCast("Second", 120, STACK_DURATION_FRAMES - 600)
    const refreshed = mysticCast("Refreshed", 0, 2400)
    const expired = mysticCast("Expired", 0)
    expectStacksPerCast([opener, first, second, refreshed, expired], [0, 1, 2, 2, 0])
  })

  it("does not change a weapon hit", () => {
    const weaponProbe = makeSkill(CLASS, {
      name: "Weapon probe",
      castFrames: 30,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1 })],
    })
    expectStacksPerCast([opener, mysticCast("Spend", 120), weaponProbe], [0, 1, 0])
  })

  it("counts the Vitality of non-mystic casts", () => {
    const ghostlySteps = builtinSkill(CLASS, UNIVERSAL_SKILL.ghostlySteps)
    const goldenBody = builtinSkill(CLASS, UNIVERSAL_SKILL.goldenBodyDeflectCancel)
    const probe = mysticCast("Probe", 0)
    const skills = [opener, goldenBody, goldenBody, ghostlySteps, probe]
    expect(ghostlySteps.vitalityCost! + 2 * goldenBody.vitalityCost!).toBeGreaterThanOrEqual(120)
    const scripted = damagesOf(run(skills, withScript), "Probe")
    const expected = damagesOf(run(skills, withStacks(1)), "Probe")
    expect(scripted[0]).toBeCloseTo(expected[0], 6)
    expect(scripted[0]).toBeGreaterThan(damagesOf(run(skills, {}), "Probe")[0])
  })

  it("lifts the ticks of a mystic damage-over-time effect", () => {
    const fireBreath = builtinSkill(CLASS, MYSTIC_SKILL.fireBreath1Hit)
    const skills = [opener, ...Array.from({ length: 6 }, () => fireBreath)]
    const combustionRow = dotRow(CLASS, MYSTIC_DEBUFF.combustion)
    const ticksOf = (patch: Partial<Inputs>) =>
      run(skills, patch)
        .timeline!.filter((event) => event.skillName === combustionRow)
        .map((event) => event.damage)
    const scripted = ticksOf(withScript)
    const stackless = ticksOf({})
    const withOneStack = ticksOf(withStacks(1))
    expect(scripted).toHaveLength(stackless.length)
    const liftedIndexes = scripted.flatMap((damage, index) =>
      damage > stackless[index] ? [index] : [],
    )
    expect(liftedIndexes.length).toBeGreaterThan(0)
    scripted.forEach((damage, index) => {
      const expected = liftedIndexes.includes(index) ? withOneStack[index] : stackless[index]
      expect(damage).toBeCloseTo(expected, 6)
    })
  })

  it("scores nothing below its breakthrough gate and applies at it", () => {
    const skills = [opener, mysticCast("Spend", 120), mysticCast("Probe", 0)]
    expectStacksPerCast(skills, [0, 1, 1])
    expectStacksPerCast(skills, [0, 0, 0], SCRIPT_MIN_BREAKTHROUGH.purewrathScript - 1)
  })

  describe("on the class default rotations at breakthrough 20", () => {
    const rotationRun = (rotationId: string, patch: Partial<Inputs>) =>
      runEngine({
        ...defaultInputs,
        classId: CLASS,
        selectedBuiltinRotationId: rotationId,
        breakthrough: 20,
        ...patch,
      })

    it("leaves a rotation that stays under the Vitality threshold unchanged", () => {
      const rotationId = "builtin-bellstrikeUmbra-38-bbs"
      const scripted = rotationRun(rotationId, withScript)
      const plain = rotationRun(rotationId, {})
      expect(scripted.totalDamage).toBeCloseTo(plain.totalDamage, 6)
    })

    it("raises only mystic events on a rotation that crosses the threshold", () => {
      const rotationId = "builtin-bellstrikeUmbra-nox-1m-dh"
      const scripted = rotationRun(rotationId, withScript)
      const plain = rotationRun(rotationId, {})
      const scriptedEvents = scripted.timeline!
      const plainEvents = plain.timeline!
      expect(scriptedEvents).toHaveLength(plainEvents.length)
      let raisedMysticEvents = 0
      scriptedEvents.forEach((event, index) => {
        const plainEvent = plainEvents[index]
        expect(event.skillName).toBe(plainEvent.skillName)
        if (!plainEvent.isMysticHit) expect(event.damage).toBeCloseTo(plainEvent.damage, 6)
        else if (event.damage > plainEvent.damage) raisedMysticEvents++
      })
      expect(raisedMysticEvents).toBeGreaterThan(0)
      expect(scripted.totalDamage).toBeGreaterThan(plain.totalDamage)
    })
  })

  it("starts every run from zero", () => {
    const skills = [opener, mysticCast("Spend", 60), mysticCast("Probe", 60)]
    expectStacksPerCast(skills, [0, 0, 1])
    expect(damagesOf(run(skills, withScript), "Probe")).toEqual(
      damagesOf(run(skills, withScript), "Probe"),
    )
  })
})
