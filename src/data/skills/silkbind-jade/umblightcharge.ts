import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// The authored value is the whole cast spread over its hits, not a per-hit
// value — the reference def states it per hit. Kept as total ÷ hits so the
// number the source actually carries stays legible.
const CAST_HITS = 6
// In-game values as of 2026-09-24 (level 100).
const CAST_TOTAL = {
  physMultiplier: 1.7173,
  attributeMultiplier: 2.576,
  physFixed: 79.16 * CAST_HITS,
  attributeFixed: 43.16 * CAST_HITS,
}

const COEFFICIENTS = {
  physMultiplier: CAST_TOTAL.physMultiplier / CAST_HITS,
  attributeMultiplier: CAST_TOTAL.attributeMultiplier / CAST_HITS,
  physFixed: CAST_TOTAL.physFixed / CAST_HITS,
  attributeFixed: CAST_TOTAL.attributeFixed / CAST_HITS,
  extraCritDamage: 1,
}

export const umblightcharge = defineSkill({
  id: SKILL.umblightcharge,
  classId: "silkbindJade",
  name: "UmbLightCharge",
  tags: [
    PROP.isCharged,
    PROP.hasQiBreakPhysPen,
    WEAPON.umbrella,
    ATTACK.light,
    ATTUNE.umbFrequentProjectile,
    ROLE.umbLightCharge,
  ],
  skillType: "sustain",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbLightCharge,
  receives: [
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
    BUFF.combo,
    BUFF.comboSpringAwayBonus,
    BUFF.windWall,
    BUFF.pursuitChargedBoost,
    BUFF.trajectorySkill,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.nonPlayerBaseDamage125,
    ...VERNAL_UMBRELLA_RECEIVES,
  ],
  castFrames: 147,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1.75 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, { frame: 0, ...COEFFICIENTS }),
    hit(1, { frame: 10, ...COEFFICIENTS }),
    hit(2, {
      frame: 20,
      ...COEFFICIENTS,
      triggers: [castSkill({ target: SKILL.umblightchargeLift })],
    }),
    hit(3, { frame: 30, ...COEFFICIENTS }),
    hit(4, { frame: 40, ...COEFFICIENTS }),
    hit(5, { frame: 50, ...COEFFICIENTS }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
