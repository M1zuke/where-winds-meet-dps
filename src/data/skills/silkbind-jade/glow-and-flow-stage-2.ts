import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"
import { enduranceCost } from "../../resources/enduranceMeter"
import type { MeterDrain } from "../../../engine/skill"
import { enduranceMeter } from "../../resources/enduranceMeter"

// In-game values as of 2026-09-24: -14/s while charging, held to this
// stage's own 0.63 s threshold.
const GLOW_AND_FLOW_CHARGE_DRAIN: MeterDrain[] = [
  { meterId: enduranceMeter.id, perSecond: 14, fromFrame: 18, stopAfterSec: 0.63 },
]

// Held to the 0.63 s threshold before releasing, trading the extra charge
// drain and a longer dash for the doubled ratio. In-game values as of
// 2026-09-24.
export const glowAndFlowStage2 = defineSkill({
  id: SKILL.glowAndFlowStage2,
  classId: "silkbindJade",
  name: "Glow & Flow (Stage 2)",
  breakdownName: "Glow & Flow",
  tags: [PROP.isCharged, WEAPON.fan, ATTACK.heavy, ATTUNE.fanCharged],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.glowAndFlowStage2,
  receives: [...INKWELL_FAN_RECEIVES],
  meterCosts: [enduranceCost(10)],
  meterDrains: GLOW_AND_FLOW_CHARGE_DRAIN,
  castFrames: 108,
  triggerable: true,
  // In-game values as of 2026-09-28: 3 m approach reach (the cast is Heavy
  // Attack 20301005).
  reachMeters: 3,
  // In-game values as of 2026-09-24: a 9 m forward dash, set at the release.
  displacement: { kind: "selfForward", meters: 9 },
  hits: [
    hit(0, {
      // Hit frames with only a window: authored at the release clip's own
      // floor, both strikes landing together (this class's own evidence).
      frame: 56,
      physMultiplier: 1.22479,
      attributeMultiplier: 1.837185,
      physFixed: 339,
      attributeFixed: 184.5,
    }),
    hit(1, {
      frame: 56,
      physMultiplier: 1.22479,
      attributeMultiplier: 1.837185,
      physFixed: 339,
      attributeFixed: 184.5,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
