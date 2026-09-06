import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { SKILL } from "./ids"

// The guard that ends a cancelled recovery, 26 frames for this class: the
// value that puts the logged one-minute dummy run at 59.5 s once the
// Dragonquench speed-up and the interrupt-window cancel points are in (project
// owner, 2026-09-06); the guard animation itself is unmeasured.
export const deflectCancel = defineSkill({
  id: SKILL.deflectCancel,
  classId: "bamboocutDraught",
  name: "Deflect Cancel",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "Bamboocut",
  castTag: CAST.deflectCancel,
  castFrames: 26,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
})
