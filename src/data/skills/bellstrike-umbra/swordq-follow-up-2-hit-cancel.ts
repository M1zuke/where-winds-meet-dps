import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"

export const swordqFollowUp2HitCancel = defineSkill({
  id: SKILL.swordqFollowUp2HitCancel,
  classId: "bellstrikeUmbra",
  name: "Sword Martial QQ 2-Hit[Cancel]",
  breakdownName: "Inner Track Slash",
  tags: [WEAPON.sword, ATTUNE.swordQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordMartialQQ2HitCancel,
  triggersBuffs: [BUFF.jadeware],
  receives: [BUFF.wolfchasersArtMartialDamage],
  // A cancel form ends where the animation opens its interrupt window — 42 frames in (in-game animation, 2026-09-09); the parry that ends it is the next rotation step.
  castFrames: 42,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 5,
      physMultiplier: 0.544068,
      attributeMultiplier: 0.816102,
      physFixed: 150.6,
      attributeFixed: 82,
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
    hit(1, {
      frame: 23,
      physMultiplier: 0.408051,
      attributeMultiplier: 0.6120765,
      physFixed: 112.95,
      attributeFixed: 61.5,
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
