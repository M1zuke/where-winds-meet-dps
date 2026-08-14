import { describe, expect, it } from "vitest"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs } from "../../src/engine/defaults"
import { buildContext } from "../../src/engine/panel"
import { computeSkillDamage } from "../../src/engine/formula"
import { makeSkill, makeHit, makeTrigger, hitToArtRow, type Skill } from "../../src/engine/skill"
import { makeRotation, makeStep, type Rotation } from "../../src/engine/rotation"
import { makeDebuff, type Debuff } from "../../src/engine/debuff"
import { BUFF } from "../../src/data/skills/buffs/ids"
import type { Inputs } from "../../src/engine/types"

// Scoped to Bellstrike Umbra — see CLASSES.md § "Implemented classes". `mirage`
// / `mirageBonus` are global defs, so any registered class's engine carries them.
const CLASS = "bellstrikeUmbra"
const umbraInputs = { ...defaultInputs, classId: CLASS }

function timelineInputs(rotation: Rotation, skills: Skill[], debuffs: Debuff[]): Inputs {
  return {
    ...umbraInputs,
    customSkills: skills,
    customDebuffs: debuffs,
    activeCustomRotation: rotation,
  }
}

function dotDebuff(name: string, tickIntervalFrames: number, triggersBuffs?: string[]): Debuff {
  return makeDebuff(CLASS, {
    name,
    activation: "triggered",
    durationFrames: 1300,
    maxStacks: 1,
    stackScaling: "flat",
    dot: {
      tickIntervalFrames,
      physMultiplier: 1,
      physFixed: 0,
      attributeMultiplier: 0,
      attributeFixed: 0,
      attributeAttack: "",
      skillType: "sustain",
      count: 1,
    },
    triggersBuffs,
  })
}

// Debuff B's own window is opened first (its applying hit fires at frame 0,
// Debuff A's at frame 10) — so B is visited before A in the ledger's own
// iteration order — but B's dot ticks far more slowly than A's, so A's first
// tick (mirage) lands well before B's first tick (mirageBonus, gated on
// mirage's window) in real time.
function buildScenario(withTriggers: boolean) {
  const debuffA = dotDebuff("Debuff A", 60, withTriggers ? [BUFF.mirage] : undefined)
  const debuffB = dotDebuff("Debuff B", 600, withTriggers ? [BUFF.mirageBonus] : undefined)

  const skillApplyB = makeSkill(CLASS, {
    name: "Apply B",
    castFrames: 10,
    hits: [
      makeHit({
        frame: 0,
        triggers: [makeTrigger({ kind: "applyDebuff", targetId: debuffB.id, stacks: 1 })],
      }),
    ],
  })
  const skillApplyA = makeSkill(CLASS, {
    name: "Apply A",
    castFrames: 1500,
    hits: [
      makeHit({
        frame: 0,
        triggers: [makeTrigger({ kind: "applyDebuff", targetId: debuffA.id, stacks: 1 })],
      }),
    ],
  })

  const rotation = makeRotation(CLASS, {
    steps: [
      makeStep({ skillId: skillApplyB.id, hitCount: 1 }),
      makeStep({ skillId: skillApplyA.id, hitCount: 1 }),
    ],
  })

  return simulateTimeline(timelineInputs(rotation, [skillApplyB, skillApplyA], [debuffA, debuffB]))
}

describe("Debuff.triggersBuffs — DoT ticks trigger declared buffs", () => {
  it("a tick's declared buff reaches a later tick from a different debuff, ordered by real time rather than by which ledger entry was created first", () => {
    const without = buildScenario(false)
    const withTriggers = buildScenario(true)
    expect(withTriggers.totalDamage).toBeGreaterThan(without.totalDamage)
  })

  it("a tick-triggered buff reaches a later tick of its own debuff, but never a regular hit queued after it or that hit's cast's displayed buffs", () => {
    const debuffA = dotDebuff("Debuff A", 60, [BUFF.vulnerabilityTeammate])
    const skillApplyA = makeSkill(CLASS, {
      name: "Apply A",
      castFrames: 200,
      hits: [
        makeHit({
          frame: 0,
          triggers: [makeTrigger({ kind: "applyDebuff", targetId: debuffA.id, stacks: 1 })],
        }),
      ],
    })
    const probeHit = makeHit({ frame: 0, physMultiplier: 2, physFixed: 100 })
    const skillProbe = makeSkill(CLASS, { name: "Probe", castFrames: 60, hits: [probeHit] })
    const rotation = makeRotation(CLASS, {
      steps: [
        makeStep({ skillId: skillApplyA.id, hitCount: 1 }),
        makeStep({ skillId: skillProbe.id, hitCount: 1 }),
      ],
    })
    const skills = [skillApplyA, skillProbe]
    const inputs = { ...timelineInputs(rotation, skills, [debuffA]), set: null }
    const r = simulateTimeline(inputs)
    const untriggered = simulateTimeline({
      ...timelineInputs(rotation, skills, [{ ...debuffA, triggersBuffs: undefined }]),
      set: null,
    })

    const tickAt = (result: typeof r, frame: number) =>
      (result.timeline ?? []).find((event) => event.kind === "dot" && event.frame === frame)!.damage
    expect(tickAt(r, 120)).toBeGreaterThan(tickAt(untriggered, 120))

    const buffLessProbeDamage = computeSkillDamage(
      hitToArtRow(probeHit, skillProbe),
      buildContext(inputs),
      1,
    ).expectedDamage
    expect(r.perSkill.find((s) => s.name === "Probe")!.expectedDamage).toBeCloseTo(
      buffLessProbeDamage,
      6,
    )

    const probeCast = (r.casts ?? []).find((c) => c.skillName === "Probe")!
    expect(probeCast.buffs.some((b) => b.id === BUFF.vulnerabilityTeammate)).toBe(false)
  })
})
