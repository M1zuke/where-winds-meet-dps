import type { GraduationBuild } from "../../../definitions/classes/classDef"
import { SET_ID } from "../../sets/ids"
import { createGraduationGearPiece } from "../graduationGear"

const idPrefix = "graduation-stonesplit-strength"

export const STONESPLIT_STRENGTH_GRADUATION_BUILD: GraduationBuild = {
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: ["Min Phys", "Agility", "Max Stonesplit", "Min Phys", "Modao Martial Boost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: ["Min Phys", "Agility", "Max Stonesplit", "Crit", "Min Phys"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "disc",
      words: ["Min Phys", "Agility", "Max Stonesplit", "Min Phys", "All Martial Boost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "pendant",
      words: ["Min Phys", "Agility", "Max Stonesplit", "Min Phys", "All Martial Boost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "helm",
      words: ["Crit", "Agility", "Max Stonesplit", "Precision", "Min Phys"],
      attunement: "phalanxChargeDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["Crit", "Agility", "Max Stonesplit", "Min Bellstrike", "Min Phys"],
      attunement: "phalanxChargeDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: ["Crit", "Agility", "Max Stonesplit", "Min Phys", "Damage VS Boss %"],
      attunement: "phalanxChargeDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: ["Crit", "Agility", "Max Stonesplit", "Min Phys", "Damage VS Boss %"],
      attunement: "phalanxChargeDamage",
    }),
  ],
  set: SET_ID.shatteredRidge,
  bowSet: "crit",
  arsenal: "stonesplit",
}
