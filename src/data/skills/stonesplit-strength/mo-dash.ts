import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { PHALANXBANE_BLADE_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-15.
export const moDash = defineSkill({
  id: SKILL.moDash,
  classId: "stonesplitStrength",
  name: "Mo Blade - Dash",
  tags: [WEAPON.moBlade],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.moDash,
  receives: PHALANXBANE_BLADE_RECEIVES,
  triggersBuffs: [],
  castFrames: 52,
  triggerable: true,
  displacement: {
    kind: "byDistance",
    bands: [{ minMeters: 6, maxMeters: 100, then: { kind: "selfForward", meters: 5 } }],
    otherwise: { kind: "towardTarget", referenceMeters: 1 },
  },
  hits: [
    hit(0, {
      frame: 24,
      ...levelScaled(LEVEL_ROWS.moDashHit0),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
