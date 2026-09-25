import { describe, expect, it } from "vitest"
import { builtinSkillsForClass, builtinDebuffsForClass } from "../../src/engine/builtinLibrary"
import {
  EMPOWERED_RIVER_FLOW_BUFF_ID,
  RIVER_FLOW_BASE_DURATION_FRAMES,
  RIVER_FLOW_DURATION_FRAMES,
  SPEAR_SPECIAL_COOLDOWN_BUFF_ID,
  SPEAR_SPECIAL_COOLDOWN_FRAMES,
  SPRING_SURGE_BUFF_ID,
  WATER_DROP_BUFF_ID,
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
import { MYSTIC_SKILLS } from "../../src/data/skills/mystic"
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

  it("hit 0 is a zero-damage Shattered Stone hit gated on Spring Surge or higher", () => {
    for (const s of [spearSpecial[0], cancel[0]]) {
      const [shatteredStoneHit] = s.hits
      expect(shatteredStoneHit.frame).toBe(0)
      expect(shatteredStoneHit.physMultiplier).toBe(0)
      expect(shatteredStoneHit.attributeMultiplier).toBe(0)
      expect(shatteredStoneHit.triggers).toHaveLength(1)
      const [trigger] = shatteredStoneHit.triggers
      expect(trigger.kind).toBe("applyDebuff")
      expect(trigger.targetId).toBe("debuff-bellstrikeUmbra-defense-down")
      expect(trigger.condition).toEqual({ buffId: SPRING_SURGE_BUFF_ID, op: "gte", stacks: 1 })
    }
  })

  it("base + River Flow + Spring Surge variant coefficients split 0.32/0.48/0.40/0.60 across Spear Special's two damage hits; the cancel shares hit 1", () => {
    const [, first, second] = spearSpecial[0].hits
    const total = (
      field: "physMultiplier" | "attributeMultiplier" | "physFixed" | "attributeFixed",
    ) => first[field] + second[field]

    expect(total("physMultiplier")).toBeCloseTo(1.712176, 10)
    expect(total("attributeMultiplier")).toBeCloseTo(2.568264, 10)
    expect(total("physFixed")).toBeCloseTo(474.4, 10)
    expect(total("attributeFixed")).toBeCloseTo(258.4, 10)
    expect(first.physMultiplier / total("physMultiplier")).toBeCloseTo(0.4, 6)
    expect(second.physMultiplier / total("physMultiplier")).toBeCloseTo(0.6, 6)

    const riverFlowVariant = (hit: typeof first) =>
      hit.variants!.find((v) => v.label === "River Flow")!
    const springSurgeVariant = (hit: typeof first) =>
      hit.variants!.find((v) => v.label === "Spring Surge")!

    const totalRiverFlow = (
      field: "physMultiplier" | "attributeMultiplier" | "physFixed" | "attributeFixed",
    ) => riverFlowVariant(first)[field] + riverFlowVariant(second)[field]
    expect(totalRiverFlow("physMultiplier")).toBeCloseTo(2.568264, 10)
    expect(totalRiverFlow("attributeMultiplier")).toBeCloseTo(3.852396, 10)
    expect(totalRiverFlow("physFixed")).toBeCloseTo(711.6, 10)
    expect(totalRiverFlow("attributeFixed")).toBeCloseTo(387.6, 10)

    const totalSpringSurge = (
      field: "physMultiplier" | "attributeMultiplier" | "physFixed" | "attributeFixed",
    ) => springSurgeVariant(first)[field] + springSurgeVariant(second)[field]
    expect(totalSpringSurge("physMultiplier")).toBeCloseTo(2.14022, 6)
    expect(totalSpringSurge("physFixed")).toBeCloseTo(593, 6)

    // River Flow before Spring Surge: `selectHitVariant` takes the first
    // matching variant, and River Flow implies Spring Surge is granted too.
    expect(first.variants!.indexOf(riverFlowVariant(first))).toBeLessThan(
      first.variants!.indexOf(springSurgeVariant(first)),
    )

    expect(cancel[0].hits).toEqual([spearSpecial[0].hits[0], first])
  })

  it("each damage hit's five triggers: 1×applyDot(bleed) on River Flow alone, 2×applyDot(bleed) + 1×castSkill(Blood Burst) + 1×applyBuff(cooldown) LAST on Empowered + cooldown = 0 — never detonateDot", () => {
    const bleedId = "debuff-bellstrikeUmbra-bleed-tick"
    const detonationId = "bellstrikeUmbra-bleed-detonation"
    const riverFlowCondition = { buffId: BUFF.potentRiverFlow, op: "gte", stacks: 1 }
    const empoweredCondition = { buffId: EMPOWERED_RIVER_FLOW_BUFF_ID, op: "gte", stacks: 1 }
    const cooldownCondition = { buffId: SPEAR_SPECIAL_COOLDOWN_BUFF_ID, op: "eq", stacks: 0 }
    for (const s of [spearSpecial[0], cancel[0]]) {
      const [, damageHit] = s.hits
      const triggers = damageHit.triggers
      expect(triggers).toHaveLength(5)
      expect(triggers.some((t) => t.kind === "detonateDot")).toBe(false)

      const [firstBleed, ...rest] = triggers
      expect(firstBleed.kind).toBe("applyDot")
      expect(firstBleed.targetId).toBe(bleedId)
      expect(firstBleed.condition).toEqual(riverFlowCondition)
      expect(firstBleed.conditions).toBeUndefined()

      for (const t of rest) {
        expect(t.condition).toEqual(empoweredCondition)
        expect(t.conditions).toEqual([cooldownCondition])
      }
      const applyDots = rest.filter((t) => t.kind === "applyDot")
      expect(applyDots).toHaveLength(2)
      for (const t of applyDots) expect(t.targetId).toBe(bleedId)
      const casts = rest.filter((t) => t.kind === "castSkill")
      expect(casts).toHaveLength(1)
      expect(casts[0].targetId).toBe(detonationId)
      const applyBuffs = rest.filter((t) => t.kind === "applyBuff")
      expect(applyBuffs).toHaveLength(1)
      expect(applyBuffs[0].targetId).toBe(SPEAR_SPECIAL_COOLDOWN_BUFF_ID)
      expect(triggers[triggers.length - 1]).toBe(applyBuffs[0])
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
      const fromMystic = MYSTIC_SKILLS.find((m) => m.id === s.id)
      if (fromMystic) {
        expect(fromMystic).toEqual(s)
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
  it("bellstrikeUmbra carries the River Flow tier ladder as layered magnitudes, and Spear Special Cooldown, Zenith Bar and Zenith Detonation as effect-less state markers", () => {
    const buffs = builtinBuffsForClass(CLASS)
    expect(buffs).toHaveLength(7)
    const waterDrop = buffs.find((b) => b.id === WATER_DROP_BUFF_ID)!
    const springSurge = buffs.find((b) => b.id === SPRING_SURGE_BUFF_ID)!
    const riverFlow = buffs.find((b) => b.id === BUFF.potentRiverFlow)!
    const empowered = buffs.find((b) => b.id === EMPOWERED_RIVER_FLOW_BUFF_ID)!
    const cooldown = buffs.find((b) => b.id === SPEAR_SPECIAL_COOLDOWN_BUFF_ID)!
    const zenith = buffs.find((b) => b.id === ZENITH_DETONATION_BUFF_ID)!
    for (const b of [waterDrop, springSurge, riverFlow, empowered, cooldown, zenith])
      expect(b).toBeTruthy()
    expect(waterDrop.name).toBe("Water Drop")
    expect(springSurge.name).toBe("Spring Surge")
    expect(riverFlow.name).toBe("River Flow")
    expect(empowered.name).toBe("Empowered River Flow")
    expect(cooldown.name).toBe("Spear Special Cooldown")
    expect(zenith.name).toBe("Zenith Detonation")
    // Each tier carries only its own additional amount on top of the tier
    // below it, so the sum matches the tier actually reached: 10 / 15 / 20 / 25 %.
    expect(waterDrop.effects).toEqual([{ statKey: "allDamageBoost", amount: 0.1 }])
    expect(springSurge.effects).toEqual([{ statKey: "allDamageBoost", amount: 0.05 }])
    expect(riverFlow.effects).toEqual([{ statKey: "allDamageBoost", amount: 0.05 }])
    expect(empowered.effects).toEqual([{ statKey: "allDamageBoost", amount: 0.05 }])
    for (const b of [cooldown, zenith]) {
      expect(b.effects).toEqual([])
    }
    for (const b of [waterDrop, springSurge, riverFlow, empowered, cooldown, zenith]) {
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
    for (const b of [riverFlow, empowered])
      expect(b.durationFrames).toBe(RIVER_FLOW_DURATION_FRAMES)
    for (const b of [waterDrop, springSurge])
      expect(b.durationFrames).toBe(RIVER_FLOW_BASE_DURATION_FRAMES)
    expect(cooldown.durationFrames).toBe(SPEAR_SPECIAL_COOLDOWN_FRAMES)
    expect(zenith.durationFrames).toBe(ZENITH_DETONATION_FRAMES)
  })

  it("a class with no built-in buffs returns an empty array", () => {
    expect(builtinBuffsForClass("notAClass")).toEqual([])
  })
})
