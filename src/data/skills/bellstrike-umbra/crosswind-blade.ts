import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyDot, detonateDot } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const crosswindBlade = defineSkill({
  id: SKILL.crosswindBlade,
  classId: "bellstrikeUmbra",
  name: "Crosswind Blade",
  breakdownName: "Crisscross - Inner Balance III",
  tags: [WEAPON.sword],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.crosswindBlade,
  castFrames: 30,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 0.6,
      attributeMultiplier: 0.9,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [
        applyDot({ id: "tg-crosswind-blade-bleed", target: DEBUFF.bleedTick }),
        detonateDot({ id: "tg-crosswind-blade-detonate", target: DEBUFF.bleedTick, stacks: 0 }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
