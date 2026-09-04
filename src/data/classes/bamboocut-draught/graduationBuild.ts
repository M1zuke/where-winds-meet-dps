import type { GraduationBuild } from "../../../definitions/classes/classDef"
import { SET_ID } from "../../sets/ids"
import { createGraduationGearPiece } from "../graduationGear"

const idPrefix = "graduation-bamboocut-draught"

export const BAMBOOCUT_DRAUGHT_GRADUATION_BUILD: GraduationBuild = {
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: ["minPhys", "agility", "maxBamboocut", "minPhys", "gauntletsBoost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: ["minPhys", "agility", "maxBamboocut", "crit", "dualKnivesBoost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "disc",
      words: ["minPhys", "agility", "maxBamboocut", "minPhys", "allMartialBoost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "pendant",
      words: ["minPhys", "agility", "maxBamboocut", "minPhys", "allMartialBoost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "helm",
      words: ["crit", "agility", "maxBamboocut", "precision", "minPhys"],
      attunement: "gauntletsMartialArt",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["crit", "agility", "maxBamboocut", "minPhys", "minPhys"],
      attunement: "gauntletsSpecial",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: ["crit", "agility", "maxBamboocut", "minPhys", "minPhys"],
      attunement: "twinbladesMartialArt",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: ["crit", "agility", "maxBamboocut", "minPhys", "minPhys"],
      attunement: "driftcleaveDeepdaze",
    }),
  ],
  set: SET_ID.tiltrim,
  bowSet: "crit",
  arsenal: "bamboocut",
}
