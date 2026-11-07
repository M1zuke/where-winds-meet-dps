import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
import { CLASS_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"

// The standalone tap of the drink button, released before the hold
// threshold: a flat +5 Binge Points 0.6 s in, no Carouse doubling and no
// Binge Mark conversion (those belong to the chained Quick Drink after a
// Light Attack, already modelled in `whaledraft.ts`). In-game values as of
// 2026-09-24.
export const whaledraftTap = defineSkill({
  id: SKILL.whaledraftTap,
  classId: "bamboocutDraught",
  name: "Gauntlet - Drink (tap)",
  breakdownName: "Whaledraft (Drink)",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.whaledraftTap,
  receives: [...CLASS_RECEIVES, ...SKYSTRIKE_GAUNTLETS_RECEIVES],
  triggerable: false,
  castFrames: 36,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range, shared with the chained drink.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 36,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [applyBuff({ target: STATUS.bingePoints, stacks: 5 })],
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
