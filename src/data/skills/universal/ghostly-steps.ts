import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { mirageEnduranceCostReductionGrant } from "./buffs/mirageEnduranceCostReduction"

export const ghostlySteps = defineSkill({
  id: SKILL.ghostlySteps,
  classId: "universal",
  name: "Ghostly Steps",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.ghostlySteps,
  triggersBuffs: [BUFF.mirage],
  castFrames: 0,
  triggerable: true,
  // In-game values as of 2026-09-28: not its own attack, no approach — a
  // large reach keeps this stationary cast from capping the live distance.
  reachMeters: 100,
  approach: "stationary",
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [mirageEnduranceCostReductionGrant],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
