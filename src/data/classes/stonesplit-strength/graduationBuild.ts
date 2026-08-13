import type { GraduationBuild } from "../../../definitions/classes/classDef"
import { SET_ID } from "../../sets/ids"
import { createGraduationGearPiece } from "../graduationGear"

const idPrefix = "graduation-stonesplit-strength"

export const STONESPLIT_STRENGTH_GRADUATION_BUILD: GraduationBuild = {
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: ["minPhys", "agility", "maxStonesplit", "minPhys", "modaoBoost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: ["minPhys", "agility", "maxStonesplit", "crit", "minPhys"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "disc",
      words: ["minPhys", "agility", "maxStonesplit", "minPhys", "allMartialBoost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "pendant",
      words: ["minPhys", "agility", "maxStonesplit", "minPhys", "allMartialBoost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "helm",
      words: ["crit", "agility", "maxStonesplit", "precision", "minPhys"],
      attunement: "phalanxChargeDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["crit", "agility", "maxStonesplit", "minBellstrike", "minPhys"],
      attunement: "phalanxChargeDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: ["crit", "agility", "maxStonesplit", "minPhys", "damageVsBoss"],
      attunement: "phalanxChargeDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: ["crit", "agility", "maxStonesplit", "minPhys", "damageVsBoss"],
      attunement: "phalanxChargeDamage",
    }),
  ],
  set: SET_ID.shatteredRidge,
  bowSet: "crit",
  arsenal: "stonesplit",
}
