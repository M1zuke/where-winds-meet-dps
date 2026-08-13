import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { simulateTimeline, FPS } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"

import { buildContext } from "../../src/engine/panel"
import { computeSkillDamage } from "../../src/engine/formula"
import {
  makeSkill,
  makeHit,
  makeTrigger,
  hitToArtRow,
  seedSkillFromBuiltin,
  hitDealsDamage,
  type Skill,
} from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import { makeBuff, type Buff, type StackScaling } from "../../src/engine/buff"
import { makeDebuff, type Debuff, type DotStackShape } from "../../src/engine/debuff"
import { builtinSkillsForClass, defaultRotationForClass } from "../../src/engine/builtinLibrary"
import type { Inputs } from "../../src/engine/types"

// Scoped to Bellstrike Umbra — the only implemented class (CLAUDE.md
// § "Implemented classes").
const umbraInputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

const CLASS = umbraInputs.classId

function timelineInputs(
  rotation: Rotation,
  skills: Skill[],
  buffs: Buff[],
  debuffs: Debuff[] = [],
): Inputs {
  return {
    ...umbraInputs,
    classId: CLASS,
    customSkills: skills,
    customBuffs: buffs,
    customDebuffs: debuffs,
    activeCustomRotation: rotation,
  }
}

describe("timeline — fixture safety", () => {
  it("no activeCustomRotation ⇒ the class's built-in default rotation runs, and is non-zero", () => {
    const baseline = runEngine(umbraInputs)
    expect(baseline.dps).toBeGreaterThan(0)
    expect(baseline.rotationDuration).toBeGreaterThan(0)
  })

  it("unreferenced customSkills/customBuffs/customDebuffs don't change the default-rotation DPS", () => {
    const baseline = runEngine(umbraInputs)
    const withExtras = runEngine({
      ...umbraInputs,
      customSkills: [makeSkill(CLASS, { name: "unused" })],
      customBuffs: [makeBuff(CLASS, { name: "unused" })],
      customDebuffs: [makeDebuff(CLASS, { name: "unused" })],
    })
    expect(withExtras.dps).toBe(baseline.dps)
    expect(withExtras.rotationDuration).toBe(baseline.rotationDuration)
  })
})

describe("timeline — computed duration", () => {
  it("duration = Σ non-pre-pull cast frames / 60; pre-pull is excluded", () => {
    const a = makeSkill(CLASS, { name: "A", castFrames: 120, hits: [makeHit()] })
    const b = makeSkill(CLASS, { name: "B", castFrames: 60, hits: [makeHit()] })
    const pre = makeSkill(CLASS, { name: "Pre Prepull", castFrames: 90, hits: [makeHit()] })
    const rotation = makeRotation(CLASS, {
      steps: [
        makeStep({ skillId: pre.id, hitCount: 1 }),
        makeStep({ skillId: a.id, hitCount: 1 }),
        makeStep({ skillId: b.id, hitCount: 1 }),
      ],
    })
    const r = simulateTimeline(timelineInputs(rotation, [a, b, pre], []))
    expect(r.rotationDuration).toBeCloseTo((120 + 60) / FPS, 10)
  })

  it("empty rotation ⇒ dps 0 + warning", () => {
    const rotation = makeRotation(CLASS, { steps: [] })
    const r = simulateTimeline(timelineInputs(rotation, [], []))
    expect(r.dps).toBe(0)
    expect(r.warnings.length).toBeGreaterThan(0)
  })
})

describe("timeline — no-buff parity with the formula kernel", () => {
  it("a single buff-less hit deals exactly computeSkillDamage(hitToArtRow(...))", () => {
    const hit = makeHit({ frame: 0, physMultiplier: 2, physFixed: 50 })
    const skill = makeSkill(CLASS, { name: "Solo", castFrames: 60, hits: [hit] })
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id, hitCount: 1 })] })
    // set: null — the default build's Hawkwing 4-piece is a rotation-wide
    // time-averaged proc a bare buildContext() call can't reproduce.
    const inputs = { ...timelineInputs(rotation, [skill], []), set: null }
    const r = simulateTimeline(inputs)

    const ctx = buildContext(inputs)
    const expected = computeSkillDamage(hitToArtRow(hit, skill), ctx, 1).expectedDamage
    expect(r.totalDamage).toBeCloseTo(expected, 6)
  })
})

