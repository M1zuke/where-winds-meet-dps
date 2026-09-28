import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { HEAVENQUAKER_SPEAR_RECEIVES } from "./receives"
import { DRIFTING_THRUST_DRAIN, DRIFTING_THRUST_FREEZE } from "./buffs/driftingThrustEndurance"

const DRILL_HIT = {
  physMultiplier: 0.3314827,
  attributeMultiplier: 0.497224,
  physFixed: 91.69,
  attributeFixed: 49.979,
}
// In-game values as of 2026-09-24: the 15 drill hits' frames from the
// release, then the finisher.
const DRILL_FRAMES = [5, 14, 23, 32, 41, 51, 61, 71, 81, 92, 101, 112, 123, 132, 142]

export const spearheavy = defineSkill({
  id: SKILL.spearheavy,
  classId: "bellstrikeUmbra",
  name: "SpearHeavy",
  breakdownName: "Drifting Thrust",
  // Not a Heavy Attack for Mistwillow, and stage 2 gets no Charged attunement:
  // in-game values as of 2026-09-24.
  tags: [WEAPON.spear],
  skillType: "weapon",
  weaponOrAttribute: "Spear",
  attributeAttack: "Bellstrike",
  castTag: CAST.spearHeavy,
  triggersBuffs: [BUFF.soulShaken],
  receives: HEAVENQUAKER_SPEAR_RECEIVES,
  meterDrains: DRIFTING_THRUST_DRAIN,
  meterFreezes: DRIFTING_THRUST_FREEZE,
  // Covers the real hit layout below; the charge hold itself is untimed here.
  castFrames: 156,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1.75 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  // Stage 2 (holding to the 1.6 s charge cap): 0.995 of the full-charge
  // coefficient — in-game values as of 2026-09-24.
  hits: [
    ...DRILL_FRAMES.map((frame, index) => hit(index, { frame, ...DRILL_HIT })),
    hit(DRILL_FRAMES.length, {
      frame: 155,
      physMultiplier: 1.250878,
      attributeMultiplier: 1.876317,
      physFixed: 346,
      attributeFixed: 188.6,
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-09-24T00:00:00.000Z",
})
