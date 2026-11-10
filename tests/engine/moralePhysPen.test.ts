import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { buildContext } from "../../src/engine/panel"
import { computeSkillDamage } from "../../src/engine/formula"
import { makeSkill, makeHit } from "../../src/engine/skill"
import { makeStep } from "../../src/engine/rotation"
import { testRotation as makeRotation } from "../builtins"
import { defaultInputs } from "../../src/engine/defaults"

import { MoraleStacks, moraleDmgPerStack } from "../../src/engine/buffs/morale"
import { defaultCombatSettings, type Inputs } from "../../src/engine/types"

// Scoped to Bellstrike Umbra — the only implemented class (CLAUDE.md
// § "Implemented classes").
const umbraInputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

const FPS = 60
const MORALE_PEN_PER_STACK = 0.02

const T_ONE_STACK = 0
const T_FIVE_STACKS = 8
const T_QI_BREAK = 27
const HIT_SECONDS = [T_ONE_STACK, 2, 4, 6, T_FIVE_STACKS, T_QI_BREAK]
const SAMPLES = [
  { tSec: T_ONE_STACK, stacks: 1 },
  { tSec: T_FIVE_STACKS, stacks: 5 },
  { tSec: T_QI_BREAK, stacks: 1 },
]

function baseInputs(classId: string, mindMethods: Inputs["mindMethods"]): Inputs {
  return {
    ...umbraInputs,
    classId,
    // Unset so the hand-reconstructed expectation below, which calls
    // `buildContext` directly and so never sees a buff-engine effect, is not
    // quietly missing Divinecraft: Fire's allDamageBoost contribution.
    divinecraft: null,
    allMartialBoost: 0,
    phys: { min: 977.23, max: 0, penetration: 0.2 },
    bellstrike: { min: 0, max: 0, penetration: 0 },
    classSpecificAttunement: {},
    mindMethods,
  }
}

function art(name: string) {
  return { name, physMultiplier: 1, physFixed: 0, skillType: "weapon" }
}

describe("Morale Chant phys-penetration term", () => {
  it("scales with the stack count and matches a hand-reconstructed +stacks*0.02 phys.penetration bump", () => {
    const hits = HIT_SECONDS.map((tSec) =>
      makeHit({ frame: Math.round(tSec * FPS), physMultiplier: 1, physFixed: 0 }),
    )
    const skill = makeSkill("bellstrikeUmbra", {
      name: "Test Weapon Hit",
      skillType: "weapon",
      castFrames: Math.round(T_QI_BREAK * FPS) + 1,
      hits,
    })
    const rotation = makeRotation("bellstrikeUmbra", {
      steps: [makeStep({ skillId: skill.id })],
    })
    const inputs: Inputs = {
      ...baseInputs("bellstrikeUmbra", [
        { name: "Morale Chant", stacks: "tier 6" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ]),
      customSkills: [skill],
      activeCustomRotation: rotation,
      combatSettings: { ...defaultCombatSettings() },
    }

    const result = simulateTimeline(inputs)
    const events = result
      .timeline!.filter((e) => e.skillName === "Test Weapon Hit")
      .sort((a, b) => a.frame - b.frame)
    expect(events).toHaveLength(HIT_SECONDS.length)
    const breaks = result.qiBreaks ?? []

    for (const { tSec, stacks } of SAMPLES) {
      const event = events[HIT_SECONDS.indexOf(tSec)]!
      // The engine's own exhausted-phase independentDamageBoost is unrelated
      // to Morale Chant and fires regardless of it — read off the run's own
      // simulated breaks rather than assumed from a forced window.
      const inQiBreak = breaks.some((qiBreak) => tSec >= qiBreak.startSec && tSec < qiBreak.endSec)
      const expected = computeSkillDamage(
        art("Test Weapon Hit") as never,
        buildContext({
          ...inputs,
          phys: {
            ...inputs.phys,
            penetration: inputs.phys.penetration + stacks * MORALE_PEN_PER_STACK,
          },
          allDamageBoost: (inputs.allDamageBoost ?? 0) + stacks * moraleDmgPerStack(false),
          independentDamageBoost: inQiBreak ? 0.1 : 0,
        }),
        1,
      ).expectedDamage
      expect(event.damage).toBeCloseTo(expected, 6)
    }

    expect(events[HIT_SECONDS.indexOf(T_QI_BREAK)]!.damage).toBeLessThan(
      events[HIT_SECONDS.indexOf(T_FIVE_STACKS)]!.damage,
    )
  })

  it("does not double stacks or per-stack damage during the Qi break — the target is never controlled", () => {
    const stacks = new MoraleStacks()
    for (let hitSec = 0; hitSec <= 40; hitSec += 1) stacks.gainFromDirectHit(hitSec)
    expect(stacks.stacksAt(40)).toBe(5)
    expect(moraleDmgPerStack(false)).toBe(0.01)
  })

  it("lands on phys.penetration only — bellstrike.penetration is untouched", () => {
    const hit = makeHit({
      frame: Math.round(T_FIVE_STACKS * FPS),
      physMultiplier: 0,
      attributeMultiplier: 1,
      physFixed: 0,
    })
    const skill = makeSkill("bellstrikeUmbra", {
      name: "Test Attribute Hit",
      skillType: "sustain",
      attributeAttack: "Bellstrike",
      castFrames: Math.round(T_FIVE_STACKS * FPS) + 1,
      hits: [hit],
    })
    const rotation = makeRotation("bellstrikeUmbra", {
      steps: [makeStep({ skillId: skill.id })],
    })
    const inputs: Inputs = {
      ...baseInputs("bellstrikeUmbra", [
        { name: "Morale Chant", stacks: "tier 6" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ]),
      bellstrike: { min: 500, max: 500, penetration: 0.1 },
      customSkills: [skill],
      activeCustomRotation: rotation,
    }

    const result = simulateTimeline(inputs)
    const row = result.perSkill.find((p) => p.name === "Test Attribute Hit")!

    const withoutMoralePen = computeSkillDamage(
      {
        name: "Test Attribute Hit",
        attributeMultiplier: 1,
        physFixed: 0,
        skillType: "sustain",
        attributeAttack: "Bellstrike",
        specialTag: "sustain",
      } as never,
      buildContext({ ...inputs, allDamageBoost: (inputs.allDamageBoost ?? 0) + 1 * 0.01 }),
      1,
    ).expectedDamage
    expect(row.expectedDamage).toBeCloseTo(withoutMoralePen, 6)
  })

  it("is 0 without Morale Chant selected", () => {
    const hit = makeHit({
      frame: Math.round(T_FIVE_STACKS * FPS),
      physMultiplier: 1,
      physFixed: 0,
    })
    const skill = makeSkill("bellstrikeUmbra", {
      name: "Test Weapon Hit",
      skillType: "weapon",
      castFrames: Math.round(T_FIVE_STACKS * FPS) + 1,
      hits: [hit],
    })
    const rotation = makeRotation("bellstrikeUmbra", {
      steps: [makeStep({ skillId: skill.id })],
    })
    const inputs: Inputs = {
      ...baseInputs("bellstrikeUmbra", [
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ]),
      customSkills: [skill],
      activeCustomRotation: rotation,
    }

    const result = simulateTimeline(inputs)
    const row = result.perSkill.find((p) => p.name === "Test Weapon Hit")!
    const withoutBonus = computeSkillDamage(
      art("Test Weapon Hit") as never,
      buildContext(inputs),
      1,
    ).expectedDamage
    expect(row.expectedDamage).toBeCloseTo(withoutBonus, 6)
  })
})
