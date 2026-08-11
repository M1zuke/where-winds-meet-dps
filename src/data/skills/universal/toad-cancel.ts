import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const toadCancel = defineSkill({
  id: SKILL.toadCancel,
  classId: "universal",
  name: "Toad[Cancel]",
  tags: [MYSTIC.areaDebuff],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.toadCancel,
  castFrames: 72,
  triggerable: true,
  hits: [
    hit(0, { frame: 0, physMultiplier: 1.89185, attributeMultiplier: 2.8378, physFixed: 255.5, attributeFixed: 0 }),
    hit(1, {
      frame: 36,
      physMultiplier: 1.89185,
      attributeMultiplier: 2.8378,
      physFixed: 255.5,
      attributeFixed: 0,
      triggers: [applyDebuff({ id: "tg-toad-cancel-triggered", target: DEBUFF.toadPoison })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
