import { defineSkill, hit } from "../define"
import { applyDebuff } from "../triggers"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const poetFinalHitCancel = defineSkill({
  id: SKILL.poetFinalHitCancel,
  classId: "universal",
  name: "Poet Final Hit[Cancel]",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.poetFinalHitCancel,
  castFrames: 47,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.7063,
      attributeMultiplier: 2.55945,
      physFixed: 315,
      attributeFixed: 0,
      triggers: [
        applyDebuff({
          id: "tg-poet-final-hit-cancel-combustion-ext",
          target: DEBUFF.combustion,
          stacks: 0,
          extendFrames: 90,
          extendOnly: true,
        }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
