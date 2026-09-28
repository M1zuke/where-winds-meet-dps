import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, castSkill } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"

export const snowpartingqStab = defineSkill({
  id: SKILL.snowpartingqStab,
  classId: "stonesplitStrength",
  name: "SnowpartingQ-Stab",
  tags: [WEAPON.hengBlade, ATTUNE.snowpartingQ, PROP.cleftpeakBoost, ROLE.snowpartingQStab],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingQStab,
  receives: [BUFF.cleftpeakDeflect, ...SNOWPARTING_BLADE_RECEIVES],
  triggersBuffs: [BUFF.throatPierced],
  // Cast length to the earliest next input (in-game animation, 2026-09-24).
  castFrames: 69,
  triggerable: true,
  // In-game values as of 2026-09-28: 4.5 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 4.5,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  // The strike splits 0.4 / 0.6 across two colliders (in-game animation,
  // 2026-09-24).
  hits: [
    hit(0, {
      frame: 14,
      physMultiplier: 0.85296,
      attributeMultiplier: 1.27944,
      physFixed: 236,
      attributeFixed: 128.8,
    }),
    hit(1, {
      frame: 48,
      physMultiplier: 1.27944,
      attributeMultiplier: 1.91916,
      physFixed: 354,
      attributeFixed: 193.2,
      triggers: [
        castSkill({
          target: SKILL.anxisoldierhengStab,
          stacks: 0,
          condition: { buffId: BUFF.ironGuards, op: "gte", stacks: 1, source: "buffEngine" },
        }),
        applyBuff({
          target: STATUS.dread,
          stacks: 0,
          extendFrames: 120,
          extendOnly: true,
        }),
        applyBuff({ target: STATUS.fearfulBlade }),
      ],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-07-19T00:00:00.000Z",
})
