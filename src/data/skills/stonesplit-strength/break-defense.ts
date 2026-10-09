import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

const COOLDOWN_CLEAR = [{ buffId: STATUS.breakDefenseCooldown, op: "eq" as const, stacks: 0 }]

// In-game values as of 2026-10-06. The 10 s cooldown is shared by every
// class's Break Defense in game; here it is this module's own.
export const breakDefense = defineSkill({
  id: SKILL.breakDefense,
  classId: "stonesplitStrength",
  name: "Heng Blade - Break Defense",
  tags: [WEAPON.hengBlade],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.breakDefense,
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [],
  castFrames: 80,
  triggerable: true,
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 11,
      physMultiplier: 0.19841,
      attributeMultiplier: 0.297615,
      physFixed: 1.2,
      attributeFixed: 0,
      conditions: COOLDOWN_CLEAR,
      triggers: [applyBuff({ target: STATUS.breakDefenseCooldown, stacks: 1 })],
    }),
    hit(1, {
      frame: 47,
      physMultiplier: 0.59523,
      attributeMultiplier: 0.892845,
      physFixed: 3.6,
      attributeFixed: 0,
      conditions: COOLDOWN_CLEAR,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
