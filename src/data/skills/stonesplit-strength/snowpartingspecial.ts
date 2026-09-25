import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

const SHARE_HIT = {
  physMultiplier: 0.377968,
  attributeMultiplier: 0.566952,
  physFixed: 104.6,
  attributeFixed: 57,
}

const SHARE_HIT_FRAMES = [0, 13, 26, 39, 52, 65, 78, 91]
const FINAL_HIT_FRAME = 104

export const snowpartingspecial = defineSkill({
  id: SKILL.snowpartingspecial,
  classId: "stonesplitStrength",
  name: "SnowpartingSpecial",
  tags: [WEAPON.hengBlade],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingSpecial,
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [BUFF.innerPassion, BUFF.jadeware],
  castFrames: 125,
  triggerable: true,
  hits: [
    ...SHARE_HIT_FRAMES.map((frame, index) => hit(index, { frame, ...SHARE_HIT })),
    hit(SHARE_HIT_FRAMES.length, {
      frame: FINAL_HIT_FRAME,
      physMultiplier: 0.755936,
      attributeMultiplier: 1.133904,
      physFixed: 209.2,
      attributeFixed: 114,
      triggers: [applyBuff({ target: STATUS.dread })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
