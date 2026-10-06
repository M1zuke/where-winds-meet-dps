import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { NAMELESS_SPEAR_RECEIVES } from "./receives"

// In-game values as of 2026-10-06: the dash input while sprinting; the sprint
// itself is not simulated.
export const cloudstep = defineSkill({
  id: SKILL.cloudstep,
  classId: "bellstrikeSplendor",
  name: "Spear Sprint Dash",
  breakdownName: "Cloudstep",
  tags: [WEAPON.spear],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.splendorCloudstep,
  receives: NAMELESS_SPEAR_RECEIVES,
  castFrames: 43,
  triggerable: true,
  displacement: {
    kind: "byDistance",
    bands: [{ minMeters: 6, maxMeters: 100, then: { kind: "selfForward", meters: 5 } }],
    otherwise: { kind: "towardTarget", referenceMeters: 1 },
  },
  hits: [
    hit(0, {
      frame: 29,
      physMultiplier: 0.591504,
      attributeMultiplier: 0.887256,
      physFixed: 164.4,
      attributeFixed: 89.4,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
