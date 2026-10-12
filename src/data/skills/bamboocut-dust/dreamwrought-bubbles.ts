import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, castSkill } from "../../../definitions/skills/triggers"
import type { HitTrigger } from "../../../engine/skill"
import { enduranceMeter } from "../../resources/enduranceMeter"
import { BUFF, PARAM } from "../buffs/ids"
import { ATTACK, CAST, PROP, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
import { EVERSPRING_UMBRELLA_RECEIVES } from "./receives"

export const DREAMWROUGHT_OUT_HIT = {
  physMultiplier: 1.00728,
  attributeMultiplier: 1.51092,
  physFixed: 279,
  attributeFixed: 151.8,
}

export const DREAMWROUGHT_BACK_HIT = {
  physMultiplier: 0.67152,
  attributeMultiplier: 1.00728,
  physFixed: 186,
  attributeFixed: 101.2,
}

export const DREAMWROUGHT_TAGS = [WEAPON.umbrella, ATTACK.charge, PROP.isCharged]

export const DREAMWROUGHT_RECEIVES = [
  BUFF.battleAnthemChargedDamage,
  BUFF.battleAnthemEnduranceBoost,
  BUFF.nonPlayerBaseDamage20,
  ...EVERSPRING_UMBRELLA_RECEIVES,
]

export function dreamwroughtPhantomTriggers(): HitTrigger[] {
  return [
    applyBuff({ target: STATUS.phantomUmbrella }),
    castSkill({
      target: SKILL.resonanceDreamwrought,
      conditions: [{ buffId: STATUS.phantomUmbrella, op: "gte", stacks: 1 }],
      requiresParam: PARAM.phantomRally,
    }),
  ]
}

const HOLD_FRAMES = 44
const RELEASE_FRAMES = 72

// In-game values as of 2026-10-12: the charge starts 0.24 s after the press and
// runs 0.5 s, 5 Endurance per second. The hit frames are not measurable: the
// out hit sits at the far point of the throw, 48 frames after the release, and
// the back hit one frame later — provisional frames, bounded by the cast.
export const dreamwroughtBubbles = defineSkill({
  id: SKILL.dreamwroughtBubbles,
  classId: "bamboocutDust",
  name: "Dreamwrought Bubbles",
  tags: DREAMWROUGHT_TAGS,
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustDreamwroughtBubbles,
  receives: DREAMWROUGHT_RECEIVES,
  meterDrains: [{ meterId: enduranceMeter.id, perSecond: 5, fromFrame: 14, stopAfterSec: 0.5 }],
  castFrames: HOLD_FRAMES + RELEASE_FRAMES,
  triggerable: false,
  hits: [
    hit(0, {
      frame: HOLD_FRAMES + 48,
      ...DREAMWROUGHT_OUT_HIT,
      triggers: dreamwroughtPhantomTriggers(),
    }),
    hit(1, { frame: HOLD_FRAMES + 49, ...DREAMWROUGHT_BACK_HIT }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
