import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, castSkill } from "../../../definitions/skills/triggers"
import type { Skill } from "../../../engine/skill"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
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
const SWAP_FRAME = 27

const NO_DAMAGE = {
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
}

export function cycloneWaltzSpinHits(finishSkillId: string) {
  return [
    ...Array.from({ length: TICK_COUNT }, (_, index) =>
      hit(index, {
        frame: FIRST_TICK_FRAME + index * TICK_SPACING_FRAMES,
        ...CYCLONE_WALTZ_HIT,
        ...(index === TICK_COUNT - 1 ? { triggers: [castSkill({ target: finishSkillId })] } : {}),
      }),
    ),
    hit(TICK_COUNT, {
      frame: SWAP_FRAME,
      ...NO_DAMAGE,
      conditions: [{ buffId: STATUS.phantomUmbrella, op: "gte", stacks: 1 }],
      triggers: [applyBuff({ target: STATUS.phantomUmbrella })],
    }),
    hit(TICK_COUNT + 1, {
      frame: FIRST_TICK_FRAME,
      ...NO_DAMAGE,
      triggers: [applyBuff({ target: STATUS.cycloneAwareness })],
    }),
  ]
}

export function cycloneWaltzSpin(
  spec: Pick<Skill, "id" | "name" | "castTag" | "castFrames" | "breakdownName"> & {
    finishSkillId: string
  },
): Skill {
  return defineSkill({
    id: spec.id,
    classId: "bamboocutDust",
    name: spec.name,
    ...(spec.breakdownName ? { breakdownName: spec.breakdownName } : {}),
    tags: [WEAPON.umbrella, ATTUNE.everspringSpecial],
    skillType: "weapon",
    weaponOrAttribute: "Umbrella",
    attributeAttack: "Bamboocut",
    castTag: spec.castTag,
    receives: EVERSPRING_UMBRELLA_RECEIVES,
    castFrames: spec.castFrames,
    triggerable: false,
    reachMeters: 5,
    approach: "stationary",
    hits: cycloneWaltzSpinHits(spec.finishSkillId),
    createdAt: "2026-10-12T00:00:00.000Z",
    updatedAt: "2026-10-12T00:00:00.000Z",
  })
}

// In-game values as of 2026-10-13: nine ticks every 0.3 s from frame 42, then
// two finishes — the first on the last tick's frame, the second 18 frames
// later (11 hits in a full spin). An own Phantom Umbrella is re-created at
// frame 27 (15 f + 0.2 s).
export const cycloneWaltz = cycloneWaltzSpin({
  id: SKILL.cycloneWaltz,
  name: "Cyclone Waltz",
  castTag: CAST.dustCycloneWaltz,
  castFrames: 237,
  finishSkillId: SKILL.cycloneWaltzFinish,
})
