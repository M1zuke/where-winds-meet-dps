import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"
import { SWORD_HEAVY_ATTACK_MOTION } from "./rootMotion"
import { LEVEL_ROWS } from "./levelRows"

const TWENTY_PERCENT_OF_ROW = {
  ...levelScaled(LEVEL_ROWS.swordHeavyAttackHit0),
}

const FIFTEEN_PERCENT_OF_ROW = {
  ...levelScaled(LEVEL_ROWS.swordHeavyAttackHit1),
}

// In-game values as of 2026-10-06: three taps in a row, five hits; the first
// stage starts 2 f after the press.
export const swordHeavyAttack = defineSkill({
  id: SKILL.swordHeavyAttack,
  classId: "bellstrikeSplendor",
  name: "Sword Heavy Attack",
  breakdownName: "Sword - Heavy Attack",
  tags: [WEAPON.sword, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.splendorSwordHeavyChain,
  receives: [BUFF.mistwillowLightBuff, BUFF.mistwillowBuff, ...NAMELESS_SWORD_RECEIVES],
  castFrames: 174,
  triggerable: true,
  reachMeters: 3,
  displacement: SWORD_HEAVY_ATTACK_MOTION,
  hits: [
    hit(0, { frame: 26, ...TWENTY_PERCENT_OF_ROW }),
    hit(1, { frame: 48, ...FIFTEEN_PERCENT_OF_ROW }),
    hit(2, { frame: 83, ...FIFTEEN_PERCENT_OF_ROW }),
    hit(3, { frame: 115, ...TWENTY_PERCENT_OF_ROW }),
    hit(4, {
      frame: 150,
      ...levelScaled(LEVEL_ROWS.swordHeavyAttackHit4),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
