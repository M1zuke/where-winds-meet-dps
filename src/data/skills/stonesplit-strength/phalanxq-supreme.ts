import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { PHALANXBANE_BLADE_RECEIVES } from "./receives"

// In-game values as of 2026-09-24: reachable only after holding Soul Burning
// for at least 179.76 f before releasing — the same combo-hold-duration gate
// docs/TIMELINE.md § "Meters" authors as the earliest release of the named
// stage, here the enhanced release rather than the plain one.
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
  triggersBuffs: [BUFF.throatPierced, BUFF.totalAnnihilationSupremeShield],
  // In-game values as of 2026-09-24: the shield is granted 42 f in, not at
  // the cast's own start.
  triggersBuffsAtFrame: { [BUFF.totalAnnihilationSupremeShield]: 42 },
  castFrames: 49,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
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
  updatedAt: "2026-09-29T00:00:00.000Z",
})
