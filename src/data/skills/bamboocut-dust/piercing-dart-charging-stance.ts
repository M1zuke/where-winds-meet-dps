import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"

// In-game values as of 2026-10-12.
export const piercingDartChargingStance = defineSkill({
  id: SKILL.piercingDartChargingStance,
  classId: "bamboocutDust",
  name: "Piercing Dart - Charging Stance",
  tags: [WEAPON.ropeDart],
  skillType: "weapon",
  weaponOrAttribute: "Rope Dart",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustPiercingDartChargingStance,
  castFrames: 33,
  triggerable: false,
  hits: [
    hit(0, {
      frame: 24,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [applyBuff({ target: STATUS.piercingDartReady })],
    }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
