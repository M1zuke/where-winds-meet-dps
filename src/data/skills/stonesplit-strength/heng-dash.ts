import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"
import { LEVEL_ROWS } from "./levelRows"

// In-game values as of 2026-10-15.
export const hengDash = defineSkill({
  id: SKILL.hengDash,
  classId: "stonesplitStrength",
  name: "Heng Blade - Dash",
  tags: [WEAPON.hengBlade],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.hengDash,
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [],
  castFrames: 40,
  triggerable: true,
  displacement: {
    kind: "byDistance",
    bands: [{ minMeters: 7, maxMeters: 100, then: { kind: "selfForward", meters: 6 } }],
    otherwise: { kind: "towardTarget", referenceMeters: 1 },
  },
  hits: [
    hit(0, {
      frame: 24,
      ...levelScaled(LEVEL_ROWS.hengDashHit0),
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
