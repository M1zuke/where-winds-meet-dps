import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import type { TriggerCondition } from "../../../engine/skill"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES } from "./receives"

const UNLOCKED: TriggerCondition[] = [{ buffId: BUFF.skyspeakUnlock, op: "gte", stacks: 1 }]

const aerialSlash = (index: number, frame: number) =>
  hit(index, {
    frame,
    physMultiplier: 0.3399,
    attributeMultiplier: 0.50985,
    physFixed: 94,
    attributeFixed: 51.25,
    conditions: UNLOCKED,
  })

const launchOrDash = {
  physMultiplier: 2.0394,
  attributeMultiplier: 3.0591,
  physFixed: 564,
  attributeFixed: 307.5,
  conditions: UNLOCKED,
}

// Forced precision per the talent "Increased Binge Point Gain" rank 2. The
// dash ends the cast and with it Cloudvault. Cast length: community
// speed-rotation workbook v2.0, 2026-09-04, 3.0 s; hit spacing provisional.
export const herosBloodInebriate = defineSkill({
  id: SKILL.herosBloodInebriate,
  classId: "bamboocutDraught",
  name: "Twinblade Special - Inebriate",
  breakdownName: "Hero's Blood - Inebriate",
  tags: [WEAPON.twinBlades, ATTUNE.driftcleaveDeepdaze],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.herosBloodInebriate,
  guaranteedPrecision: true,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.cloudvault, BUFF.nonPlayerBaseDamage50],
  triggerable: false,
  castFrames: 180,
  hits: [
    hit(0, { ...launchOrDash, frame: 0 }),
    aerialSlash(1, 18),
    aerialSlash(2, 36),
    aerialSlash(3, 54),
    aerialSlash(4, 72),
    aerialSlash(5, 90),
    aerialSlash(6, 108),
    aerialSlash(7, 126),
    aerialSlash(8, 144),
    hit(9, {
      ...launchOrDash,
      frame: 162,
      triggers: [applyBuff({ target: STATUS.cloudvault, stacks: -2 })],
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
