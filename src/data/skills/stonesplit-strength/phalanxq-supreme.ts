import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { PHALANXBANE_BLADE_RECEIVES } from "./receives"

// In-game values as of 2026-10-15: Supreme is offered once Soul Burning has run
// 179.76 f, so that hold is the earliest lead. The strike lands 14.36 f and the
// cast, with its shield, ends 42 f after Total Annihilation starts.
export const phalanxqSupreme = defineSkill({
  id: SKILL.phalanxqSupreme,
  classId: "stonesplitStrength",
  name: "PhalanxQ (Supreme)",
  breakdownName: "Total Annihilation - Supreme",
  tags: [WEAPON.moBlade, ATTUNE.phalanxbaneQ, PROP.cleftpeakBoost, ROLE.phalanxQ],
  skillType: "weapon",
  weaponOrAttribute: "Modao",
  attributeAttack: "Stonesplit",
  castTag: CAST.phalanxQSupreme,
  receives: [BUFF.cleftpeakDeflect, ...PHALANXBANE_BLADE_RECEIVES],
  triggersBuffs: [BUFF.throatPierced, BUFF.totalAnnihilationSupremeShield, BUFF.jadeware],
  triggersBuffsAtFrame: { [BUFF.totalAnnihilationSupremeShield]: 222, [BUFF.jadeware]: 180 },
  castFrames: 222,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 194,
      physMultiplier: 3.5256,
      attributeMultiplier: 5.2884,
      physFixed: 975,
      attributeFixed: 532,
      triggers: [
        castSkill({
          target: SKILL.anxisoldiermosweepSupreme,
          stacks: 0,
          condition: { buffId: BUFF.ironGuards, op: "gte", stacks: 1, source: "buffEngine" },
        }),
      ],
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
