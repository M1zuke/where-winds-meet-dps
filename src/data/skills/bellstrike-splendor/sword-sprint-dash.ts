import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { NAMELESS_SWORD_RECEIVES } from "./receives"

// In-game values as of 2026-10-06: the dash input while sprinting; the sprint
// itself is not simulated.
export const swordSprintDash = defineSkill({
  id: SKILL.swordSprintDash,
  classId: "bellstrikeSplendor",
  name: "Sword Sprint Dash",
  breakdownName: "Sword - Dash (sprint)",
  tags: [WEAPON.sword],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.splendorSwordSprintDash,
  receives: NAMELESS_SWORD_RECEIVES,
  castFrames: 41,
  triggerable: true,
  displacement: {
    kind: "byDistance",
    bands: [{ minMeters: 7, maxMeters: 100, then: { kind: "selfForward", meters: 6 } }],
    otherwise: { kind: "towardTarget", referenceMeters: 1 },
  },
  hits: [
    hit(0, {
      frame: 8,
      physMultiplier: 0.173364,
      attributeMultiplier: 0.260046,
      physFixed: 48.2,
      attributeFixed: 26.2,
    }),
    hit(1, {
      frame: 26,
      physMultiplier: 0.693456,
      attributeMultiplier: 1.040184,
      physFixed: 192.8,
      attributeFixed: 104.8,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
