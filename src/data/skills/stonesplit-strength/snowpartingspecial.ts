import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, STATUS } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"
import {
  bladeMomentumMeter,
  bladeMomentumRequires,
} from "../../classes/stonesplit-strength/bladeMomentumMeter"
import { LEVEL_ROWS } from "./levelRows"

const SHARE_HIT = {
  ...levelScaled(LEVEL_ROWS.snowpartingspecialHit0),
}

// In-game values as of 2026-10-15.
const SHARE_HIT_FRAMES = [51, 73, 79, 85, 91, 109, 113, 117]
const DREAD_SHARE_HIT_FRAME = 117
const FINAL_HIT_FRAME = 121
const dreadApplication = applyBuff({ target: STATUS.dread })

export const snowpartingspecial = defineSkill({
  id: SKILL.snowpartingspecial,
  classId: "stonesplitStrength",
  name: "SnowpartingSpecial",
  tags: [WEAPON.hengBlade],
  skillType: "weapon",
  weaponOrAttribute: "Hengdao",
  attributeAttack: "Stonesplit",
  castTag: CAST.snowpartingSpecial,
  receives: SNOWPARTING_BLADE_RECEIVES,
  triggersBuffs: [BUFF.innerPassion],
  // In-game values as of 2026-09-25: needs 50, but only 5 is actually spent.
  castConditions: [bladeMomentumRequires("gte", 50)],
  meterCosts: [{ meterId: bladeMomentumMeter.id, amount: 5 }],
  castFrames: 124,
  triggerable: true,
  // In-game values as of 2026-09-28: 6 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 6,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    ...SHARE_HIT_FRAMES.map((frame, index) =>
      hit(index, {
        frame,
        ...SHARE_HIT,
        ...(frame === DREAD_SHARE_HIT_FRAME ? { triggers: [dreadApplication] } : {}),
      }),
    ),
    hit(SHARE_HIT_FRAMES.length, {
      frame: FINAL_HIT_FRAME,
      ...levelScaled(LEVEL_ROWS.snowpartingspecialHit8),
      triggers: [dreadApplication],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-10-15T00:00:00.000Z",
})
