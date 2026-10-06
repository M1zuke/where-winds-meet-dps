import type { Displacement } from "../../../engine/skill"
import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"

const TWELVE_POINT_FIVE_PERCENT_OF_ROW = {
  physMultiplier: 0.26903,
  attributeMultiplier: 0.403545,
  physFixed: 74.5,
  attributeFixed: 40.625,
}

const FIFTEEN_PERCENT_OF_ROW = {
  physMultiplier: 0.322836,
  attributeMultiplier: 0.484254,
  physFixed: 89.4,
  attributeFixed: 48.75,
}

const LIGHT_ATTACK_DISPLACEMENT: Displacement = {
  kind: "byDistance",
  bands: [{ minMeters: 1, maxMeters: 3.499, then: { kind: "toTarget", meters: 1 } }],
  otherwise: { kind: "towardTarget", referenceMeters: 1 },
}

// In-game values as of 2026-10-06: the four stages pressed in a row, six hits;
// the third stage's last collider lands after the fourth stage cuts in.
export const swordLightAttack = defineSkill({
  id: SKILL.swordLightAttack,
  classId: "bellstrikeSplendor",
  name: "Sword Light Attack",
  breakdownName: "Sword - Light Attack",
  tags: [WEAPON.sword, ATTACK.light],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.splendorSwordLightChain,
  receives: [
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
    BUFF.swallowcallLightAttackBoost,
    ...NAMELESS_SWORD_RECEIVES,
  ],
  castFrames: 133,
  triggerable: true,
  reachMeters: 2.5,
  displacement: LIGHT_ATTACK_DISPLACEMENT,
  hits: [
    hit(0, { frame: 22, ...TWELVE_POINT_FIVE_PERCENT_OF_ROW }),
    hit(1, { frame: 43, ...TWELVE_POINT_FIVE_PERCENT_OF_ROW }),
    hit(2, { frame: 63, ...FIFTEEN_PERCENT_OF_ROW }),
    hit(3, { frame: 75, ...FIFTEEN_PERCENT_OF_ROW }),
    hit(4, {
      frame: 88,
      physMultiplier: 0.161418,
      attributeMultiplier: 0.242127,
      physFixed: 44.7,
      attributeFixed: 24.375,
    }),
    hit(5, {
      frame: 112,
      physMultiplier: 0.645672,
      attributeMultiplier: 0.968508,
      physFixed: 178.8,
      attributeFixed: 97.5,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
