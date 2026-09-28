import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"

export const blockperception = defineSkill({
  id: SKILL.blockperception,
  classId: "stonesplitStrength",
  name: "BlockPerception",
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "Stonesplit",
  castTag: CAST.blockPerception,
  castFrames: 15,
  triggerable: true,
  // In-game values as of 2026-09-28: a defensive stance, not independently
  // confirmed against reach — both segments carry a further 1 m
  // shrink-only pull once in range.
  displacement: { kind: "towardTarget", referenceMeters: 1 },
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