describe("timeline — hit-count selection", () => {
  it("performing 3 of 5 hits schedules exactly 3 hit events", () => {
    const hits = [0, 10, 20, 30, 40].map((frame) =>
      makeHit({ frame, physMultiplier: 1, physFixed: 10 }),
    )
    const skill = makeSkill(CLASS, { name: "FiveHits", castFrames: 60, hits })
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id, hitCount: 3 })] })
    const r = simulateTimeline(timelineInputs(rotation, [skill], []))
    const row = r.perSkill.find((s) => s.name === "FiveHits")
    expect(row?.count).toBe(3)
  })
})

describe("timeline — invariants", () => {
  it("Σ perSkill == totalDamage and dps == total / seconds", () => {
    const a = makeSkill(CLASS, {
      name: "A",
      castFrames: 90,
      hits: [makeHit({ physMultiplier: 1, physFixed: 100 })],
    })
    const b = makeSkill(CLASS, {
      name: "B",
      castFrames: 60,
      hits: [makeHit({ physMultiplier: 2, physFixed: 50 })],
    })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: a.id, hitCount: 1 }), makeStep({ skillId: b.id, hitCount: 1 })],
    })
    const r = simulateTimeline(timelineInputs(rotation, [a, b], []))
    const sum = r.perSkill.reduce((s, p) => s + p.expectedDamage, 0)
    expect(sum).toBeCloseTo(r.totalDamage, 6)
    expect(r.dps).toBeCloseTo(r.totalDamage / r.rotationDuration, 6)
  })
})

function makeBleed(patch: Partial<Debuff> = {}): Debuff {
  return makeDebuff(CLASS, {
    name: "Bleed",
    activation: "triggered",
    durationFrames: 600,
    effects: [],
    maxStacks: 10,
    stackScaling: "flat",
    // Runtime DoT ticks are demoted (elevatedAttributeMultiplier: false),
    // which zeroes flat damage — use a multiplier-carrying shape instead.
    dot: {
      tickIntervalFrames: 100,
      physMultiplier: 1,
      physFixed: 0,
      attributeMultiplier: 0,
      attributeFixed: 0,
      attributeAttack: "",
      skillType: "sustain",
      count: 1,
    },
    ...patch,
  })
}

function makeSwordQQ(bleedId: string): Skill {
  const hits = [0, 10, 20, 30, 40].map((frame) =>
    makeHit({
      frame,
      triggers: [makeTrigger({ kind: "applyDebuff", targetId: bleedId, stacks: 1 })],
    }),
  )
  return makeSkill(CLASS, { name: "Sword QQ", castFrames: 300, hits })
}

function runBleedScenario(scaling: StackScaling, maxStacks: number): number {
  const bleed = makeBleed({ stackScaling: scaling, maxStacks })
  const sword = makeSwordQQ(bleed.id)
  const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: sword.id, hitCount: 5 })] })
  return simulateTimeline(timelineInputs(rotation, [sword], [], [bleed])).totalDamage
}

describe("timeline — stack application + per-stack DoT scaling", () => {
  it("5 applyDebuff hits drive the debuff to 5 stacks; a perStack DoT deals 5× a flat (1-stack) tick", () => {
    const flatTotal = runBleedScenario("flat", 10)
    const perStackTotal = runBleedScenario("perStack", 10)
    expect(flatTotal).toBeGreaterThan(0)
    expect(perStackTotal).toBeCloseTo(flatTotal * 5, 6)
  })

  it("stacks clamp at maxStacks", () => {
    const flatTotal = runBleedScenario("flat", 10)
    const clampedTotal = runBleedScenario("perStack", 3)
    expect(clampedTotal).toBeCloseTo(flatTotal * 3, 6)
  })
})

function buildBloodBurstScenario(sworHitCount: number) {
  const bleed = makeBleed({ stackScaling: "flat", maxStacks: 10, dot: null })
  const bloodBurst = makeSkill(CLASS, {
    name: "Blood Burst",
    castFrames: 60,
    hits: [makeHit({ physFixed: 5000, physMultiplier: 1 })],
  })
  const special = makeSkill(CLASS, {
    name: "Sword Special",
    castFrames: 60,
    hits: [
      makeHit({
        frame: 0,
        triggers: [
          makeTrigger({
            kind: "castSkill",
            targetId: bloodBurst.id,
            condition: { buffId: bleed.id, op: "gte", stacks: 5 },
          }),
        ],
      }),
    ],
  })
  const sword = makeSwordQQ(bleed.id)
  const rotation = makeRotation(CLASS, {
    steps: [
      makeStep({ skillId: sword.id, hitCount: sworHitCount }),
      makeStep({ skillId: special.id, hitCount: 1 }),
    ],
  })
  return simulateTimeline(timelineInputs(rotation, [sword, special, bloodBurst], [], [bleed]))
}

