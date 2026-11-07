import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"
import { WHALEDRAFT_HOLD_SHORT_DRAIN } from "./buffs/whaledraftHoldEndurance"
import { whaledraftHoldGainHits } from "./whaledraft-hold-hits"

// The 4 s hold: the longest a full 80-Endurance bar can sustain at 20/s, the
// fallback for the 10 s form and a legitimate shorter hold of its own
// (in-game values as of 2026-09-29).
export const whaledraftHoldShort = defineSkill({
  id: SKILL.whaledraftHoldShort,
  classId: "bamboocutDraught",
  name: "Gauntlet - Drink (hold, short)",
  breakdownName: "Whaledraft (Drink)",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.whaledraftHoldShort,
  receives: [...CLASS_RECEIVES, ...SKYSTRIKE_GAUNTLETS_RECEIVES],
  meterDrains: WHALEDRAFT_HOLD_SHORT_DRAIN,
  triggerable: false,
  castFrames: 264,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range, shared with the tap drink.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: whaledraftHoldGainHits(4),
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
