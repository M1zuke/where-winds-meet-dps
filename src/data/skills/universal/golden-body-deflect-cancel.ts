import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const goldenBodyDeflectCancel = defineSkill({
  id: SKILL.goldenBodyDeflectCancel,
  classId: "universal",
  name: "Golden Body + Deflect Cancel",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.goldenBodyDeflectCancel,
  triggersBuffs: [BUFF.rainwhisperShield],
  castFrames: 22,
  triggerable: true,
  hits: [hit(0, { frame: 0, physMultiplier: 0, attributeMultiplier: 0, physFixed: 0, attributeFixed: 0 })],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