describe("timeline — conditional cast-skill trigger", () => {
  it("fires Blood Burst once Bleed reaches the gating threshold", () => {
    const r = buildBloodBurstScenario(5)
    const row = r.perSkill.find((s) => s.name === "Blood Burst")
    expect(row).toBeTruthy()
    expect(row!.expectedDamage).toBeGreaterThan(0)
  })

  it("does not fire when the gating threshold isn't reached", () => {
    const r = buildBloodBurstScenario(3)
    expect(r.perSkill.find((s) => s.name === "Blood Burst")).toBeUndefined()
  })
})

describe("timeline — runaway trigger-chain guard", () => {
  it("caps a self-referential cast-skill trigger chain and warns instead of hanging", () => {
    let loop = makeSkill(CLASS, { name: "Loop", castFrames: 60, hits: [makeHit({ frame: 0 })] })
    loop = {
      ...loop,
      hits: [
        { ...loop.hits[0], triggers: [makeTrigger({ kind: "castSkill", targetId: loop.id })] },
      ],
    }
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: loop.id, hitCount: 1 })] })
    const r = simulateTimeline(timelineInputs(rotation, [loop], []))
    expect(r.warnings.some((w) => w.toLowerCase().includes("event"))).toBe(true)
  }, 10_000)
})

describe("timeline — triggerable is an authoring filter only", () => {
  it("a castSkill trigger still fires even when the target skill is triggerable: false", () => {
    const bloodBurst = makeSkill(CLASS, {
      name: "Blood Burst NT",
      castFrames: 60,
      triggerable: false,
      hits: [makeHit({ physFixed: 5000, physMultiplier: 1 })],
    })
    const special = makeSkill(CLASS, {
      name: "Special NT",
      castFrames: 60,
      hits: [
        makeHit({
          frame: 0,
          triggers: [makeTrigger({ kind: "castSkill", targetId: bloodBurst.id })],
        }),
      ],
    })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: special.id, hitCount: 1 })],
    })
    const r = simulateTimeline(timelineInputs(rotation, [special, bloodBurst], []))
    const row = r.perSkill.find((s) => s.name === "Blood Burst NT")
    expect(row).toBeTruthy()
    expect(row!.expectedDamage).toBeGreaterThan(0)
  })
})

function makeBleedTable(maxStacks: number, tableLength: number): Debuff {
  // Runtime DoT ticks are demoted (elevatedAttributeMultiplier: false), which
  // zeroes flat damage — scale by physMultiplier to keep rows distinct.
  const perStackShapes: DotStackShape[] = Array.from({ length: tableLength }, (_, i) => ({
    physMultiplier: 0.1 * (i + 1),
    physFixed: 0,
    attributeMultiplier: 0,
    attributeFixed: 0,
  }))
  return makeDebuff(CLASS, {
    name: "BleedTable",
    activation: "triggered",
    durationFrames: 600,
    effects: [],
    maxStacks,
    stackScaling: "flat",
    dot: {
      tickIntervalFrames: 100,
      physMultiplier: 0,
      physFixed: 0,
      attributeMultiplier: 0,
      attributeFixed: 0,
      attributeAttack: "",
      skillType: "sustain",
      count: 1,
      perStackShapes,
    },
  })
}

function makeSwordQQN(bleedId: string, n: number): Skill {
  const hits = Array.from({ length: n }, (_, i) =>
    makeHit({
      frame: i * 10,
      triggers: [makeTrigger({ kind: "applyDebuff", targetId: bleedId, stacks: 1 })],
    }),
  )
  const lastFrame = (n - 1) * 10
  return makeSkill(CLASS, { name: `SwordQQ${n}`, castFrames: lastFrame + 150, hits })
}

