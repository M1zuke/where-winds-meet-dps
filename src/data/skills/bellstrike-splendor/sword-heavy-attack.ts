import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"

const TWENTY_PERCENT_OF_ROW = {
  physMultiplier: 0.479274,
  attributeMultiplier: 0.718911,
  physFixed: 132.6,
  attributeFixed: 72.2,
}

const FIFTEEN_PERCENT_OF_ROW = {
  physMultiplier: 0.3594555,
  attributeMultiplier: 0.53918325,
  physFixed: 99.45,
  attributeFixed: 54.15,
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
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, { frame: 26, ...TWENTY_PERCENT_OF_ROW }),
    hit(1, { frame: 48, ...FIFTEEN_PERCENT_OF_ROW }),
    hit(2, { frame: 83, ...FIFTEEN_PERCENT_OF_ROW }),
    hit(3, { frame: 115, ...TWENTY_PERCENT_OF_ROW }),
    hit(4, {
      frame: 150,
      physMultiplier: 0.718911,
      attributeMultiplier: 1.0783665,
      physFixed: 198.9,
      attributeFixed: 108.3,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
