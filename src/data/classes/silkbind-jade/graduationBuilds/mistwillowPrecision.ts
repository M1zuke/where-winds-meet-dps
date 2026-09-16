import { defineGraduationBuild } from "../../../../definitions/graduationBuilds/graduationBuildDef"
import { SET_ID } from "../../../sets/ids"
import { createGraduationGearPiece } from "../../graduationGear"
import graduationRotation from "../rotations/standardized17"

const idPrefix = "graduation-silkbind-jade"

export default defineGraduationBuild({
  id: "graduation-silkbindJade-mistwillow-precision",
  name: "Mistwillow Precision",
  classId: "silkbindJade",
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: ["maxPhys", "maxPhys", "power", "agility", "crit"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: ["maxPhys", "maxPhys", "power", "crit", "umbrellaBoost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "disc",
      words: ["maxPhys", "maxPhys", "power", "allMartialBoost", "crit"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "pendant",
      words: ["maxPhys", "maxPhys", "power", "allMartialBoost", "crit"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "helm",
      words: ["crit", "crit", "maxPhys", "power", "minPhys"],
      attunement: "umbFrequentProjectile",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["precision", "maxPhys", "power", "crit", "agility"],
      attunement: "umbFrequentProjectile",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: ["power", "damageVsBoss", "maxPhys", "power", "agility"],
      attunement: "umbFrequentProjectile",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: ["power", "power", "maxPhys", "damageVsBoss", "minPhys"],
      attunement: "umbFrequentProjectile",
    }),
  ],
  set: SET_ID.mistwillow,
  bowSet: "precision",
  arsenal: "silkbind",
  rotationId: graduationRotation.id,
})