function expectedRowDamage(inputs: Inputs, row: DotStackShape, buffName: string): number {
  const ctx = buildContext(inputs)
  const art = {
    name: buffName,
    physMultiplier: row.physMultiplier,
    physFixed: row.physFixed,
    attributeMultiplier: row.attributeMultiplier,
    attributeFixed: row.attributeFixed,
    attributeAttack: undefined,
    skillType: "sustain",
    specialTag: "sustain",
    elevatedAttributeMultiplier: false,
  } as Parameters<typeof computeSkillDamage>[0]
  return computeSkillDamage(art, ctx, 1).expectedDamage
}

describe("timeline — per-stack DoT damage table", () => {
  it("a tick at N live stacks uses perStackShapes[N-1], not baseShape × N", () => {
    const bleed = makeBleedTable(5, 5)
    const sword = makeSwordQQN(bleed.id, 3)
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: sword.id, hitCount: 3 })] })
    const inputs = { ...timelineInputs(rotation, [sword], [], [bleed]), set: null }
    const r = simulateTimeline(inputs)
    const dotRow = r.perSkill.find((s) => s.name.includes("BleedTable"))
    expect(dotRow?.count).toBe(1)
    const expected = expectedRowDamage(inputs, bleed.dot!.perStackShapes![2], bleed.name)
    expect(dotRow!.expectedDamage).toBeGreaterThan(0)
    expect(dotRow!.expectedDamage).toBeCloseTo(expected, 6)
  })

  it("clamps to the table's last row when live stacks exceed the table length", () => {
    const bleed = makeBleedTable(10, 5)
    const sword = makeSwordQQN(bleed.id, 8)
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: sword.id, hitCount: 8 })] })
    const inputs = { ...timelineInputs(rotation, [sword], [], [bleed]), set: null }
    const r = simulateTimeline(inputs)
    const dotRow = r.perSkill.find((s) => s.name.includes("BleedTable"))
    const expected = expectedRowDamage(inputs, bleed.dot!.perStackShapes![4], bleed.name)
    expect(dotRow!.count).toBeGreaterThan(0)
    expect(dotRow!.expectedDamage).toBeCloseTo(expected * dotRow!.count, 6)
  })

  it("uses the first row at 1 stack", () => {
    const bleed = makeBleedTable(5, 5)
    const sword = makeSwordQQN(bleed.id, 1)
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: sword.id, hitCount: 1 })] })
    const inputs = { ...timelineInputs(rotation, [sword], [], [bleed]), set: null }
    const r = simulateTimeline(inputs)
    const dotRow = r.perSkill.find((s) => s.name.includes("BleedTable"))
    const expected = expectedRowDamage(inputs, bleed.dot!.perStackShapes![0], bleed.name)
    expect(dotRow!.expectedDamage).toBeCloseTo(expected, 6)
  })

  it("regression: an explicit perStackShapes: null is a no-op (flat ⇒ ×1, perStack ⇒ ×liveStacks)", () => {
    const flatTotal = runBleedScenario("flat", 10)
    const bleedExplicitNull = makeBleed({
      stackScaling: "flat",
      maxStacks: 10,
      dot: {
        tickIntervalFrames: 100,
        physMultiplier: 1,
        physFixed: 0,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
        perStackShapes: null,
      },
    })
    const sword = makeSwordQQ(bleedExplicitNull.id)
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: sword.id, hitCount: 5 })] })
    const total = simulateTimeline(
      timelineInputs(rotation, [sword], [], [bleedExplicitNull]),
    ).totalDamage
    expect(total).toBeCloseTo(flatTotal, 6)
  })
})

