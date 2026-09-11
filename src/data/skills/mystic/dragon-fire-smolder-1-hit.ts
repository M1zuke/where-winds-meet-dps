import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const dragonFireSmolder1Hit = defineSkill({
  id: SKILL.dragonFireSmolder1Hit,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Dragon's Breath: Smolder 1 Hit",
  breakdownName: "Dragon's Breath",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonSBreathSmolder1Hit,
  // Hit frame: in-game animation, 2026-09-09. castFrames is not margin-derived — it stays
  // 40 only because the hit landing at 36 keeps it legal; do not "correct" it to match the
  // margin the other cut forms carry.
  castFrames: 40,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 36,
      physMultiplier: 1.36064,
      attributeMultiplier: 2.04096,
      physFixed: 205.5,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.smolder, extendFrames: 240 })],
    }),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
