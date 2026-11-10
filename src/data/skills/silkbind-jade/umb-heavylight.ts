import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { ATTACK, ATTUNE, CAST, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

// Colorful Phoenix's own share of the cast total — the heavy attack's first
// stage is a separate, non-attuned share (`umb-heavylight-heavyshare.ts`).
// In-game values as of 2026-10-05.
const HIT_SHARE = 0.33
const CAST_TOTAL = {
  physMultiplier: 1.1604,
  attributeMultiplier: 1.1604 * 1.5,
  physFixed: 322,
  attributeFixed: 175,
}

const COEFFICIENTS = {
  physMultiplier: CAST_TOTAL.physMultiplier * HIT_SHARE,
  attributeMultiplier: CAST_TOTAL.attributeMultiplier * HIT_SHARE,
  physFixed: CAST_TOTAL.physFixed * HIT_SHARE,
  attributeFixed: CAST_TOTAL.attributeFixed * HIT_SHARE,
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
  // In-game values as of 2026-11-10, from the heavy press: the heavy tap's hit
  // lands at 20.79 f and hands over to Colorful Phoenix at 41.95 f, whose hits land
  // 19.51, 26.65 and 49.52 f into its own clip and whose recovery ends at 72 f.
  castFrames: 113.95,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1.75 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      frame: 20.79,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [castSkill({ target: SKILL.umbHeavylightHeavyShare })],
    }),
    hit(1, { frame: 61.46, ...COEFFICIENTS }),
    hit(2, { frame: 68.6, ...COEFFICIENTS }),
    hit(3, { frame: 91.47, ...COEFFICIENTS }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-11-10T00:00:00.000Z",
})
