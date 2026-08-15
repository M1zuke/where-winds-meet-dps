import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const dragonFireSmolder1Hit = defineSkill({
  id: SKILL.dragonFireSmolder1Hit,
  classId: "bellstrikeUmbra",
  name: "Dragon's Breath: Smolder 1 Hit",
  breakdownName: "Dragon's Breath",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "Bellstrike",
  castTag: CAST.dragonSBreathSmolder1Hit,
  castFrames: 40,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 40,
      physMultiplier: 1.2848,
      attributeMultiplier: 1.9272,
      physFixed: 241.5,
      attributeFixed: 0,
      triggers: [applyDebuff({ target: DEBUFF.darkFire, extendFrames: 240 })],
    }),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-07-30T00:00:00.000Z",
})
