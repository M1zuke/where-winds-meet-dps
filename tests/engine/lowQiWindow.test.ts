import { describe, it, expect } from "vitest"
import { BuffEngine, QI_IMBALANCE_STATUS } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { hitDealsDamage } from "../../src/engine/skill"
import { BUFF, PARAM } from "../../src/data/skills/buffs/ids"
import { SKILL } from "../../src/data/skills/bellstrike-splendor/ids"
import { ENDLESS_GALE_GATE } from "../../src/data/classes/bellstrike-splendor/gates"
import { endlessGaleMountainsMightExtend } from "../../src/data/skills/bellstrike-splendor/buffs/endlessGaleCostReductionGrant"
import { paramsFromInputs } from "../../src/engine/buffs/params"
import { defaultInputs } from "../../src/engine/defaults"
import type { QiBreakWindow } from "../../src/engine/types"

const rotationQiBreak = (lowQiLeadSec: number, startSec = 25): QiBreakWindow => ({
  startSec,
  durationSec: 10,
  lowQiLeadSec,
})

describe("the low-Qi lead window", () => {
  it("precedes the break window and ends where it begins", () => {
    const engine = new BuffEngine({ qiBreakTime: 25, belowQiTime: 20, bossBreakDuration: 10 }, [])
    expect(engine.qiPhase(19.9)).toBe("normal")
    expect(engine.qiPhase(20)).toBe("below30")
    expect(engine.qiPhase(24.9)).toBe("below30")
    expect(engine.qiPhase(25)).toBe("exhausted")
    expect(engine.qiPhase(34.9)).toBe("exhausted")
    expect(engine.qiPhase(35)).toBe("normal")
  })

  it("is absent when no lead is configured", () => {
    const engine = new BuffEngine({ qiBreakTime: 25, bossBreakDuration: 10 }, [])
    expect(engine.qiPhase(24.9)).toBe("normal")
    expect(engine.lowQiWindow()).toBeNull()
  })

  it("is derived from the lead setting", () => {
    expect(paramsFromInputs(defaultInputs, rotationQiBreak(5)).belowQiTime).toBe(20)
    expect(paramsFromInputs(defaultInputs, rotationQiBreak(0)).belowQiTime).toBeUndefined()
  })

  it("clamps to the start of the fight rather than going negative", () => {
    expect(paramsFromInputs(defaultInputs, rotationQiBreak(30, 25)).belowQiTime).toBe(0)
  })

  it("reports its own span for the rotation timeline", () => {
    const engine = new BuffEngine({ qiBreakTime: 25, belowQiTime: 20, bossBreakDuration: 10 }, [])
    expect(engine.lowQiWindow()).toEqual({ start: 20, end: 25 })
  })
})

