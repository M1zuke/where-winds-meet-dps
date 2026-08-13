import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDot } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const swordq = defineSkill({
  id: SKILL.swordq,
  classId: "bellstrikeUmbra",
  name: "Sword Martial Q",
  breakdownName: "Inner Track Slash",
  tags: [WEAPON.sword, ATTUNE.swordQ],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordMartialQ,
  castFrames: 30,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.5441,
      attributeMultiplier: 0.8161,
      physFixed: 150,
      attributeFixed: 82,
      triggers: [applyDot({ id: "tg-swordq-bleed", target: DEBUFF.bleedTick })],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