describe("timeline — applyDot / detonateDot (logic-free DoT trigger kinds)", () => {
  function makeDetonatingBleed(patch: Partial<Debuff> = {}): Debuff {
    return makeDebuff(CLASS, {
      name: "Bleed",
      activation: "triggered",
      durationFrames: 600,
      maxStacks: 5,
      stackScaling: "flat",
      dot: null,
      ...patch,
    })
  }

  function makeBurst(): Skill {
    return makeSkill(CLASS, {
      name: "Bleed Burst",
      castFrames: 10,
      hits: [makeHit({ physFixed: 1000, physMultiplier: 1 })],
    })
  }

  function makeApplyOnly(bleedId: string, hitCount: number): Skill {
    const hits = Array.from({ length: hitCount }, (_, i) =>
      makeHit({
        frame: i * 10,
        triggers: [
          makeTrigger({ kind: "applyDot", targetId: bleedId, stacks: 1, condition: null }),
        ],
      }),
    )
    return makeSkill(CLASS, { name: "Apply Only", castFrames: hitCount * 10 + 50, hits })
  }

  function makeApplyAndDetonate(bleedId: string, hitCount: number): Skill {
    const hits = Array.from({ length: hitCount }, (_, i) =>
      makeHit({
        frame: i * 10,
        triggers: [
          makeTrigger({ kind: "applyDot", targetId: bleedId, stacks: 1, condition: null }),
          makeTrigger({ kind: "detonateDot", targetId: bleedId, stacks: 0, condition: null }),
        ],
      }),
    )
    return makeSkill(CLASS, { name: "Apply And Detonate", castFrames: hitCount * 10 + 50, hits })
  }

  it("detonates the moment a flagged application brings the count to max (4→5); 3 applications (never reaching max) don't", () => {
    const burst = makeBurst()
    const bleed = makeDetonatingBleed({ detonation: { skillId: burst.id } })
    const detonator5 = makeApplyAndDetonate(bleed.id, 5)
    const rotation5 = makeRotation(CLASS, {
      steps: [makeStep({ skillId: detonator5.id, hitCount: 5 })],
    })
    const r5 = simulateTimeline(timelineInputs(rotation5, [detonator5, burst], [], [bleed]))
    const burstRow5 = r5.perSkill.find((s) => s.name === "Bleed Burst")
    expect(burstRow5).toBeTruthy()
    expect(burstRow5!.count).toBe(1)

    const detonator3 = makeApplyAndDetonate(bleed.id, 3)
    const rotation3 = makeRotation(CLASS, {
      steps: [makeStep({ skillId: detonator3.id, hitCount: 3 })],
    })
    const r3 = simulateTimeline(timelineInputs(rotation3, [detonator3, burst], [], [bleed]))
    expect(r3.perSkill.find((s) => s.name === "Bleed Burst")).toBeUndefined()
  })

  it("a flagged application AT cap (already 5, clamped) also detonates", () => {
    const burst = makeBurst()
    const bleed = makeDetonatingBleed({ detonation: { skillId: burst.id } })
    const applyOnly = makeApplyOnly(bleed.id, 5)
    const detonator = makeApplyAndDetonate(bleed.id, 1)
    const rotation = makeRotation(CLASS, {
      steps: [
        makeStep({ skillId: applyOnly.id, hitCount: 5 }),
        makeStep({ skillId: detonator.id, hitCount: 1 }),
      ],
    })
    const r = simulateTimeline(timelineInputs(rotation, [applyOnly, detonator, burst], [], [bleed]))
    const burstRow = r.perSkill.find((s) => s.name === "Bleed Burst")
    expect(burstRow).toBeTruthy()
    expect(burstRow!.count).toBe(1)
  })

  it("a NON-flagged applyDot at cap only refreshes — no detonation, stacks stay at max", () => {
    const burst = makeBurst()
    const bleed = makeDetonatingBleed({ detonation: { skillId: burst.id } })
    const applyOnly = makeApplyOnly(bleed.id, 6)
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: applyOnly.id, hitCount: 6 })],
    })
    const r = simulateTimeline(timelineInputs(rotation, [applyOnly], [], [bleed]))
    expect(r.perSkill.find((s) => s.name === "Bleed Burst")).toBeUndefined()
  })

  it("retains retainParamStacks at tier 6, resets to retainStacks (default 0) below tier 6", () => {
    const burst = makeBurst()
    const bleed = makeDetonatingBleed({
      detonation: {
        skillId: burst.id,
        retainStacks: 0,
        retainParam: "swordHorizon",
        retainMinTier: 6,
        retainParamStacks: 2,
      },
    })
    const detonator = makeApplyAndDetonate(bleed.id, 3)
    const rotation = makeRotation(CLASS, {
      steps: [
        makeStep({ skillId: detonator.id, hitCount: 3 }),
        makeStep({ skillId: detonator.id, hitCount: 3 }),
        makeStep({ skillId: detonator.id, hitCount: 3 }),
      ],
    })
    const base = timelineInputs(rotation, [detonator, burst], [], [bleed])
    const below6: Inputs = {
      ...base,
      mindMethods: [
        { name: "Sword Horizon", stacks: "tier 5" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ],
    }
    const at6: Inputs = {
      ...base,
      mindMethods: [
        { name: "Sword Horizon", stacks: "tier 6" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ],
    }
    const belowResult = simulateTimeline(below6)
    const atResult = simulateTimeline(at6)
    expect(belowResult.perSkill.find((s) => s.name === "Bleed Burst")!.count).toBe(1)
    expect(atResult.perSkill.find((s) => s.name === "Bleed Burst")!.count).toBe(2)
  })
})

