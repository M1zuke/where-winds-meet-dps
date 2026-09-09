import { describe, expect, it } from "vitest"
import { builtinSkillsForClass, builtinDebuffsForClass } from "../../src/engine/builtinLibrary"
import {
  RIVER_FLOW_DURATION_FRAMES,
  SPEAR_SPECIAL_COOLDOWN_BUFF_ID,
  SPEAR_SPECIAL_COOLDOWN_FRAMES,
} from "../../src/data/innerWays/wolfchasersArtGates"
import { BUFF } from "../../src/data/skills/buffs/ids"
import {
  ZENITH_DETONATION_BUFF_ID,
  ZENITH_DETONATION_FRAMES,
  ZENITH_BAR_BUFF_ID,
} from "../../src/data/innerWays/swordHorizonZenith"
import { builtinBuffsForClass } from "../../src/engine/builtinLibrary"
import * as bellstrikeUmbra from "../../src/data/skills/bellstrike-umbra"
import { UNIVERSAL_SKILLS } from "../../src/data/skills/universal"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"

const CLASS = "bellstrikeUmbra"

describe("built-in skill data — Spear Special / Spear Special (1 Hit Cancel)", () => {
  const skills = builtinSkillsForClass(CLASS)
  const spearSpecial = skills.filter((s) => s.id === SKILL.spearspecial)
  const cancel = skills.filter((s) => s.id === SKILL.spearspecial1HitCancel)

  it("exactly one of each skill exists", () => {
    expect(spearSpecial).toHaveLength(1)
    expect(cancel).toHaveLength(1)
  })

  it("base + River Flow variant coefficients split 0.40 / 0.60 across Spear Special's two hits; the cancel shares hit 1", () => {
    const [first, second] = spearSpecial[0].hits
    const total = (
      field: "physMultiplier" | "attributeMultiplier" | "physFixed" | "attributeFixed",
    ) => first[field] + second[field]

    expect(total("physMultiplier")).toBeCloseTo(1.712176, 10)
    expect(total("attributeMultiplier")).toBeCloseTo(2.568264, 10)
    expect(total("physFixed")).toBeCloseTo(474.4, 10)
    expect(total("attributeFixed")).toBeCloseTo(258.4, 10)
    expect(first.physMultiplier / total("physMultiplier")).toBeCloseTo(0.4, 6)
    expect(second.physMultiplier / total("physMultiplier")).toBeCloseTo(0.6, 6)

    const totalVariant = (
      field: "physMultiplier" | "attributeMultiplier" | "physFixed" | "attributeFixed",
    ) => first.variants![0][field] + second.variants![0][field]
    expect(totalVariant("physMultiplier")).toBeCloseTo(2.568264, 10)
    expect(totalVariant("attributeMultiplier")).toBeCloseTo(3.852396, 10)
    expect(totalVariant("physFixed")).toBeCloseTo(711.6, 10)
    expect(totalVariant("attributeFixed")).toBeCloseTo(387.6, 10)

    expect(cancel[0].hits).toEqual([first])
  })

  it("hit-0's six triggers: 3×applyDot(bleed), 1×castSkill(Blood Burst), 1×applyDebuff(Defense Down), 1×applyBuff(cooldown) LAST — never detonateDot — all gated by both River Flow ≥ 1 and cooldown = 0", () => {
    const bleedId = "debuff-bellstrikeUmbra-bleed-tick"
    const detonationId = "bellstrikeUmbra-bleed-detonation"
    const defenseDownId = "debuff-bellstrikeUmbra-defense-down"
    for (const s of [spearSpecial[0], cancel[0]]) {
      const triggers = s.hits[0].triggers
      expect(triggers).toHaveLength(6)
      expect(triggers.some((t) => t.kind === "detonateDot")).toBe(false)
      const applyDots = triggers.filter((t) => t.kind === "applyDot")
      expect(applyDots).toHaveLength(3)
      for (const t of applyDots) expect(t.targetId).toBe(bleedId)
      const casts = triggers.filter((t) => t.kind === "castSkill")
      expect(casts).toHaveLength(1)
      expect(casts[0].targetId).toBe(detonationId)
      const applyDebuffs = triggers.filter((t) => t.kind === "applyDebuff")
      expect(applyDebuffs).toHaveLength(1)
      expect(applyDebuffs[0].targetId).toBe(defenseDownId)
      const applyBuffs = triggers.filter((t) => t.kind === "applyBuff")
      expect(applyBuffs).toHaveLength(1)
      expect(applyBuffs[0].targetId).toBe(SPEAR_SPECIAL_COOLDOWN_BUFF_ID)
      expect(triggers[triggers.length - 1]).toBe(applyBuffs[0])
      for (const t of triggers) {
        expect(t.condition).toEqual({ buffId: BUFF.potentRiverFlow, op: "gte", stacks: 1 })
        expect(t.conditions).toEqual([
          { buffId: SPEAR_SPECIAL_COOLDOWN_BUFF_ID, op: "eq", stacks: 0 },
        ])
      }
    }
  })
})

