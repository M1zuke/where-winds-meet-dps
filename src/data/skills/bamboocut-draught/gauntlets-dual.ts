import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const gauntletsDual = defineSkill({
  id: SKILL.gauntletsDual,
  classId: "bamboocutDraught",
  name: "Gauntlets (Dual-Weapon Skill)",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.gauntletsDual,
  receives: [...CLASS_RECEIVES, ...SKYSTRIKE_GAUNTLETS_RECEIVES],
  triggersBuffs: [],
  isWeaponSwap: true,
  castFrames: 48,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 14,
      physMultiplier: 0.30864,
      attributeMultiplier: 0.46296,
      physFixed: 85.6,
      attributeFixed: 46.8,
    }),
    hit(1, {
      frame: 37,
      physMultiplier: 0.46296,
      attributeMultiplier: 0.69444,
      physFixed: 128.4,
      attributeFixed: 70.2,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
