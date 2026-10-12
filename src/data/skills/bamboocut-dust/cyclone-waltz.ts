import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { EVERSPRING_UMBRELLA_RECEIVES } from "./receives"

export const CYCLONE_WALTZ_HIT = {
  physMultiplier: 0.28129176,
  attributeMultiplier: 0.42193764,
  physFixed: 77.922,
  attributeFixed: 42.402,
}

const FIRST_TICK_FRAME = 42
const TICK_SPACING_FRAMES = 18
const TICK_COUNT = 9

// In-game values as of 2026-10-12: nine ticks every 0.3 s from frame 42, then
// two finishes — the first on the last tick's frame, the second 18 frames
// later (11 hits in a full spin).
export const cycloneWaltz = defineSkill({
  id: SKILL.cycloneWaltz,
  classId: "bamboocutDust",
  name: "Cyclone Waltz",
  tags: [WEAPON.umbrella, ATTUNE.everspringSpecial],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustCycloneWaltz,
  receives: EVERSPRING_UMBRELLA_RECEIVES,
  castFrames: 237,
  triggerable: false,
  reachMeters: 5,
  approach: "stationary",
  hits: Array.from({ length: TICK_COUNT }, (_, index) =>
    hit(index, {
      frame: FIRST_TICK_FRAME + index * TICK_SPACING_FRAMES,
      ...CYCLONE_WALTZ_HIT,
      ...(index === TICK_COUNT - 1
        ? { triggers: [castSkill({ target: SKILL.cycloneWaltzFinish })] }
        : {}),
    }),
  ),
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
