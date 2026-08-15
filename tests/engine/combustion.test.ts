// Casting a "Dragon's Breath" ability opens an 8s/16-tick Combustion window
// (`dragonBreath` mechanic — see docs/CALCULATION.md); Poet1-4/Poet Final Hit/another
// Dragon's Breath extend it.
//
// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { simulateTimeline } from "../../src/engine/timeline"
import { defaultInputs, emptyMindMethod } from "../../src/engine/defaults"
import { builtinDebuffsForClass, builtinRotationsForClass } from "../../src/engine/builtinLibrary"
import { makeRotation, makeStep } from "../../src/engine/rotation"
import type { Inputs } from "../../src/engine/types"
import { builtinSkill, dotRow } from "../builtins"
import { DEBUFF } from "../../src/data/skills/bellstrike-umbra/ids"
import { SKILL as UNIVERSAL_SKILL } from "../../src/data/skills/universal/ids"

function rotationOf(classId: string, skillIds: string[]) {
  const steps = skillIds.map((skillId) => {
    const skill = builtinSkill(classId, skillId)
    return makeStep({ skillId: skill.id, hitCount: skill.hits.length })
  })
  return makeRotation(classId, { name: `test-${skillIds.join("+")}`, steps })
}

function combustionDamage(r: ReturnType<typeof simulateTimeline>): number {
  return r.perSkill
    .filter((p) => p.name === dotRow("bellstrikeUmbra", DEBUFF.combustion))
    .reduce((a, p) => a + p.expectedDamage, 0)
}

describe("Dragon's Breath → Combustion DoT", () => {
  it("a rotation casting Dragon's Breath deals real Combustion tick damage", () => {
    const rotation = rotationOf("bellstrikeUmbra", [
      UNIVERSAL_SKILL.fireBreath1Hit,
      UNIVERSAL_SKILL.fireBreath2Hit,
    ])
    const inputs: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
    }
    const result = simulateTimeline(inputs)
    const combustionRow = result.perSkill.find(
      (p) => p.name === dotRow("bellstrikeUmbra", DEBUFF.combustion),
    )
    expect(combustionRow).toBeTruthy()
    expect(combustionRow!.expectedDamage).toBeGreaterThan(0)
    expect(result.warnings.some((w) => /error|exception/i.test(w))).toBe(false)
  })

  it("builtinDebuffsForClass exposes Combustion with the dragonBreath window shape (8s/16 ticks)", () => {
    const debuffs = builtinDebuffsForClass("bellstrikeUmbra")
    const combustion = debuffs.find((d) => d.id === DEBUFF.combustion)
    expect(combustion).toBeTruthy()
    expect(combustion!.durationFrames).toBe(481)
    expect(combustion!.dot!.tickIntervalFrames).toBe(30)
    expect(combustion!.dot!.physMultiplier).toBeCloseTo(0.2953, 10)
    expect(combustion!.dot!.physFixed).toBe(39)
    expect(combustion!.dot!.attributeMultiplier).toBeCloseTo(0.2953, 10)
    expect(combustion!.maxStacks).toBe(1)
    expect(combustion!.stackScaling).toBe("flat")
  })

  it("Dragon's Breath 1 Hit carries a hit-0 apply-or-extend trigger; a Poet skill carries an extend-only trigger", () => {
    const combustionId = builtinDebuffsForClass("bellstrikeUmbra").find(
      (d) => d.id === DEBUFF.combustion,
    )!.id

    const fireBreath = builtinSkill("bellstrikeUmbra", UNIVERSAL_SKILL.fireBreath1Hit)
    expect(fireBreath.id).toBe("bellstrikeUmbra-fire-breath-1-hit")
    const fbTrigger = fireBreath.hits[0].triggers.find((t) => t.targetId === combustionId)
    expect(fbTrigger).toBeTruthy()
    expect(fbTrigger!.kind).toBe("applyDebuff")
    expect(fbTrigger!.extendFrames).toBeGreaterThan(0)
    expect(fbTrigger!.extendOnly).toBeFalsy()

    const poet = builtinSkill("bellstrikeUmbra", UNIVERSAL_SKILL.poet1)
    const poetTrigger = poet.hits[0].triggers.find((t) => t.targetId === combustionId)
    expect(poetTrigger).toBeTruthy()
    expect(poetTrigger!.extendOnly).toBe(true)
    expect(poetTrigger!.extendFrames).toBeGreaterThan(0)
  })

  it("Poet casts extend the Combustion window: Dragon's Breath + Poet1-4 outdamages Dragon's Breath alone", () => {
    const alone = rotationOf("bellstrikeUmbra", [UNIVERSAL_SKILL.fireBreath1Hit])
    const extended = rotationOf("bellstrikeUmbra", [
      UNIVERSAL_SKILL.fireBreath1Hit,
      UNIVERSAL_SKILL.poet1,
      UNIVERSAL_SKILL.poet2,
      UNIVERSAL_SKILL.poet3,
      UNIVERSAL_SKILL.poet4,
    ])
    const before = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: alone,
    })
    const after = simulateTimeline({
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: extended,
    })
    expect(combustionDamage(after)).toBeGreaterThan(combustionDamage(before))
  })

  it("Soul Shaken (Wolfchaser's Art tier 6) scales Combustion tick damage on bellstrikeUmbra's Eazy-T6 Wolf rotation (casts SpearHeavy + Dragon's Breath)", () => {
    const rotation = builtinRotationsForClass("bellstrikeUmbra").find(
      (r) => r.id === "builtin-bellstrikeUmbra-eazy-t6-wolf",
    )!
    const withoutWolf: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
    }
    const withWolf: Inputs = {
      ...defaultInputs,
      classId: "bellstrikeUmbra",
      activeCustomRotation: rotation,
      mindMethods: [
        { name: "Wolfchaser's Art", stacks: "tier 6" },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
        { ...emptyMindMethod },
      ],
    }
    const before = simulateTimeline(withoutWolf)
    const after = simulateTimeline(withWolf)
    expect(combustionDamage(before)).toBeGreaterThan(0)
    expect(combustionDamage(after)).toBeGreaterThan(combustionDamage(before))
  })
})

describe("DoT wiring — the default rotation still resolves with Combustion wired", () => {
  it("dps > 0, no missing-rotation / exception warnings", () => {
    const result = runEngine({ ...defaultInputs, classId: "bellstrikeUmbra" })
    expect(result.dps).toBeGreaterThan(0)
    expect(result.warnings.some((w) => /no default rotation/i.test(w))).toBe(false)
    expect(result.warnings.some((w) => /error|exception/i.test(w))).toBe(false)
  })
})
