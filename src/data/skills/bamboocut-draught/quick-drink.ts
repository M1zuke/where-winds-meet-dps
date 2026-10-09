import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"
import { drinkGrants } from "./whaledraft"

// The drink at the perfect moment after a skill also unleashes Falcon's
// Pursuit (in-game skill text, 2026-09-05).
export const perfectQuickDrinkTriggers = [
  ...drinkGrants,
  castSkill({ target: SKILL.falconsPursuit }),
]

// The falcon launches 0.3 s in; cast length to the earliest next input
// (in-game animation, 2026-09-05).
export const perfectQuickDrinkHit = hit(0, {
  frame: 18,
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
  triggers: perfectQuickDrinkTriggers,
})

export const quickDrink = defineSkill({
  id: SKILL.quickDrink,
  classId: "bamboocutDraught",
  name: "Gauntlet - Perfect Quick Drink",
  breakdownName: "Whaledraft (Drink)",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.quickDrink,
  receives: [...CLASS_RECEIVES, ...SKYSTRIKE_GAUNTLETS_RECEIVES],
  triggerable: false,
  castFrames: 41,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range. The falcon it launches carries a
  // fixed hit box, not a travel range, and is not modelled here.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [perfectQuickDrinkHit],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
