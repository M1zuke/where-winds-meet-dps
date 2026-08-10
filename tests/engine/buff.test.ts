import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { buildContext } from "../../src/engine/panel"
import { computeSkillDamage } from "../../src/engine/formula"
import { makeBuff as makeBuffStore, type Buff } from "../../src/engine/buff"
import {
  saveCustomBuff,
  deleteCustomBuff,
  loadCustomBuffsForClass,
  exportCustomBuff,
  importCustomBuff,
  importCustomRotation,
} from "../../src/storage"
import {
  STAT_DEFS,
  STAT_DEF_BY_KEY,
  applyBuffEffects,
  type StatKey,
} from "../../src/engine/statRegistry"
import type { Inputs } from "../../src/engine/types"

const ATTACK_BLOCKS = ["phys", "bellstrike", "stonesplit", "silkbind", "bamboocut"] as const

describe("stat registry — every StatKey resolves to a real path", () => {
  it("player scalar/dotted keys exist on Inputs; target keys are prefixed", () => {
    for (const def of STAT_DEFS) {
      if (def.scope === "target") {
        expect(def.key.startsWith("target.")).toBe(true)
        continue
      }
      const dot = def.key.indexOf(".")
      if (dot > 0) {
        const block = def.key.slice(0, dot)
        const sub = def.key.slice(dot + 1)
        expect(ATTACK_BLOCKS).toContain(block)
        const blockVal = (defaultInputs as unknown as Record<string, Record<string, number>>)[block]
        expect(typeof blockVal[sub]).toBe("number")
      } else {
        expect(typeof (defaultInputs as unknown as Record<string, unknown>)[def.key]).toBe("number")
      }
    }
  })

  it("no duplicate keys", () => {
    const keys = STAT_DEFS.map((d) => d.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe("applyBuffEffects — additive, copy-on-write", () => {
  it("scalar effect adds to the field and does not mutate the original", () => {
    const before = defaultInputs.critDamageBoost
    const { inputs } = applyBuffEffects(defaultInputs, [
      { statKey: "critDamageBoost", amount: 0.2 },
    ])
    expect(inputs.critDamageBoost).toBeCloseTo(before + 0.2, 10)
    expect(defaultInputs.critDamageBoost).toBe(before)
    expect(inputs).not.toBe(defaultInputs)
  })

  it("dotted attack-block effect clones only the touched block", () => {
    const { inputs } = applyBuffEffects(defaultInputs, [{ statKey: "phys.min", amount: 100 }])
    expect(inputs.phys.min).toBeCloseTo(defaultInputs.phys.min + 100, 10)
    expect(inputs.phys).not.toBe(defaultInputs.phys)
    expect(defaultInputs.phys.min).not.toBe(inputs.phys.min)
    expect(inputs.bellstrike).toBe(defaultInputs.bellstrike)
  })

  it("multiple effects on the same block accumulate on one clone", () => {
    const { inputs } = applyBuffEffects(defaultInputs, [
      { statKey: "phys.min", amount: 50 },
      { statKey: "phys.max", amount: 80 },
    ])
    expect(inputs.phys.min).toBeCloseTo(defaultInputs.phys.min + 50, 10)
    expect(inputs.phys.max).toBeCloseTo(defaultInputs.phys.max + 80, 10)
  })

  it("target-scope effects accumulate into targetOverride, not inputs", () => {
    const { inputs, targetOverride } = applyBuffEffects(defaultInputs, [
      { statKey: "target.defense", amount: -50 },
      { statKey: "target.generalDamageTaken", amount: 0.1 },
      { statKey: "target.generalDamageTaken", amount: 0.05 },
    ])
    expect(targetOverride.defenseDelta).toBe(-50)
    expect(targetOverride.generalDamageTakenDelta).toBeCloseTo(0.15, 10)
    expect(inputs).toBe(defaultInputs)
  })

  it("empty / zero / unknown effects are no-ops", () => {
    expect(applyBuffEffects(defaultInputs, []).inputs).toBe(defaultInputs)
    const { inputs } = applyBuffEffects(defaultInputs, [
      { statKey: "critRate", amount: 0 },
      { statKey: "not_a_real_stat", amount: 5 },
    ])
    expect(inputs.critRate).toBe(defaultInputs.critRate)
  })
})

describe("buildContext targetOverride — fixture safety", () => {
  it("undefined / {} override is byte-identical to no override", () => {
    const base = buildContext(defaultInputs)
    expect(buildContext(defaultInputs, undefined)).toEqual(base)
    expect(buildContext(defaultInputs, {})).toEqual(base)
  })

  it("defenseDelta lowers effectiveDefense by the same amount (no henZhi)", () => {
    const inputs: Inputs = { ...defaultInputs, shareDebuff5HenZhi: false }
    const base = buildContext(inputs)
    const lowered = buildContext(inputs, { defenseDelta: -100 })
    expect(lowered.effectiveDefense).toBeCloseTo(base.effectiveDefense - 100, 6)
  })

  it("generalDamageTakenDelta flows into generalDamageBoost", () => {
    const base = buildContext(defaultInputs)
    const buffed = buildContext(defaultInputs, { generalDamageTakenDelta: 0.1 })
    if (!defaultInputs.dummyMode) {
      expect(buffed.generalDamageBoost).toBeCloseTo(base.generalDamageBoost + 0.1, 6)
    }
  })
})

describe("cap convention — critRate clamps at 0.8, directCritRate bypasses", () => {
  const art = { name: "t", physMultiplier: 1, skillType: "weapon" } as Parameters<
    typeof computeSkillDamage
  >[0]

  it("critRate buff is clamped; directCritRate is not", () => {
    const cap = applyBuffEffects(defaultInputs, [{ statKey: "critRate", amount: 2.0 }])
    const dir = applyBuffEffects(defaultInputs, [{ statKey: "directCritRate", amount: 2.0 }])
    const vCap = computeSkillDamage(art, buildContext(cap.inputs, cap.targetOverride), 1).cells.V
    const vDir = computeSkillDamage(art, buildContext(dir.inputs, dir.targetOverride), 1).cells.V
    expect(vCap).toBeLessThanOrEqual(0.8 + defaultInputs.directCritRate + 1e-9)
    expect(vDir).toBeGreaterThan(vCap + 1.5)
  })
})

describe("persistence — customBuffs CRUD (player/team-only, no DoT)", () => {
  it("save / load / delete a buff", () => {
    const b = makeBuffStore("bellstrikeUmbra", {
      name: "rt",
      effects: [{ statKey: "critDamageBoost", amount: 0.3 }],
    })
    saveCustomBuff(b)
    expect(loadCustomBuffsForClass("bellstrikeUmbra").some((x) => x.id === b.id)).toBe(true)
    deleteCustomBuff(b.id)
    expect(loadCustomBuffsForClass("bellstrikeUmbra").some((x) => x.id === b.id)).toBe(false)
  })

  it("export → import preserves effects + stacking fields and reassigns id/class", () => {
    const b = makeBuffStore("bellstrikeUmbra", {
      name: "Warcry",
      scope: "team",
      durationFrames: 300,
      effects: [{ statKey: "critDamageBoost", amount: 0.1 }],
      maxStacks: 5,
      stackScaling: "perStack",
    })
    const imported = importCustomBuff(exportCustomBuff(b), "bellstrikeUmbra")
    expect(imported.id).not.toBe(b.id)
    expect(imported.classId).toBe("bellstrikeUmbra")
    expect(imported.effects).toEqual(b.effects)
    expect(imported.scope).toBe("team")
    expect(imported.maxStacks).toBe(5)
    expect(imported.stackScaling).toBe("perStack")
  })

  it("a buff missing stackScaling (pre-stacking blob) hydrates to 'flat' with maxStacks >= 1", () => {
    const b = makeBuffStore("bellstrikeUmbra", { name: "legacy" })
    const legacy = { ...b, maxStacks: 0 } as Buff
    delete (legacy as unknown as Record<string, unknown>).stackScaling
    saveCustomBuff(legacy)
    const loaded = loadCustomBuffsForClass("bellstrikeUmbra").find((x) => x.name === "legacy")
    expect(loaded?.stackScaling).toBe("flat")
    expect(loaded?.maxStacks).toBeGreaterThanOrEqual(1)
  })

  it("importCustomBuff coerces a target-scope import into player and drops target.* effects", () => {
    const raw = JSON.stringify({
      name: "WasADebuff",
      scope: "target",
      effects: [
        { statKey: "target.generalDamageTaken", amount: 0.1 },
        { statKey: "critDamageBoost", amount: 0.2 },
      ],
      dot: {
        tickIntervalFrames: 60,
        physMultiplier: 1,
        physFixed: 100,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
      },
    })
    const imported = importCustomBuff(raw, "bellstrikeUmbra")
    expect(imported.scope).toBe("player")
    expect(imported.effects).toEqual([{ statKey: "critDamageBoost", amount: 0.2 }])
    expect((imported as unknown as Record<string, unknown>).dot).toBeUndefined()
  })

  it("importCustomRotation preserves steps + permanentBuffIds + prePullHitsCount", () => {
    const json = JSON.stringify({
      name: "t",
      classId: "bellstrikeUmbra",
      permanentBuffIds: ["p1"],
      prePullHitsCount: true,
      steps: [{ id: "old-step-id", skillId: "sk-1", hitCount: 3, prePull: true }],
    })
    const r = importCustomRotation(json)
    expect(r.permanentBuffIds).toEqual(["p1"])
    expect(r.prePullHitsCount).toBe(true)
    expect(r.steps[0].skillId).toBe("sk-1")
    expect(r.steps[0].hitCount).toBe(3)
    expect(r.steps[0].prePull).toBe(true)
    expect(r.steps[0].id).not.toBe("old-step-id")
  })
})

describe("per-stack effect scaling — applyBuffEffects × live stack count", () => {
  it("multiplying an effect's amount by the stack count reproduces the simulator's perStack path", () => {
    const perHit = 0.1
    const stacks = 4
    const scaled = applyBuffEffects(defaultInputs, [
      { statKey: "critDamageBoost", amount: perHit * stacks },
    ])
    const unscaled = applyBuffEffects(defaultInputs, [
      { statKey: "critDamageBoost", amount: perHit },
    ])
    expect(scaled.inputs.critDamageBoost - defaultInputs.critDamageBoost).toBeCloseTo(
      (unscaled.inputs.critDamageBoost - defaultInputs.critDamageBoost) * stacks,
      10,
    )
  })
})

// Compile-time guard: STAT_DEF_BY_KEY is keyed by StatKey.
const _typecheck: StatKey = "critDamageBoost"
void STAT_DEF_BY_KEY[_typecheck]
