import type { Displacement } from "../../../engine/skill"
import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SPEAR_RECEIVES } from "./receives"

const FIFTEEN_PERCENT_OF_ROW = {
  physMultiplier: 0.3287865,
  attributeMultiplier: 0.49317975,
  physFixed: 91.05,
  attributeFixed: 49.65,
}

const TEN_PERCENT_OF_ROW = {
  physMultiplier: 0.219191,
  attributeMultiplier: 0.3287865,
  physFixed: 60.7,
  attributeFixed: 33.1,
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
      physMultiplier: 0.5479775,
      attributeMultiplier: 0.82196625,
      physFixed: 151.75,
      attributeFixed: 82.75,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
