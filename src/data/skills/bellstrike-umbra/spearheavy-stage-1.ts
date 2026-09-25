import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"

const DRILL_HIT = {
  physMultiplier: 0.3752634,
  attributeMultiplier: 0.5628951,
  physFixed: 103.8,
  attributeFixed: 56.58,
}
// In-game values as of 2026-09-24: the 8 drill hits' frames from the
// release, then the finisher.
const DRILL_FRAMES = [5, 14, 23, 32, 41, 51, 61, 71]

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
  castFrames: 90,
  triggerable: true,
  // 0.60 of the full-charge coefficient — in-game values as of 2026-09-24.
  hits: [
    ...DRILL_FRAMES.map((frame, index) => hit(index, { frame, ...DRILL_HIT })),
    hit(DRILL_FRAMES.length, {
      frame: 87,
      physMultiplier: 0.7505268,
      attributeMultiplier: 1.1257902,
      physFixed: 207.6,
      attributeFixed: 113.16,
    }),
  ],
  createdAt: "2026-09-24T00:00:00.000Z",
  updatedAt: "2026-09-24T00:00:00.000Z",
})
