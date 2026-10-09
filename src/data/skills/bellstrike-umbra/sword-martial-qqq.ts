import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDot, detonateDot } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"
import { CRISSCROSS_ENDURANCE_GAIN } from "./buffs/crisscrossEnduranceGain"
import { BLEED_MECHANISM_ENHANCEMENT_GAIN } from "./buffs/bleedMechanismEnhancement"

export const swordMartialQqq = defineSkill({
  id: SKILL.swordMartialQqq,
  classId: "bellstrikeUmbra",
  name: "Sword Martial QQQ",
  breakdownName: "Crisscross - Inner Track",
  tags: [WEAPON.sword, ATTUNE.swordQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordMartialQQQ,
  // In-game values as of 2026-09-24: only castable with Sword Horizon slotted.
  castConditions: [{ param: PARAM.swordHorizon }],
  triggersBuffs: [BUFF.jadeware],
  receives: [BUFF.wolfchasersArtMartialDamage, BUFF.starweaveMartialBoost, ...STRATEGIC_SWORD_RECEIVES],
  // Cast length to the earliest next input and hit frames: in-game animation, 2026-09-09.
  castFrames: 86,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 32,
      physMultiplier: 0.316911,
      attributeMultiplier: 0.475366,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyDot({ target: DEBUFF.bleedTick }),
        detonateDot({ target: DEBUFF.bleedTick, stacks: 0 }),
        BLEED_MECHANISM_ENHANCEMENT_GAIN,
      ],
    }),
    hit(1, {
      frame: 71,
      physMultiplier: 0.475366,
      attributeMultiplier: 0.713049,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyDot({ target: DEBUFF.bleedTick }),
        detonateDot({ target: DEBUFF.bleedTick, stacks: 0 }),
        CRISSCROSS_ENDURANCE_GAIN,
        BLEED_MECHANISM_ENHANCEMENT_GAIN,
      ],
    }),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