describe("Qi Imbalance as a low-Qi source", () => {
  it("counts as low Qi outside the lead window", () => {
    const engine = new BuffEngine({ qiBreakTime: 25, bossBreakDuration: 10 }, [])
    expect(engine.qiPhase(5)).toBe("normal")
    engine.applyBuff(QI_IMBALANCE_STATUS, 4, 10)
    expect(engine.qiPhase(5)).toBe("below30")
  })

  it("stops counting once its window expires", () => {
    const engine = new BuffEngine({ qiBreakTime: 25, bossBreakDuration: 10 }, [])
    engine.applyBuff(QI_IMBALANCE_STATUS, 4, 10)
    expect(engine.qiPhase(13.9)).toBe("below30")
    expect(engine.qiPhase(14)).toBe("normal")
  })

  it("never downgrades a broken target back to low Qi", () => {
    const engine = new BuffEngine({ qiBreakTime: 25, bossBreakDuration: 10 }, [])
    engine.applyBuff(QI_IMBALANCE_STATUS, 24, 15)
    expect(engine.qiPhase(26)).toBe("exhausted")
  })

  // `ids.ts` takes no imports, so the data-side id is a second literal. Nothing
  // else would notice the two drifting apart — the buff would simply stop
  // moving the phase.
  it("is named the same on both sides of the data/engine boundary", () => {
    expect(BUFF.qiImbalance).toBe(QI_IMBALANCE_STATUS)
  })

  it("reaches the phase from a class that applies it", () => {
    const defs = buffDefsForClass("bellstrikeSplendor")
    expect(defs.map((def) => def.id)).toContain(QI_IMBALANCE_STATUS)

    const spearQ = builtinSkillsForClass("bellstrikeSplendor").find(
      (skill) => skill.id === SKILL.spearq,
    )!
    const engine = new BuffEngine({ classId: "bellstrikeSplendor" }, defs)
    engine.processDamageHit(1, spearQ)
    expect(engine.qiPhase(2)).toBe("below30")
  })

  // The spear applies it from the Nameless Spear talent, ungated. The sword
  // only applies it because Mountain's Might Tier 1 widens the rule to any
  // martial art of the path, so it routes through that inner way's def.
  it("is applied directly by the spear and through Mountain's Might by the sword", () => {
    const applying = (buffId: string) =>
      [
        ...new Set(
          builtinSkillsForClass("bellstrikeSplendor")
            .filter((skill) => skill.receives?.includes(buffId))
            .map((skill) => skill.weaponOrAttribute),
        ),
      ].sort()
    expect(applying(BUFF.qiankunsLockQiImbalance)).toEqual(["Spear"])
    expect(applying(BUFF.mountainsMightQiImbalance)).toEqual(["Sword"])
  })

  it("lands on a hit and on no cast that lands none", () => {
    const hitless = builtinSkillsForClass("bellstrikeSplendor").filter(
      (skill) =>
        skill.receives?.includes(BUFF.qiankunsLockQiImbalance) &&
        !skill.hits.some((candidate) => hitDealsDamage(candidate)),
    )
    expect(hitless).toEqual([])
    for (const skillId of [SKILL.spearqPrepull, SKILL.spearq0HitCancel]) {
      const skill = builtinSkillsForClass("bellstrikeSplendor").find(
        (candidate) => candidate.id === skillId,
      )!
      expect(skill.receives).not.toContain(BUFF.qiankunsLockQiImbalance)
      expect(skill.triggersBuffs).not.toContain(QI_IMBALANCE_STATUS)
    }
  })

  it("the sword's application needs Mountain's Might slotted", () => {
    const defs = buffDefsForClass("bellstrikeSplendor")
    const swordQ = builtinSkillsForClass("bellstrikeSplendor").find(
      (skill) => skill.id === SKILL.swordq,
    )!
    const hitLandsAt = (params: Record<string, unknown>) => {
      const engine = new BuffEngine({ classId: "bellstrikeSplendor", ...params }, defs)
      engine.processDamageHit(1, swordQ)
      return engine.isBuffActiveAtTime(QI_IMBALANCE_STATUS, 2)
    }
    expect(hitLandsAt({})).toBe(false)
    expect(hitLandsAt({ mountainsMight: true })).toBe(true)
  })

  it("starts with the hit and not before it", () => {
    const engine = new BuffEngine(
      { classId: "bellstrikeSplendor", mountainsMight: true },
      buffDefsForClass("bellstrikeSplendor"),
    )
    const swordQ = builtinSkillsForClass("bellstrikeSplendor").find(
      (skill) => skill.id === SKILL.swordq,
    )!
    engine.processSkillCast("cast:swordQ", 0, {}, false, swordQ.triggersBuffs, undefined)
    expect(engine.isBuffActiveAtTime(QI_IMBALANCE_STATUS, 1)).toBe(false)
    engine.processDamageHit(22 / 60, swordQ)
    expect(engine.isBuffActiveAtTime(QI_IMBALANCE_STATUS, 21 / 60)).toBe(false)
    expect(engine.isBuffActiveAtTime(QI_IMBALANCE_STATUS, 22 / 60 + 14.9)).toBe(true)
    expect(engine.isBuffActiveAtTime(QI_IMBALANCE_STATUS, 22 / 60 + 15.1)).toBe(false)
  })

  it("leaves the timeline band showing only the clock-driven span", () => {
    const engine = new BuffEngine({ qiBreakTime: 25, bossBreakDuration: 10 }, [])
    engine.applyBuff(QI_IMBALANCE_STATUS, 4, 10)
    expect(engine.lowQiWindow()).toBeNull()
  })
})

describe("Qi Imbalance's damage effects", () => {
  const module = () =>
    buffDefsForClass("bellstrikeSplendor").find((def) => def.id === BUFF.qiImbalance)!

  const effectsAt = (phase: string) => {
    const effects = module().effects
    if (typeof effects !== "function") throw new Error("expected a context-dependent effect list")
    return effects({ phase } as never)
  }

  it("carries its own +10% Qi damage taken in every phase", () => {
    expect(effectsAt("normal")).toEqual([
      { kind: "stat", statKey: "target.qiDamageTaken", amount: 0.1 },
    ])
    expect(effectsAt("below30")).toEqual([
      { kind: "stat", statKey: "target.qiDamageTaken", amount: 0.1 },
    ])
  })

  it("raises HP damage and Bellstrike damage together, only inside the break window", () => {
    expect(effectsAt("exhausted")).toEqual([
      { kind: "stat", statKey: "target.qiDamageTaken", amount: 0.1 },
      { kind: "damageMultiplier", factor: 1.1 },
      { kind: "stat", statKey: "attributeDamageBoost", amount: 0.1 },
    ])
  })
})

describe("Endless Gale's window", () => {
  // Mountain's Might extends it; on its own the spear talent's window is shorter.
  it("is 5s alone and 10s with Mountain's Might", () => {
    expect(ENDLESS_GALE_GATE.durationFrames).toBe(300)
    expect(endlessGaleMountainsMightExtend.extendFrames).toBe(300)
    expect(endlessGaleMountainsMightExtend.requiresParam).toBe(PARAM.mountainsMight)
  })
})
