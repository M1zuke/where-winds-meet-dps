import { defineGraduationBuild } from "../../../../definitions/graduationBuilds/graduationBuildDef"
import { SET_ID } from "../../../sets/ids"
import { createGraduationGearPiece } from "../../graduationGear"
import graduationRotation from "../rotations/tillaDummyRotation"

const idPrefix = "graduation-stonesplit-strength"

export default defineGraduationBuild({
  id: "graduation-stonesplitStrength-cleftpeak-crit",
  name: "Cleftpeak Crit",
  classId: "stonesplitStrength",
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
  set: SET_ID.cleftpeak,
  bowSet: "crit",
  arsenal: "stonesplit",
  rotationId: graduationRotation.id,
})
