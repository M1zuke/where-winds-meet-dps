// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { wolfchasersArtMartialDamageBuffDef } from "../../src/data/innerWays/wolfchasersArtBuffs"
import { builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { makeSkill } from "../../src/engine/skill"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"

const CLASS = "bellstrikeUmbra"
const BUFF_ID = "wolfchasersArtMartialDamage"
const MARTIAL_Q_SKILL_IDS = [
  SKILL.swordq,
  SKILL.swordqfollowup,
  SKILL.swordqFollowUp1HitCancel,
  SKILL.swordqFollowUp2HitCancel,
  SKILL.swordMartialQqq,
  SKILL.spearq,
  SKILL.spearq5HitCancel,
].sort()

describe("Wolfchaser's Art martial-art damage — reach", () => {
  it("reaches exactly the seven Sword/Spear Martial Q skills, and none of Bellstrike Umbra's other skills", () => {
    const reaching = builtinSkillsForClass(CLASS)
      .filter((skill) => skill.receives?.includes(BUFF_ID))
      .map((skill) => skill.id)
      .sort()
    expect(reaching).toEqual(MARTIAL_Q_SKILL_IDS)
  })

  it("does not reach Bleed Tick or Blood Burst", () => {
    const bleedTick = builtinSkillsForClass(CLASS).find((skill) => skill.id === SKILL.bleedTick)!
    const bloodBurst = builtinSkillsForClass(CLASS).find(
      (skill) => skill.id === SKILL.bleedDetonation,
    )!
    expect(bleedTick.receives ?? []).not.toContain(BUFF_ID)
    expect(bloodBurst.receives ?? []).not.toContain(BUFF_ID)
  })
})

describe("Wolfchaser's Art martial-art damage — BuffEngine unit", () => {
  const TIER_3 = { wolfchasersArt: true, wolfchasersArtTier: 3 }
  const skillReceivingBuff = () => makeSkill(CLASS, { name: "receiver", receives: [BUFF_ID] })

  it("adds allDamageBoost +10% from tier 3 on, for a skill that lists it in receives", () => {
    const engine = new BuffEngine(TIER_3, [], [wolfchasersArtMartialDamageBuffDef()])
    expect(engine.calculateDamageEffects(skillReceivingBuff(), 0).effects).toEqual([
      { statKey: "allDamageBoost", amount: 0.1 },
    ])
  })

  it("is off below tier 3", () => {
    const engine = new BuffEngine(
      { wolfchasersArt: true, wolfchasersArtTier: 2 },
      [],
      [wolfchasersArtMartialDamageBuffDef()],
    )
    expect(engine.calculateDamageEffects(skillReceivingBuff(), 0).effects).toHaveLength(0)
  })

  it("does not affect a skill that does not list it in receives", () => {
    const engine = new BuffEngine(TIER_3, [], [wolfchasersArtMartialDamageBuffDef()])
    const unrelated = makeSkill(CLASS, { name: "unrelated", receives: [] })
    expect(engine.calculateDamageEffects(unrelated, 0).effects).toHaveLength(0)
  })
})