describe("built-in data — referential integrity", () => {
  it("every trigger targetId and variant condition buffId resolves to a real built-in skill/debuff/buff", () => {
    const skills = builtinSkillsForClass(CLASS)
    const debuffs = builtinDebuffsForClass(CLASS)
    const buffs = builtinBuffsForClass(CLASS)
    const skillIds = new Set(skills.map((s) => s.id))
    const statusIds = new Set([...debuffs.map((d) => d.id), ...buffs.map((b) => b.id)])

    for (const s of skills) {
      for (const hit of s.hits) {
        for (const tr of hit.triggers) {
          if (tr.kind === "castSkill") {
            expect(skillIds.has(tr.targetId)).toBe(true)
          } else {
            expect(statusIds.has(tr.targetId)).toBe(true)
          }
        }
        for (const v of hit.variants ?? []) {
          for (const c of v.conditions) {
            expect(statusIds.has(c.buffId)).toBe(true)
          }
        }
      }
    }
  })
})

describe("built-in data — SpearQ's River Flow trigger", () => {
  it("lives on hit index 4 only, for both SpearQ and SpearQ 5-Hit Cancel", () => {
    const skills = builtinSkillsForClass(CLASS)
    for (const name of ["SpearQ", "SpearQ 5-Hit Cancel"]) {
      const skill = skills.find((s) => s.name === name)!
      expect(skill).toBeTruthy()
      skill.hits.forEach((hit, i) => {
        const hasRiverFlow = hit.triggers.some(
          (t) => t.kind === "applyBuff" && t.targetId === BUFF.potentRiverFlow,
        )
        expect(hasRiverFlow).toBe(i === 4)
      })
    }
  })
})

describe("built-in data — one file per skill", () => {
  it("builtinSkillsForClass has no duplicate ids and each skill comes from exactly one source file", () => {
    const merged = builtinSkillsForClass(CLASS)
    const ids = merged.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of merged) {
      const fromModule = bellstrikeUmbra.SKILLS.find((m) => m.id === s.id)
      if (fromModule) {
        expect(fromModule).toEqual(s)
        continue
      }
      const universal = UNIVERSAL_SKILLS.find(
        (u) => u.id === s.id.replace(`${CLASS}-`, "universal-"),
      )
      expect(universal, s.id).toBeTruthy()
      expect(s.classId).toBe(CLASS)
      expect(s.attributeAttack).toBe("Bellstrike")
      expect(s.name).toBe(universal!.name)
      expect(s.hits.map((h) => [h.physMultiplier, h.attributeMultiplier, h.physFixed])).toEqual(
        universal!.hits.map((h) => [h.physMultiplier, h.attributeMultiplier, h.physFixed]),
      )
    }
  })

  it("SpearQ 5-Hit Cancel's 5th hit lands before the cast ends", () => {
    const skill = builtinSkillsForClass(CLASS).find(
      (s) => s.id === "bellstrikeUmbra-spearq-5-hit-cancel",
    )!
    expect(skill.hits).toHaveLength(5)
    expect(skill.hits[4].frame).toBeLessThan(skill.castFrames)
  })
})

describe("builtinBuffsForClass", () => {
  it("bellstrikeUmbra carries River Flow with its own magnitude, and Spear Special Cooldown, Zenith Bar and Zenith Detonation as effect-less state markers", () => {
    const buffs = builtinBuffsForClass(CLASS)
    expect(buffs).toHaveLength(4)
    const riverFlow = buffs.find((b) => b.id === BUFF.potentRiverFlow)!
    const cooldown = buffs.find((b) => b.id === SPEAR_SPECIAL_COOLDOWN_BUFF_ID)!
    const zenith = buffs.find((b) => b.id === ZENITH_DETONATION_BUFF_ID)!
    expect(riverFlow).toBeTruthy()
    expect(cooldown).toBeTruthy()
    expect(zenith).toBeTruthy()
    expect(riverFlow.name).toBe("River Flow")
    expect(cooldown.name).toBe("Spear Special Cooldown")
    expect(zenith.name).toBe("Zenith Detonation")
    expect(riverFlow.effects).toEqual([{ statKey: "allDamageBoost", amount: 0.25 }])
    for (const b of [cooldown, zenith]) {
      expect(b.effects).toEqual([])
    }
    for (const b of [riverFlow, cooldown, zenith]) {
      expect(b.maxStacks).toBe(1)
      expect(b.activation).toBe("triggered")
      expect(b.scope).toBe("player")
    }
    const bar = buffs.find((b) => b.id === ZENITH_BAR_BUFF_ID)!
    expect(bar).toBeTruthy()
    expect(bar.name).toBe("Zenith Bar")
    expect(bar.effects).toEqual([])
    expect(bar.activation).toBe("permanent")
    expect(bar.maxStacks).toBe(5)
    expect(riverFlow.durationFrames).toBe(RIVER_FLOW_DURATION_FRAMES)
    expect(cooldown.durationFrames).toBe(SPEAR_SPECIAL_COOLDOWN_FRAMES)
    expect(zenith.durationFrames).toBe(ZENITH_DETONATION_FRAMES)
  })

  it("a class with no built-in buffs returns an empty array", () => {
    expect(builtinBuffsForClass("notAClass")).toEqual([])
  })
})
