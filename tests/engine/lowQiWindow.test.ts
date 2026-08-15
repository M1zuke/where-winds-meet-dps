import { describe, it, expect } from "vitest"
import { BuffEngine, QI_IMBALANCE_STATUS } from "../../src/engine/buffs/buffEngine"
import { buffDefsForClass } from "../../src/engine/buffs/data"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { paramsFromInputs } from "../../src/engine/buffs/params"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultCombatSettings } from "../../src/engine/types"
import type { Inputs } from "../../src/engine/types"

const inputsWithLead = (lowQiLeadSec: number, startSec = 25): Inputs => ({
  ...defaultInputs,
  combatSettings: {
    ...defaultCombatSettings(),
    qiBreak: { enabled: true, startSec, durationSec: 10, lowQiLeadSec },
  },
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
    expect(paramsFromInputs(inputsWithLead(5)).belowQiTime).toBe(20)
    expect(paramsFromInputs(inputsWithLead(0)).belowQiTime).toBeUndefined()
  })

  it("clamps to the start of the fight rather than going negative", () => {
    expect(paramsFromInputs(inputsWithLead(30, 25)).belowQiTime).toBe(0)
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

    const applier = builtinSkillsForClass("bellstrikeSplendor").filter((skill) =>
      skill.triggersBuffs?.includes(QI_IMBALANCE_STATUS),
    )
    expect(applier.length).toBeGreaterThan(0)

    const engine = new BuffEngine({ classId: "bellstrikeSplendor" }, defs)
    engine.triggerDeclaredBuffs([QI_IMBALANCE_STATUS], applier[0]!.castTag ?? "", 1)
    expect(engine.qiPhase(2)).toBe("below30")
  })

  // The spear applies it from the Nameless Spear talent, ungated. The sword
  // only applies it because Mountain's Might Tier 1 widens the rule to any
  // martial art of the path, so it routes through that inner way's def.
  it("is applied directly by the spear and through Mountain's Might by the sword", () => {
    const triggering = (buffId: string) =>
      [
        ...new Set(
          builtinSkillsForClass("bellstrikeSplendor")
            .filter((skill) => skill.triggersBuffs?.includes(buffId))
            .map((skill) => skill.weaponOrAttribute),
        ),
      ].sort()
    expect(triggering(QI_IMBALANCE_STATUS)).toEqual(["Spear"])
    expect(triggering(BUFF.mountainsMightQiImbalance)).toEqual(["Sword"])
  })

  it("the sword's application needs Mountain's Might slotted", () => {
    const defs = buffDefsForClass("bellstrikeSplendor")
    const fire = (params: Record<string, unknown>) => {
      const engine = new BuffEngine({ classId: "bellstrikeSplendor", ...params }, defs)
      engine.triggerDeclaredBuffs([BUFF.mountainsMightQiImbalance], "cast:swordQ", 1)
      return engine.isBuffActiveAtTime(QI_IMBALANCE_STATUS, 2)
    }
    expect(fire({})).toBe(false)
    expect(fire({ mountainsMight: true })).toBe(true)
  })

  it("leaves the timeline band showing only the clock-driven span", () => {
    const engine = new BuffEngine({ qiBreakTime: 25, bossBreakDuration: 10 }, [])
    engine.applyBuff(QI_IMBALANCE_STATUS, 4, 10)
    expect(engine.lowQiWindow()).toBeNull()
  })
})

describe("Qi Imbalance's damage effects", () => {
  const defs = () => buffDefsForClass("bellstrikeSplendor")
  const module = () => defs().find((def) => def.id === BUFF.qiImbalance)!

  it("gives Qi damage whatever the target's state", () => {
    const effects = module().effects
    if (typeof effects !== "function") throw new Error("expected a context-dependent effect list")
    for (const phase of ["normal", "below30", "exhausted"] as const) {
      expect(effects({ phase } as never)).toContainEqual({
        kind: "stat",
        statKey: "attributeDamageBoost",
        amount: 0.1,
      })
    }
  })

  it("adds its damage multiplier only inside the break window", () => {
    const effects = module().effects
    if (typeof effects !== "function") throw new Error("expected a context-dependent effect list")
    const multiplierAt = (phase: string) =>
      effects({ phase } as never).find((effect) => effect.kind === "damageMultiplier")
    expect(multiplierAt("normal")).toBeUndefined()
    expect(multiplierAt("below30")).toBeUndefined()
    expect(multiplierAt("exhausted")).toEqual({ kind: "damageMultiplier", factor: 1.1 })
  })
})

describe("Endless Gale's window", () => {
  const module = () =>
    buffDefsForClass("bellstrikeSplendor").find((def) => def.id === BUFF.endlessGale)!

  const durationWith = (params: Record<string, unknown>) => {
    const duration = module().duration
    if (typeof duration !== "function") throw new Error("expected a context-dependent duration")
    return duration({ build: { param: (id: string) => !!params[id] } } as never)
  }

  // Mountain's Might extends it; on its own the spear talent's window is shorter.
  it("is 8s alone and 10s with Mountain's Might", () => {
    expect(durationWith({})).toBe(8)
    expect(durationWith({ mountainsMight: true })).toBe(10)
  })
})
