import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"

export const swordSpecialDeflect = defineSkill({
  id: SKILL.swordSpecialDeflect,
  classId: "bellstrikeSplendor",
  name: "SwordSpecial[Deflect]",
  breakdownName: "Shadow Step (deflect)",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecialDeflect,
  receives: NAMELESS_SWORD_RECEIVES,
  castFrames: 51,
  triggerable: true,
  // In-game values as of 2026-09-28: 12.8 m reach on its own companion
  // projectile, plus a further 1 m shrink-only pull once in range.
  reachMeters: 12.8,
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.76747,
      attributeMultiplier: 2.651205,
      physFixed: 490,
      attributeFixed: 267,
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-10-05T00:00:00.000Z",
})
