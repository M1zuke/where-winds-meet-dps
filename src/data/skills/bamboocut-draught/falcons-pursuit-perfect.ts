import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES } from "./receives"

// The falcon a Perfect Quick Drink unleashes: the same client row 20902814
// (1.4784) as the light-attack falcon, with the perfect-drink enhancement on
// top — its own module so that bonus reaches this falcon only.
export const falconsPursuitPerfect = defineSkill({
  id: SKILL.falconsPursuitPerfect,
  classId: "bamboocutDraught",
  name: "Falcon's Pursuit (Perfect Drink)",
  breakdownName: "Falcon's Pursuit",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.falconsPursuitPerfect,
  receives: [...CLASS_RECEIVES, BUFF.perfectQuickDrink],
  triggerable: true,
  castFrames: 0,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.4784,
      attributeMultiplier: 2.2176,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
})
