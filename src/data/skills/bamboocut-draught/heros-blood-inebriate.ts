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

const launch = {
  physMultiplier: 2.0394,
  attributeMultiplier: 3.0591,
  physFixed: 564,
  attributeFixed: 307.5,
  conditions: UNLOCKED,
}

const dashHalf = {
  physMultiplier: 1.0197,
  attributeMultiplier: 1.52955,
  physFixed: 282,
  attributeFixed: 153.75,
  conditions: UNLOCKED,
}

// Cannot trigger Abrasion per the talent "Increased Binge Point Gain" rank 2.
// The launch refreshes Carouse (in-game skill text, 2026-09-05); the dash ends
// the cast and with it Cloudvault. Cast length to the earliest next input and
// hit frames: in-game animation, 2026-09-05.
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
  neverAbrades: true,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, BUFF.cloudvault, BUFF.nonPlayerBaseDamage50],
  triggerable: false,
  castFrames: 177,
  hits: [
    hit(0, { ...launch, frame: 57, triggers: [applyBuff({ target: STATUS.carouse, stacks: 1 })] }),
    aerialSlash(1, 83),
    aerialSlash(2, 88),
    aerialSlash(3, 96),
    aerialSlash(4, 100),
    aerialSlash(5, 107),
    aerialSlash(6, 115),
    aerialSlash(7, 122),
    aerialSlash(8, 126),
    hit(9, { ...dashHalf, frame: 155 }),
    hit(10, {
      ...dashHalf,
      frame: 155,
      triggers: [applyBuff({ target: STATUS.cloudvault, stacks: -2 })],
    }),
  ],
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
})
