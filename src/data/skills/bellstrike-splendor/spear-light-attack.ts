import type { Displacement } from "../../../engine/skill"
import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SPEAR_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

const FIFTEEN_PERCENT_OF_ROW = {
  ...levelScaled(LEVEL_ROWS.spearLightAttackHit0),
}

const TEN_PERCENT_OF_ROW = {
  ...levelScaled(LEVEL_ROWS.spearLightAttackHit2),
}

const LIGHT_ATTACK_DISPLACEMENT: Displacement = {
  kind: "byDistance",
  bands: [{ minMeters: 1, maxMeters: 4.999, then: { kind: "toTarget", meters: 1 } }],
  otherwise: { kind: "towardTarget", referenceMeters: 1 },
}

// In-game values as of 2026-10-06: the four stages pressed in a row, seven
// hits.
export const spearLightAttack = defineSkill({
  id: SKILL.spearLightAttack,
  classId: "bellstrikeSplendor",
  name: "Spear Light Attack",
  breakdownName: "Spear - Light Attack",
  tags: [WEAPON.spear, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.splendorSpearLightChain,
  receives: [
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
    BUFF.swallowcallLightAttackBoost,
    ...NAMELESS_SPEAR_RECEIVES,
  ],
  castFrames: 153,
  triggerable: true,
  reachMeters: 4.5,
  displacement: LIGHT_ATTACK_DISPLACEMENT,
  hits: [
    hit(0, { frame: 20, ...FIFTEEN_PERCENT_OF_ROW }),
    hit(1, { frame: 41, ...FIFTEEN_PERCENT_OF_ROW }),
    hit(2, { frame: 65, ...TEN_PERCENT_OF_ROW }),
    hit(3, { frame: 82, ...FIFTEEN_PERCENT_OF_ROW }),
    hit(4, { frame: 106, ...TEN_PERCENT_OF_ROW }),
    hit(5, { frame: 116, ...TEN_PERCENT_OF_ROW }),
    hit(6, {
      frame: 133,
      ...levelScaled(LEVEL_ROWS.spearLightAttackHit6),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