describe("timeline — combined buff + debuff rotation", () => {
  it("a player buff (applyBuff) and a target debuff (applyDebuff, with DoT) both apply and sum correctly", () => {
    const warcry = makeBuff(CLASS, {
      name: "Warcry",
      scope: "player",
      activation: "triggered",
      durationFrames: 600,
      effects: [{ statKey: "critDamageBoost", amount: 0.5 }],
    })
    const vuln = makeDebuff(CLASS, {
      name: "Vuln",
      activation: "triggered",
      durationFrames: 600,
      effects: [{ statKey: "target.generalDamageTaken", amount: 0.2 }],
      dot: {
        tickIntervalFrames: 60,
        physMultiplier: 1,
        physFixed: 0,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
      },
    })
    const setup = makeSkill(CLASS, {
      name: "Setup",
      castFrames: 30,
      hits: [
        makeHit({
          frame: 0,
          triggers: [
            makeTrigger({ kind: "applyBuff", targetId: warcry.id, stacks: 1 }),
            makeTrigger({ kind: "applyDebuff", targetId: vuln.id, stacks: 1 }),
          ],
        }),
      ],
    })
    const attack = makeSkill(CLASS, {
      name: "Attack",
      castFrames: 300,
      hits: [makeHit({ frame: 0, physMultiplier: 1, physFixed: 1000 })],
    })
    const rotation = makeRotation(CLASS, {
      steps: [
        makeStep({ skillId: setup.id, hitCount: 1 }),
        makeStep({ skillId: attack.id, hitCount: 1 }),
      ],
    })
    const withBoth = simulateTimeline(timelineInputs(rotation, [setup, attack], [warcry], [vuln]))
    const withNeither = simulateTimeline(timelineInputs(rotation, [setup, attack], [], []))

    expect(withBoth.totalDamage).toBeGreaterThan(withNeither.totalDamage)
    const sum = withBoth.perSkill.reduce((s, p) => s + p.expectedDamage, 0)
    expect(sum).toBeCloseTo(withBoth.totalDamage, 6)
    expect(withBoth.perSkill.find((s) => s.name === "Attack")?.expectedDamage).toBeGreaterThan(0)
    expect(withBoth.perSkill.find((s) => s.name.includes("Vuln"))?.expectedDamage).toBeGreaterThan(
      0,
    )
  })
})

describe("timeline — an edited copy of a built-in skill overrides the built-in by id", () => {
  it("seedSkillFromBuiltin keeps the built-in's id, so an edited copy changes the same rotation's damage", () => {
    const classId = "bellstrikeUmbra"
    const rotation = defaultRotationForClass(classId)!
    const builtins = builtinSkillsForClass(classId)
    const stepSkillIds = new Set(rotation.steps.map((s) => s.skillId))
    const target = builtins.find((s) => stepSkillIds.has(s.id) && s.hits.some(hitDealsDamage))
    expect(target).toBeTruthy()

    const edited = seedSkillFromBuiltin(classId, target!)
    expect(edited.id).toBe(target!.id)
    const hitIndex = edited.hits.findIndex(hitDealsDamage)
    edited.hits[hitIndex] = {
      ...edited.hits[hitIndex],
      physMultiplier: edited.hits[hitIndex].physMultiplier + 10,
    }

    const withoutEdit: Inputs = { ...umbraInputs, classId, activeCustomRotation: rotation }
    const withEdit: Inputs = { ...withoutEdit, customSkills: [edited] }

    const before = simulateTimeline(withoutEdit)
    const after = simulateTimeline(withEdit)

    expect(after.totalDamage).not.toBe(before.totalDamage)
    expect(after.warnings.some((w) => /missing skill/.test(w))).toBe(false)
  })
})

