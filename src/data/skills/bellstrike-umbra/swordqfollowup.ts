import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"
import { SWORDQ_FOLLOW_UP_MOTION, SWORDQ_FOLLOW_UP_61_F_MOTION } from "./rootMotion"
import { LEVEL_ROWS } from "./levelRows"

export const swordqfollowup = defineSkill({
  id: SKILL.swordqfollowup,
  classId: "bellstrikeUmbra",
  name: "Sword Martial QQ",
  breakdownName: "Inner Track Slash",
  tags: [WEAPON.sword, ATTUNE.swordQ, PROP.isMartialSkillQ],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordMartialQQ,
  triggersBuffs: [BUFF.jadeware],
  receives: [BUFF.wolfchasersArtMartialDamage, BUFF.starweaveMartialBoost, ...STRATEGIC_SWORD_RECEIVES],
  // Cast length to the earliest next input and hit frames: in-game animation, 2026-09-09.
  castFrames: 64,
  triggerable: true,
  displacement: SWORDQ_FOLLOW_UP_MOTION,
  // In-game values as of 2026-09-28: 4 m approach reach.
  reachMeters: 4,
  hits: [
    hit(0, {
      frame: 5,
      ...levelScaled(LEVEL_ROWS.swordqHit0),
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
      // In-game cast length as of 2026-09-24: Sword Horizon cuts the animation
      // short into the Crisscross - Inner Track follow-up.
      variants: [
        {
          id: "hv-swordqfollowup-hit-0-sword-horizon",
          label: "Sword Horizon",
          conditions: [{ param: PARAM.swordHorizon }],
          ...levelScaled(LEVEL_ROWS.swordqHit0),
          castFrames: 61,
          displacement: SWORDQ_FOLLOW_UP_61_F_MOTION,
        },
      ],
    }),
    hit(1, {
      frame: 23,
      ...levelScaled(LEVEL_ROWS.swordqfollowupHit1),
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
    hit(2, {
      frame: 34,
      ...levelScaled(LEVEL_ROWS.swordqfollowupHit1),
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
    hit(3, {
      frame: 43,
      ...levelScaled(LEVEL_ROWS.swordqfollowupHit3),
      triggers: [applyDot({ target: DEBUFF.bleedTick })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
