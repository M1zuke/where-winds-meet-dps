import { defineSkill, dotTicks } from "../define"
import { ATTUNE, CAST, ROLE, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const bleedTick = defineSkill({
  id: SKILL.bleedTick,
  classId: "bellstrikeUmbra",
  name: "Bleed Tick",
  tags: [WEAPON.sword, ATTUNE.bleed, ROLE.bleedTick],
  skillType: "sustain",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.bleedTick,
  elevatedAttributeMultiplier: false,
  castFrames: 0,
  triggerable: true,
  hits: dotTicks({
    count: 10,
    everyFrames: 60,
    physMultiplier: 0.06864,
    attributeMultiplier: 0.10296,
    physFixed: 0,
    attributeFixed: 0,
  }),
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
