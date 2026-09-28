import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { BUFF, PARAM } from "../buffs/ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

export const snowpartingdual = defineSkill({
  id: SKILL.snowpartingdual,
  classId: "stonesplitStrength",
  name: "SnowpartingDual",
  tags: [WEAPON.hengBlade],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingDual,
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [],
  isWeaponSwap: true,
  // Cast length to the earliest next input (in-game animation, 2026-09-24).
  castFrames: 34,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 22,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyBuff({
          target: BUFF.snowbreakSpringAvailable,
          requiresParam: PARAM.frostCladNight,
          requiresMinTier: 3,
        }),
      ],
    }),
    hit(1, {
      frame: 30,
      physMultiplier: 0.6486,
      attributeMultiplier: 0.9729,
      physFixed: 180,
      attributeFixed: 98,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
