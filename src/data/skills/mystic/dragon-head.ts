import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { MYSTIC_ARTS_CLASS_ID } from "../../../engine/skill"
import { CAST, MYSTIC, ROLE } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

// Fixed damage — triggers neither crit, affinity nor abrasion (CN mystic-arts
// guide, gc.com.cn, checked 2026-08). Cast timing is user-verified 2026-08-06:
// a 246-frame cast landing its hit on the final frame.
export const dragonHead = defineSkill({
  id: SKILL.dragonHead,
  classId: MYSTIC_ARTS_CLASS_ID,
  name: "Dragon Head",
  tags: [MYSTIC.burst, ROLE.dragonHead],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.dragonHead,
  // In-game, the low-HP bonus covers this and the Plus variant alike, 2026-09-10.
  receives: [BUFF.surgingWaves, BUFF.dragonHeadLowHp],
  guaranteedNormal: true,
  castFrames: 246,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 246,
      physMultiplier: 24.77213,
      attributeMultiplier: 37.158195,
      physFixed: 3726.46,
      attributeFixed: 0,
    }),
  ],
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
})
