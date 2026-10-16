import { defineSkill } from "../../../definitions/skills/skillDef"
import { SKILL } from "./ids"
import { phalanxchargedS1 } from "./phalanxcharged-s1"

const RELEASED_HIT_FRAMES = [48.23, 55.83]

// In-game values as of 2026-10-15: stage 1 released where the charge would have
// started, 19.32 f after the press — its hits land 28.91 f and 36.51 f later and
// its cast ends 60 f later.
export const phalanxchargedS1Released = defineSkill({
  ...phalanxchargedS1,
  id: SKILL.phalanxchargedS1Released,
  name: "PhalanxCharged-S1[Released]",
  breakdownName: phalanxchargedS1.name,
  castFrames: 79.32,
  hits: phalanxchargedS1.hits.map((hit, index) => ({ ...hit, frame: RELEASED_HIT_FRAMES[index]! })),
  createdAt: "2026-10-16T00:00:00.000Z",
  updatedAt: "2026-10-16T00:00:00.000Z",
})
