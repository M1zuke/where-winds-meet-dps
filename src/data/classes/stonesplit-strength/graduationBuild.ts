import type { GraduationBuild } from "../../../definitions/classes/classDef"
import { SET_ID } from "../../sets/ids"
import { createGraduationGearPiece } from "../graduationGear"

const idPrefix = "graduation-stonesplit-strength"

export const STONESPLIT_STRENGTH_GRADUATION_BUILD = {
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: [
        { word: "Min Phys", value: 77.8 },
        { word: "Agility", value: 49.4 },
        { word: "Max Stonesplit", value: 44.2 },
        { word: "Min Phys", value: 77.8 },
        { word: "Modao Martial Boost", value: 0.062 },
      ],
      attunement: "physPen",
      attunementValue: 0.11,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: [
        { word: "Min Phys", value: 77.8 },
        { word: "Agility", value: 49.4 },
        { word: "Max Stonesplit", value: 44.2 },
        { word: "Crit", value: 0.09 },
        { word: "Min Phys", value: 77.8 },
      ],
      attunement: "physPen",
      attunementValue: 0.11,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "disc",
      words: [
        { word: "Min Phys", value: 77.8 },
        { word: "Agility", value: 49.4 },
        { word: "Max Stonesplit", value: 44.2 },
        { word: "Min Phys", value: 77.8 },
        { word: "All Martial Boost", value: 0.032 },
      ],
      attunement: "physPen",
      attunementValue: 0.11,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "pendant",
      words: [
        { word: "Min Phys", value: 77.8 },
        { word: "Agility", value: 49.4 },
        { word: "Max Stonesplit", value: 44.2 },
        { word: "Min Phys", value: 77.8 },
        { word: "All Martial Boost", value: 0.032 },
      ],
      attunement: "physPen",
      attunementValue: 0.11,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "helm",
      words: [
        { word: "Crit", value: 0.09 },
        { word: "Agility", value: 49.4 },
        { word: "Max Stonesplit", value: 44.2 },
        { word: "Precision", value: 0.08 },
        { word: "Min Phys", value: 77.8 },
      ],
      attunement: "phalanxChargeDamage",
      attunementValue: 0.06,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: [
        { word: "Crit", value: 0.09 },
        { word: "Agility", value: 49.4 },
        { word: "Max Stonesplit", value: 44.2 },
        { word: "Min Bellstrike", value: 44.2 },
        { word: "Min Phys", value: 77.8 },
      ],
      attunement: "phalanxChargeDamage",
      attunementValue: 0.06,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: [
        { word: "Crit", value: 0.09 },
        { word: "Agility", value: 49.4 },
        { word: "Max Stonesplit", value: 44.2 },
        { word: "Min Phys", value: 77.8 },
        { word: "Damage VS Boss %", value: 0.032 },
      ],
      attunement: "phalanxChargeDamage",
      attunementValue: 0.06,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: [
        { word: "Crit", value: 0.09 },
        { word: "Agility", value: 49.4 },
        { word: "Max Stonesplit", value: 44.2 },
        { word: "Min Phys", value: 77.8 },
        { word: "Damage VS Boss %", value: 0.032 },
      ],
      attunement: "phalanxChargeDamage",
      attunementValue: 0.06,
    }),
  ],
  set: SET_ID.shatteredRidge,
  bowSet: "crit",
  arsenal: "stonesplit",
} satisfies GraduationBuild
