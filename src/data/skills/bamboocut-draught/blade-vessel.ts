import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { BLADE_VESSEL_NOT_REPLACED } from "./empowered-light-attack"
import {
  CLASS_RECEIVES,
  MISTWILLOW_HEAVY_ATTACK_RECEIVES,
  RIVEN_TWINBLADES_RECEIVES,
} from "./receives"
import { enduranceMeter } from "../../resources/enduranceMeter"
import { LEVEL_ROWS } from "./levelRows"

const RAPID_SLASH = {
  ...levelScaled(LEVEL_ROWS.bladeVesselHit1),
}

// Riven Twinblades' Heavy Attack and its held Charged Skill outside Tipsy
// (in-game values as of 2026-09-24). The press lands at 22 f; the
// hold drains Endurance from 12 f later (0.2 s), 15/s for up to 1.6 s
// (3 per 0.2 s). The rapid-slash loop is a 27.96 f pass whose two slashes
// land 10.0 f and 24.2 f into it, so over the 96 f hold the seven slashes
// alternate 14.2 and 13.8 f apart from 44 f (in-game values as of 2026-11-10).
// The finishing two-hit slash plays into the drain's own end, its two hits
// 15 f and 37 f into that slash.
export const bladeVessel = defineSkill({
  id: SKILL.bladeVessel,
  classId: "bamboocutDraught",
  name: "Twinblade Heavy Attack (outside Tipsy)",
  breakdownName: "Blade Vessel",
  tags: [WEAPON.twinBlades, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.bladeVessel,
  receives: [
    ...CLASS_RECEIVES,
    ...RIVEN_TWINBLADES_RECEIVES,
    BUFF.nonPlayerBaseDamage50,
    ...MISTWILLOW_HEAVY_ATTACK_RECEIVES,
  ],
  castConditions: BLADE_VESSEL_NOT_REPLACED,
  triggerable: false,
  castFrames: 205,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range, shared with the sibling
  // Boundvessel hold.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  meterDrains: [{ meterId: enduranceMeter.id, perSecond: 15, fromFrame: 34, stopAfterSec: 1.6 }],
  hits: [
    hit(0, {
      frame: 22,
      ...levelScaled(LEVEL_ROWS.lightAttackHit0),
    }),
    hit(1, { frame: 44, ...RAPID_SLASH }),
    hit(2, { frame: 58, ...RAPID_SLASH }),
    hit(3, { frame: 72, ...RAPID_SLASH }),
    hit(4, { frame: 86, ...RAPID_SLASH }),
    hit(5, { frame: 100, ...RAPID_SLASH }),
    hit(6, { frame: 114, ...RAPID_SLASH }),
    hit(7, { frame: 128, ...RAPID_SLASH }),
    hit(8, {
      frame: 145,
      ...levelScaled(LEVEL_ROWS.boundvesselHit15),
    }),
    hit(9, {
      frame: 167,
      ...levelScaled(LEVEL_ROWS.bladeVesselHit9),
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
