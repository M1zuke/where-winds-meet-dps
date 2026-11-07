import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"
import { WHALEDRAFT_HOLD_DRAIN } from "./buffs/whaledraftHoldEndurance"
import { whaledraftHoldGainHits } from "./whaledraft-hold-hits"

// The full 10 s hold, capped by both its own timer and the Endurance it
// drains; falls back to the 4 s form once Endurance cannot sustain it
// (docs/TIMELINE.md § "Meters"). The release animation plays after the hold
// ends (in-game values as of 2026-09-24).
export const whaledraftHold = defineSkill({
  id: SKILL.whaledraftHold,
  classId: "bamboocutDraught",
  name: "Gauntlet - Drink (hold)",
  breakdownName: "Whaledraft (Drink)",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.whaledraftHold,
  receives: [...CLASS_RECEIVES, ...SKYSTRIKE_GAUNTLETS_RECEIVES],
  meterDrains: WHALEDRAFT_HOLD_DRAIN,
  triggerable: false,
  castFrames: 624,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range, shared with the tap drink.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: whaledraftHoldGainHits(10),
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
