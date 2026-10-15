import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"
import { enduranceCost } from "../../resources/enduranceMeter"

// Inkwell Fan's heavy-attack charged skill, released below the 0.63 s
// threshold — the earliest release of the stage-1 dash
// (docs/TIMELINE.md § "Meters"). In-game values as of 2026-09-24.
export const glowAndFlowStage1 = defineSkill({
  id: SKILL.glowAndFlowStage1,
  classId: "silkbindJade",
  name: "Glow & Flow (Stage 1)",
  breakdownName: "Glow & Flow",
  tags: [PROP.isCharged, WEAPON.fan, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.glowAndFlowStage1,
  receives: [...INKWELL_FAN_RECEIVES],
  // In-game values as of 2026-09-24: -10 on entering the charge.
  meterCosts: [enduranceCost(10)],
  castFrames: 70,
  triggerable: true,
  // In-game values as of 2026-09-28: 3 m approach reach (the cast is its
  // Heavy Attack).
  reachMeters: 3,
  // In-game values as of 2026-09-24: a 4.5 m forward dash, set at the
  // release.
  displacement: { kind: "selfForward", meters: 4.5 },
  hits: [
    hit(0, {
      // Hit frames with only a window (this class's own evidence): neither
      // of the dash's two strikes has a known frame of its own, only the
      // window they land in from the release — authored at that window's
      // start, both landing together.
      frame: 18,
      physMultiplier: 0.612395,
      attributeMultiplier: 0.918593,
      physFixed: 169.5,
      attributeFixed: 92.25,
    }),
    hit(1, {
      frame: 18,
      physMultiplier: 0.612395,
      attributeMultiplier: 0.918593,
      physFixed: 169.5,
      attributeFixed: 92.25,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
