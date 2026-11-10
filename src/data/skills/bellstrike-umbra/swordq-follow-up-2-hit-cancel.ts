import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"
import { SWORDQ_FOLLOW_UP_2_HIT_CANCEL_MOTION } from "./rootMotion"
import { LEVEL_ROWS } from "./levelRows"

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
  cancelledBy: "deflectCancel",
  triggersBuffs: [BUFF.jadeware],
  receives: [BUFF.wolfchasersArtMartialDamage, BUFF.starweaveMartialBoost, ...STRATEGIC_SWORD_RECEIVES],
  // A cancel form ends one frame past its last kept hit — the animation opens no earlier interrupt window (in-game animation, 2026-10-15); the parry that ends it is the next rotation step.
  castFrames: 25,
  triggerable: true,
  displacement: SWORDQ_FOLLOW_UP_2_HIT_CANCEL_MOTION,
  // In-game values as of 2026-09-28: 4 m approach reach.
  reachMeters: 4,
  hits: [
    hit(0, {
      frame: 5,
      ...levelScaled(LEVEL_ROWS.swordqHit0),
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
    hit(1, {
      frame: 23,
      ...levelScaled(LEVEL_ROWS.swordqfollowupHit1),
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
