import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
import { CLASS_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"
import { GAUNTLETS_DASH_DISPLACEMENT, gauntletsDashHit } from "./gauntlets-dash"

// In-game values as of 2026-10-06: the same sprint attack in Tipsy plays a
// shorter clip.
export const gauntletsDashTipsy = defineSkill({
  id: SKILL.gauntletsDashTipsy,
  classId: "bamboocutDraught",
  name: "Gauntlets - Dash (Tipsy)",
  breakdownName: "Gauntlets - Dash",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.gauntletsDashTipsy,
  receives: [...CLASS_RECEIVES, ...SKYSTRIKE_GAUNTLETS_RECEIVES],
  castConditions: [{ buffId: STATUS.bingePoints, op: "gte", stacks: 100 }],
  triggerable: false,
  castFrames: 32,
  reachMeters: 7.5,
  displacement: GAUNTLETS_DASH_DISPLACEMENT,
  hits: [gauntletsDashHit(16)],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
