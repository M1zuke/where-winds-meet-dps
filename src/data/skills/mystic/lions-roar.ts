import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { DEBUFF, SKILL } from "./ids"

// In-game values as of 2026-09-24, level 71: power 3.60865, flat 543.2. The
// roar's 14 hits double their ratio against a target already carrying Toad
// Venom (0.07 -> 0.105), authored as a hit variant rather than a second
// skill. The roar also applies a silence/control debuff with no damage read
// of its own, so it changes nothing on a dummy and is not modelled.
const POWER = 3.60865
const FLAT = 543.2
const BELL_RATIO = 0.2
const ROAR_RATIO = 0.07
const ROAR_VENOM_RATIO = 0.105

// Frame 78 is where the bell's own animation hands off to the roar's — every
// roar hit's frame below is that branch point plus the roar's own local
// frame.
const ROAR_BRANCH_FRAME = 78
const ROAR_LOCAL_FRAMES = [
  18.8, 25.6, 32.4, 38.8, 45.4, 52.4, 59.2, 66.0, 72.8, 79.6, 86.4, 93.2, 100.0, 106.8,
]

const row = (ratio: number) => ({
  physMultiplier: POWER * ratio,
  attributeMultiplier: POWER * ratio * 1.5,
  physFixed: FLAT * ratio,
  attributeFixed: 0,
})

const VENOM_CONDITION = [{ buffId: DEBUFF.toadPoison, op: "gte" as const, stacks: 1 }]

const roarHit = (index: number, localFrame: number) =>
  hit(index, {
    frame: Math.round(ROAR_BRANCH_FRAME + localFrame),
    ...row(ROAR_RATIO),
    variants: [
      {
        id: `hv-lions-roar-venom-${index}`,
        label: "Toad Venom",
        conditions: VENOM_CONDITION,
        ...row(ROAR_VENOM_RATIO),
      },
    ],
  })

// Neither animation has an earlier input window; the recovery starts 164.9 f
// into the roar, which begins 78 f into the bell: 78 + 164.9 = 242.9.
const CAST_FRAMES = 243

export const lionsRoar = defineSkill({
  id: SKILL.lionsRoar,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Lion's Roar",
  tags: [MYSTIC.areaDebuff],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.lionsRoar,
  castFrames: CAST_FRAMES,
  triggerable: true,
  // In-game values as of 2026-09-24: a stationary cast, 20 m engagement range.
  reachMeters: 20,
  approach: "stationary",
  hits: [
    hit(0, { frame: 25, ...row(BELL_RATIO) }),
    ...ROAR_LOCAL_FRAMES.map((localFrame, roarIndex) => roarHit(roarIndex + 1, localFrame)),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
