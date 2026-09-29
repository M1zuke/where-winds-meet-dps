import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"
import { enduranceMeter } from "../../resources/enduranceMeter"

const RAPID_SLASH = {
  physMultiplier: 0.1659372,
  attributeMultiplier: 0.2489058,
  physFixed: 46.046,
  attributeFixed: 25.025,
}

// Riven Twinblades' Heavy Attack and its held Charged Skill outside Tipsy
// (in-game values as of 2026-09-24, level 100). The press lands at 22 f; the
// hold drains Endurance from 12 f later (0.2 s), 15/s for up to 1.6 s
// (3 per 0.2 s, `ChargeNode 23`); the finishing two-hit slash plays into the
// drain's own end, its two hits 15 f and 37 f into that clip. The rapid-slash
// loop's own per-hit cycle length is not in any table; seven hits (0.143 =
// 1/7 of the total) at the same 8-frame cadence the sibling Boundvessel hold
// already uses is the best-supported reading.
export const bladeVessel = defineSkill({
  id: SKILL.bladeVessel,
  classId: "bamboocutDraught",
  name: "Twinblade Heavy Attack (outside Tipsy)",
  breakdownName: "Blade Vessel",
  tags: [WEAPON.twinBlades],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.bladeVessel,
  receives: [...CLASS_RECEIVES, ...RIVEN_TWINBLADES_RECEIVES, BUFF.nonPlayerBaseDamage50],
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
      physMultiplier: 0.35636,
      attributeMultiplier: 0.53454,
      physFixed: 100,
      attributeFixed: 54,
    }),
    hit(1, { frame: 42, ...RAPID_SLASH }),
    hit(2, { frame: 50, ...RAPID_SLASH }),
    hit(3, { frame: 58, ...RAPID_SLASH }),
    hit(4, { frame: 66, ...RAPID_SLASH }),
    hit(5, { frame: 74, ...RAPID_SLASH }),
    hit(6, { frame: 82, ...RAPID_SLASH }),
    hit(7, { frame: 90, ...RAPID_SLASH }),
    hit(8, {
      frame: 145,
      physMultiplier: 0.23088,
      attributeMultiplier: 0.34632,
      physFixed: 64.4,
      attributeFixed: 34.8,
    }),
    hit(9, {
      frame: 167,
      physMultiplier: 0.34632,
      attributeMultiplier: 0.51948,
      physFixed: 96.6,
      attributeFixed: 52.2,
    }),
  ],
  createdAt: "2026-09-29T00:00:00.000Z",
  updatedAt: "2026-09-29T00:00:00.000Z",
})
