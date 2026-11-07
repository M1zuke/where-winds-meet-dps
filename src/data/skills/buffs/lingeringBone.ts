import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { PROP } from "../ids"

export const LINGERING_BONE_APPLIED_AFTER_HIT_SEC = 0.03

// In-game values as of 2026-10-15: 5 s on a boss, applied 0.03 s after the hit.
export const lingeringBone = defineBuff({
  id: BUFF.lingeringBone,
  name: "Lingering Bone",
  duration: 5,
  buffAppliesAfterLastHitSec: LINGERING_BONE_APPLIED_AFTER_HIT_SEC,
  extendedOnlyByProperty: PROP.isDrone,
  effects: [],
})
