// The acceptance proof for docs/CLASSES.md § "One definition per class":
// everything a class needs is reachable from OUTSIDE the engine.
//
// Registered here rather than shipped as a probe class, because a real class
// would need verified coefficients and this proves the wiring, not the data.
// Every id below is fictional, so nothing a real class does can see it.
import { describe, expect, it } from "vitest"
import { DEFAULT_BEHAVIOR, buildBehaviors, registerSkillBehavior } from "../../src/engine/behavior"
import { registerBuiltinBuffs, builtinBuffsForClass } from "../../src/engine/builtinBuffs"
import { registerDisplayGate, displayGateFor } from "../../src/engine/buffs/displayGates"
import { prepareMechanics, registerMechanic } from "../../src/engine/mechanics"
import type { MechanicSetup, TimelineMechanic } from "../../src/engine/mechanics/types"
import { makeSkill } from "../../src/engine/skill"
import { defaultInputs } from "../../src/engine/defaults"
import type { Buff } from "../../src/engine/buff"
import type { Inputs } from "../../src/engine/types"

const PROBE_CLASS = "probeClassNotShipped"
const PROBE_SKILL = "probeClassNotShipped-probe-skill"

const gates: Buff[] = [
  {
    id: "buff-probeClassNotShipped-gate",
    classId: PROBE_CLASS,
    name: "Probe Gate",
    scope: "player",
    activation: "triggered",
    durationFrames: 300,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
  },
]

const probeMechanic: TimelineMechanic<{ on: true }> = {
  id: "probeMechanic",
  prepare: (setup) => (setup.classId === PROBE_CLASS ? { on: true } : null),
  contributeAt: () => ({ effects: [{ statKey: "allDamageBoost", amount: 0.5 }] }),
}

registerBuiltinBuffs(PROBE_CLASS, gates)
registerMechanic(probeMechanic)
registerSkillBehavior(PROBE_SKILL, (build) =>
  build.classId === PROBE_CLASS ? { ...DEFAULT_BEHAVIOR } : null,
)
registerDisplayGate("probeDef", (inputs: Inputs) => inputs.classId === PROBE_CLASS)

function setupFor(classId: string): MechanicSetup {
  return {
    inputs: { ...defaultInputs, classId },
    classId,
    fps: 60,
    rotationDurationSec: 10,
    hitTimesSec: [0, 1, 2],
    weaponHitTimesSec: [0, 1],
    qiPhaseAt: () => "normal",
    paramOn: () => false,
    paramTier: () => 0,
    hasBuffEngine: true,
    effectiveRates: { precision: 1, critRate: 0.5, affinityRate: 0.2 },
  }
}

const buildFor = (classId: string) => ({
  classId,
  set: null,
  innerWayTier: () => null,
  classSpecificAttunement: () => 0,
  grantsMinPhysCritBoost: () => false,
})

describe("a class can be wired from outside the engine", () => {
  it("registers gate buffs", () => {
    expect(builtinBuffsForClass(PROBE_CLASS).map((b) => b.name)).toEqual(["Probe Gate"])
  })

  it("registers a mechanic the timeline will prepare, and only for its own class", () => {
    const ids = prepareMechanics(setupFor(PROBE_CLASS)).map((p) => p.mechanic.id)
    expect(ids).toContain("probeMechanic")
    expect(prepareMechanics(setupFor("bellstrikeUmbra")).map((p) => p.mechanic.id)).not.toContain(
      "probeMechanic",
    )
  })

  it("registers a per-skill behaviour, and only for its own class", () => {
    const skill = makeSkill(PROBE_CLASS, { id: PROBE_SKILL, name: "Probe" })
    expect(buildBehaviors(buildFor(PROBE_CLASS))(skill)).not.toBe(DEFAULT_BEHAVIOR)
    expect(buildBehaviors(buildFor("bellstrikeUmbra"))(skill)).toBe(DEFAULT_BEHAVIOR)
  })

  it("registers a Skill Editor display gate", () => {
    const gate = displayGateFor("probeDef")!
    expect(gate({ ...defaultInputs, classId: PROBE_CLASS })).toBe(true)
    expect(gate({ ...defaultInputs, classId: "bellstrikeUmbra" })).toBe(false)
  })

  it("leaves the shipped classes untouched", () => {
    expect(builtinBuffsForClass("bellstrikeUmbra").length).toBeGreaterThan(0)
    expect(builtinBuffsForClass("notAClass")).toEqual([])
  })
})
