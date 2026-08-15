import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

export const goldenBodyCancel = defineSkill({
  id: SKILL.goldenBodyCancel,
  classId: "universal",
  name: "Golden Body Cancel",
  tags: [],
  skillType: "weapon",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.goldenBodyCancel,
  triggersBuffs: [BUFF.rainwhisperShield],
  castFrames: 0,
  triggerable: true,
  hits: [hit(0, { frame: 0, physMultiplier: 0, attributeMultiplier: 0, physFixed: 0, attributeFixed: 0 })],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
