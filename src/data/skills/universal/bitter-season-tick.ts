import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, SOURCE } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

// `weaponOrAttribute` is empty on purpose: an inner-way proc is not a martial
// art, so it takes no weapon, all-martial or mystic boost.
export const bitterSeasonTick = defineSkill({
  id: SKILL.bitterSeasonTick,
  classId: "universal",
  name: "Bitter Season Tick",
  tags: [SOURCE.innerWayDot],
  skillType: "sustain",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.bitterSeasonTick,
  receives: [BUFF.soulShaken],
  elevatedAttributeMultiplier: false,
  castFrames: 0,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      // In-game values as of 2026-09-24.
      physMultiplier: 0.02,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
})
