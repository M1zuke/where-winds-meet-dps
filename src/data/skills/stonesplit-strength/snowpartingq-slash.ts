import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

// In-game values as of 2026-10-06.
export const snowpartingqSlash = defineSkill({
  id: SKILL.snowpartingqSlash,
  classId: "stonesplitStrength",
  name: "SnowpartingQ-Slash",
  tags: [WEAPON.hengBlade, ATTUNE.snowpartingQ],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingQSlash,
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [],
  castFrames: 40,
  triggerable: true,
  reachMeters: 4.5,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 14,
      physMultiplier: 0.596352,
      attributeMultiplier: 0.894528,
      physFixed: 165.2,
      attributeFixed: 90,
    }),
    hit(1, {
      frame: 30,
      physMultiplier: 0.894528,
      attributeMultiplier: 1.341792,
      physFixed: 247.8,
      attributeFixed: 135,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
