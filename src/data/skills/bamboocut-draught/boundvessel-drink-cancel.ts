import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"
import { boundvesselHits } from "./boundvessel"
import { enduranceMeter } from "../../resources/enduranceMeter"

// Ends at the first frame the drink may interrupt the finish, which is the
// next rotation step; in-game animation, 2026-10-06.
export const boundvesselDrinkCancel = defineSkill({
  id: SKILL.boundvesselDrinkCancel,
  classId: "bamboocutDraught",
  name: "Twinblade Heavy Attack [drink cancel]",
  breakdownName: "Boundvessel",
  tags: [WEAPON.twinBlades],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.boundvesselDrinkCancel,
  cancelledBy: "nextSkill",
  receives: [
    ...INEBRIATE_ENHANCED_RECEIVES,
    ...RIVEN_TWINBLADES_RECEIVES,
    BUFF.nonPlayerBaseDamage50,
  ],
  triggerable: false,
  castFrames: 175,
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  meterDrains: [{ meterId: enduranceMeter.id, perSecond: 15, fromFrame: 40, stopAfterSec: 1.6 }],
  hits: boundvesselHits,
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