describe("timeline — a hit landing on the rotation's closing frame", () => {
  function lastFrameHitSkill(castFrames: number): Skill {
    return makeSkill(CLASS, {
      name: "ClosingFrameHit",
      castFrames,
      hits: [makeHit({ frame: castFrames, physMultiplier: 1 })],
    })
  }

  it("counts toward damage and produces a perSkill row when it is the final cast", () => {
    const skill = lastFrameHitSkill(40)
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id, hitCount: 1 })] })
    const r = simulateTimeline(timelineInputs(rotation, [skill], []))

    const ev = r.timeline!.find((e) => e.kind === "hit" && e.skillName === "ClosingFrameHit")
    expect(ev).toBeTruthy()
    expect(ev!.frame).toBe(40)
    expect(ev!.inWindow).toBe(true)

    const row = r.perSkill.find((p) => p.name === "ClosingFrameHit")
    expect(row).toBeTruthy()
    expect(row!.expectedDamage).toBeGreaterThan(0)
    expect(r.totalDamage).toBeCloseTo(row!.expectedDamage, 6)
  })

  it("is worth the same whether it is the last cast or has another cast after it", () => {
    const skill = lastFrameHitSkill(40)
    const filler = makeSkill(CLASS, {
      name: "After",
      castFrames: 60,
      hits: [makeHit({ frame: 0 })],
    })
    const alone = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, { steps: [makeStep({ skillId: skill.id, hitCount: 1 })] }),
        [skill],
        [],
      ),
    )
    const followed = simulateTimeline(
      timelineInputs(
        makeRotation(CLASS, {
          steps: [
            makeStep({ skillId: skill.id, hitCount: 1 }),
            makeStep({ skillId: filler.id, hitCount: 1 }),
          ],
        }),
        [skill, filler],
        [],
      ),
    )
    const damageOf = (r: ReturnType<typeof simulateTimeline>) =>
      r.perSkill.find((p) => p.name === "ClosingFrameHit")!.expectedDamage
    expect(damageOf(alone)).toBeCloseTo(damageOf(followed), 6)
  })
})

describe("timeline — cast chips sample once the cast has fully resolved", () => {
  it("includes a hit that lands on the cast's closing frame", () => {
    const buff = makeBuff(CLASS, { name: "Marker", durationFrames: 600, maxStacks: 1 })
    const skill = makeSkill(CLASS, {
      name: "ClosingApply",
      castFrames: 100,
      hits: [
        makeHit({
          frame: 100,
          physMultiplier: 1,
          triggers: [makeTrigger({ kind: "applyBuff", targetId: buff.id, stacks: 1 })],
        }),
      ],
    })
    const after = makeSkill(CLASS, {
      name: "After",
      castFrames: 60,
      hits: [makeHit({ frame: 0 })],
    })
    const rotation = makeRotation(CLASS, {
      steps: [
        makeStep({ skillId: skill.id, hitCount: 1 }),
        makeStep({ skillId: after.id, hitCount: 1 }),
      ],
    })
    const r = simulateTimeline(timelineInputs(rotation, [skill, after], [buff]))

    const first = r.casts!.find((c) => c.skillName === "ClosingApply")!
    const second = r.casts!.find((c) => c.skillName === "After")!
    const markerOn = (c: typeof first) => c.buffs.find((b) => b.name === "Marker")

    expect(markerOn(first)).toBeTruthy()
    expect(markerOn(second)).toBeTruthy()
    expect(markerOn(first)!.remainingSec!).toBeGreaterThan(markerOn(second)!.remainingSec!)
  })

  it("leaves out what the next cast applies on that same closing frame", () => {
    const buff = makeBuff(CLASS, { name: "Marker", durationFrames: 600, maxStacks: 5 })
    const opener = makeSkill(CLASS, {
      name: "Opener",
      castFrames: 30,
      hits: [
        makeHit({
          frame: 0,
          triggers: [makeTrigger({ kind: "applyBuff", targetId: buff.id, stacks: 1 })],
        }),
      ],
    })
    const silent = makeSkill(CLASS, {
      name: "Silent",
      castFrames: 100,
      hits: [makeHit({ frame: 100, physMultiplier: 1 })],
    })
    const rotation = makeRotation(CLASS, {
      steps: [
        makeStep({ skillId: opener.id, hitCount: 1 }),
        makeStep({ skillId: silent.id, hitCount: 1 }),
        makeStep({ skillId: opener.id, hitCount: 1 }),
      ],
    })
    const r = simulateTimeline(timelineInputs(rotation, [opener, silent], [buff]))

    const silentCast = r.casts!.find((c) => c.skillName === "Silent")!
    const lastCast = r.casts![r.casts!.length - 1]
    expect(silentCast.buffs.find((b) => b.name === "Marker")!.stacks).toBe(1)
    expect(lastCast.buffs.find((b) => b.name === "Marker")!.stacks).toBe(2)
  })
})
