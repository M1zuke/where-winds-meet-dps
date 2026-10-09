import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"

export const delay = defineSkill({
  id: SKILL.delay,
  classId: "universal",
  name: "Delay",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.delay,
  startLatency: "none",
  castFrames: 6,
  triggerable: true,
  // A wait, not a real in-game cast — a large reach keeps this stationary
  // step from capping the live distance.
  reachMeters: 100,
  approach: "stationary",
  hits: [hit(0, { frame: 0, physMultiplier: 0, attributeMultiplier: 0, physFixed: 0, attributeFixed: 0 })],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
