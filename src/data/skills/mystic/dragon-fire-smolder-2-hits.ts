import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const dragonFireSmolder2Hits = defineSkill({
  id: SKILL.dragonFireSmolder2Hits,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Dragon's Breath: Smolder 2 Hits",
  breakdownName: "Dragon's Breath",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonSBreathSmolder2Hits,
  // Hit frames: in-game animation, 2026-09-09. castFrames is not margin-derived — see
  // dragon-fire-smolder-1-hit.ts.
  castFrames: 137,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 36,
      physMultiplier: 1.40692,
      attributeMultiplier: 2.11038,
      physFixed: 212.49,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.smolder, extendFrames: 240 })],
    }),
    hit(1, {
      frame: 102,
      physMultiplier: 1.40692,
      attributeMultiplier: 2.11038,
      physFixed: 212.49,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.smolder, extendFrames: 240 })],
    }),
    hit(2, {
      frame: 108,
      physMultiplier: 1.40692,
      attributeMultiplier: 2.11038,
      physFixed: 212.49,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.smolder, extendFrames: 240 })],
    }),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
