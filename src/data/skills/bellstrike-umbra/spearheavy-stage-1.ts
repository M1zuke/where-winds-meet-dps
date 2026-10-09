import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"
import { DRIFTING_THRUST_STAGE_1_DRAIN, DRIFTING_THRUST_FREEZE } from "./buffs/driftingThrustEndurance"

const DRILL_HIT = {
  physMultiplier: 0.3752634,
  attributeMultiplier: 0.5628951,
  physFixed: 103.8,
  attributeFixed: 56.58,
}
// In-game values as of 2026-09-24: the 8 drill hits' frames from the
// release, folded onto the 30 f minimum press-to-release hold for this
// stage, then the finisher.
const DRILL_FRAMES = [35, 44, 53, 62, 71, 81, 91, 101]

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
  castFrames: 120,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1.75 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  // 0.60 of the full-charge coefficient — in-game values as of 2026-09-24.
  hits: [
    ...DRILL_FRAMES.map((frame, index) => hit(index, { frame, ...DRILL_HIT })),
    hit(DRILL_FRAMES.length, {
      frame: 117,
      physMultiplier: 0.7505268,
      attributeMultiplier: 1.1257902,
      physFixed: 207.6,
      attributeFixed: 113.16,
    }),
  ],
  createdAt: "2026-09-24T00:00:00.000Z",
  updatedAt: "2026-09-24T00:00:00.000Z",
})
