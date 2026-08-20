import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

// Forsaken Fame (verbatim, 2026-08-19 in-game capture):
//
//   "Forsaken Fame
//    After a brief charge, swing forward to create a whirlwind, dealing
//    moderate damage.
//    Hits humanoid enemies, briefly putting them Airborne. Hits non-player
//    enemies, applying Lingering Bone, dealing an extra 45% damage, and
//    restoring 10 Endurance. Only restores Endurance once when hitting
//    multiple units."
//
// Per-hit values from the Light Attack Charged Skill Damage block (verbatim,
// 2026-08-19 in-game capture): 190.44% / 285.66% phys/attr coeff + 527 / 287
// phys/attr fixed. The pre-existing 1.9039 / 2.8558 / 440 / 246 values were
// very close on the coeff pair (likely from an earlier transcription pass)
// but off on the fixed pair — the verbatim fixed values win.
//
// TODO(onHit-class-mechanic): the "+45% bonus damage on non-player enemies"
// clause, the "briefly puts humanoid enemies Airborne" clause, and the "+10
// Endurance restore (once per cast)" clause all fire on hit. None has an
// engine-side counterpart today:
//   - +45% non-player bonus is best modeled as a class buff (mirrors how
//     Moon Shatter Spring's "+45% on non-player" rides on Startling Spring).
//   - Airborne is a target-state change (`TargetView.airborne: boolean`
//     exists per state_snapshot but is passive state, not a `setStatus`
//     emitter). Encoding the "briefly puts airborne" requires either a new
//     airborne status effect + skill-level `setStatus` trigger, or a new
//     engine hook that toggles `target.airborne` on hit.
//   - Endurance restore has no engine surface today (only `lowEndurance`
//     boolean lives in `engine/types.ts`; Endurance itself isn't a tracked
//     resource). Per the in-game-text-verbatim feedback memory, the +10
//     Endurance value is captured here for the next time the engine grows
//     an Endurance resource lane.
//
// Lingering Bone application IS encoded — it follows the `spring-sorrow.ts`
// precedent (skill-level `triggersBuffs: [BUFF.lingeringBone]`).
export const fanLightCharged = defineSkill({
  id: SKILL.fanLightCharged,
  classId: "silkbindJade",
  name: "Forsaken Fame",
  abilityTag: "Forsaken Fame",
  breakdownName: "FanLightCharged",
  tags: [PROP.isCharged, WEAPON.fan, ATTUNE.fanCharged],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanLightCharged,
  castFrames: 75,
  triggerable: true,
  // Forsaken Fame tooltip: "Hits non-player enemies, applying Lingering Bone"
  triggersBuffs: [BUFF.lingeringBone],
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.9044,
      attributeMultiplier: 2.8566,
      physFixed: 527,
      attributeFixed: 287,
      extraCritDamage: 1,
      triggers: [],
    }),
  ],
  createdAt: "2026-07-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
})
