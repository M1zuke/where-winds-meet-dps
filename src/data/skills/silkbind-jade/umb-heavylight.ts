import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// Colorful Phoenix's own share of the cast total — the heavy attack's first
// stage is a separate, non-attuned share (`umb-heavylight-heavyshare.ts`).
// In-game values as of 2026-09-24.
const CAST_HITS = 3
const CAST_TOTAL = {
  physMultiplier: 1.1604,
  attributeMultiplier: 1.1604 * 1.5,
  physFixed: 322,
  attributeFixed: 175,
}

const COEFFICIENTS = {
  physMultiplier: CAST_TOTAL.physMultiplier / CAST_HITS,
  attributeMultiplier: CAST_TOTAL.attributeMultiplier / CAST_HITS,
  physFixed: CAST_TOTAL.physFixed / CAST_HITS,
  attributeFixed: CAST_TOTAL.attributeFixed / CAST_HITS,
  extraCritDamage: 0,
}

export const umbHeavylight = defineSkill({
  id: SKILL.umbHeavylight,
  classId: "silkbindJade",
  name: "Umb HeavyLight",
  tags: [WEAPON.umbrella, ATTACK.mixed, ATTUNE.umbLightHeavyVariedCombo, ROLE.umbHeavyLight],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbHeavyLight,
  receives: [
    BUFF.swallowcallLightAttackBoost,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
    ...VERNAL_UMBRELLA_RECEIVES,
  ],
  // Cast length to the earliest next input (in-game animation, 2026-09-24).
  castFrames: 78,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1.75 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 6,
      ...COEFFICIENTS,
      triggers: [castSkill({ target: SKILL.umbHeavylightHeavyShare })],
    }),
    hit(1, { frame: 31, ...COEFFICIENTS }),
    hit(2, { frame: 56, ...COEFFICIENTS }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
