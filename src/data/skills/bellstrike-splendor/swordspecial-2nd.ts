import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"

export const swordSpecial2nd = defineSkill({
  id: SKILL.swordSpecial2nd,
  classId: "bellstrikeSplendor",
  name: "SwordSpecial[2nd]",
  breakdownName: "Shadow Step (2nd)",
  tags: [WEAPON.sword, ATTUNE.swordSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordSpecial2nd,
  receives: NAMELESS_SWORD_RECEIVES,
  castFrames: 24,
  triggerable: true,
  // In-game values as of 2026-09-28: 12.8 m reach on its own companion
  // projectile, plus a further 1 m shrink-only pull once in range.
  reachMeters: 12.8,
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.767,
      attributeMultiplier: 2.6505,
      physFixed: 490,
      attributeFixed: 267,
    }),
  ],
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
})
