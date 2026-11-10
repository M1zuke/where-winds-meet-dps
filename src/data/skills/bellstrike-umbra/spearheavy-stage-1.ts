import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"
import { DRIFTING_THRUST_STAGE_1_DRAIN, DRIFTING_THRUST_FREEZE } from "./buffs/driftingThrustEndurance"
import { LEVEL_ROWS } from "./levelRows"

const DRILL_HIT = {
  ...levelScaled(LEVEL_ROWS.spearheavyStage1Hit0),
}
// In-game values as of 2026-10-16: the 8 drill hits' frames from the
// release, folded onto the 30 f minimum press-to-release hold for this
// stage, then the finisher 14.97 f into the finishing clip, which starts
// 75.6 f after the release.
const DRILL_FRAMES = [34.5, 43.9, 53.1, 62.1, 71, 81, 90.7, 101]

export const spearheavyStage1 = defineSkill({
  id: SKILL.spearheavyStage1,
  classId: "bellstrikeUmbra",
  name: "SpearHeavy Stage 1",
  breakdownName: "Drifting Thrust",
  // Not a Heavy Attack for Mistwillow: in-game values as of 2026-09-24.
  tags: [WEAPON.spear, ATTUNE.spearCharged],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearHeavyStage1,
  triggersBuffs: [BUFF.soulShaken],
  receives: HEAVENQUAKER_SPEAR_RECEIVES,
  meterDrains: DRIFTING_THRUST_STAGE_1_DRAIN,
  meterFreezes: DRIFTING_THRUST_FREEZE,
  // The 30 f minimum hold, then the finisher's own cast length after its
  // start: in-game animation, 2026-10-15.
  castFrames: 173,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1.75 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  // 0.60 of the full-charge coefficient — in-game values as of 2026-09-24.
  hits: [
    ...DRILL_FRAMES.map((frame, index) => hit(index, { frame, ...DRILL_HIT })),
    hit(DRILL_FRAMES.length, {
      frame: 120.57,
      ...levelScaled(LEVEL_ROWS.spearheavyStage1Hit8),
    }),
  ],
  createdAt: "2026-09-24T00:00:00.000Z",
  updatedAt: "2026-10-16T00:00:00.000Z",
})
