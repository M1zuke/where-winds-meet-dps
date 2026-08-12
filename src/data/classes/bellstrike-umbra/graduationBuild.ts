import type { GraduationBuild } from "../../../definitions/classes/classDef"
import { SET_ID } from "../../sets/ids"
import { createGraduationGearPiece } from "../graduationGear"

const idPrefix = "graduation-bellstrike-umbra"

export const BELLSTRIKE_UMBRA_GRADUATION_BUILD = {
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: [
        { word: "Max Phys", value: 77.8 },
        { word: "Power", value: 49.4 },
        { word: "Max Phys", value: 77.8 },
        { word: "Momentum", value: 49.4 },
        { word: "Sword Martial Boost", value: 0.062 },
      ],
      attunement: "physPen",
      attunementValue: 0.11,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: [
        { word: "Max Phys", value: 77.8 },
        { word: "Power", value: 49.4 },
        { word: "Max Phys", value: 77.8 },
        { word: "Affinity", value: 0.044 },
        { word: "Momentum", value: 49.4 },
      ],
      attunement: "physPen",
      attunementValue: 0.11,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "disc",
      words: [
        { word: "Max Phys", value: 77.8 },
        { word: "Power", value: 49.4 },
        { word: "Max Phys", value: 77.8 },
        { word: "Momentum", value: 49.4 },
        { word: "All Martial Boost", value: 0.032 },
      ],
      attunement: "physPen",
      attunementValue: 0.11,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "pendant",
      words: [
        { word: "Max Phys", value: 77.8 },
        { word: "Momentum", value: 49.4 },
        { word: "Max Phys", value: 77.8 },
        { word: "Momentum", value: 49.4 },
        { word: "All Martial Boost", value: 0.032 },
      ],
      attunement: "physPen",
      attunementValue: 0.11,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "helm",
      words: [
        { word: "Affinity", value: 0.044 },
        { word: "Power", value: 49.4 },
        { word: "Max Phys", value: 77.8 },
        { word: "Affinity", value: 0.044 },
        { word: "Momentum", value: 49.4 },
      ],
      attunement: "bleedingDamage",
      attunementValue: 0.06,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: [
        { word: "Affinity", value: 0.044 },
        { word: "Power", value: 49.4 },
        { word: "Max Phys", value: 77.8 },
        { word: "Affinity", value: 0.044 },
        { word: "Momentum", value: 49.4 },
      ],
      attunement: "bleedingDamage",
      attunementValue: 0.06,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: [
        { word: "Power", value: 49.4 },
        { word: "Power", value: 49.4 },
        { word: "Max Phys", value: 77.8 },
        { word: "Affinity", value: 0.044 },
        { word: "Damage VS Boss %", value: 0.032 },
      ],
      attunement: "bleedingDamage",
      attunementValue: 0.06,
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: [
        { word: "Power", value: 49.4 },
        { word: "Power", value: 49.4 },
        { word: "Max Phys", value: 77.8 },
        { word: "Affinity", value: 0.044 },
        { word: "Damage VS Boss %", value: 0.032 },
      ],
      attunement: "bleedingDamage",
      attunementValue: 0.06,
    }),
  ],
  set: SET_ID.hawking,
  bowSet: "precision",
  arsenal: "bellstrike",
} satisfies GraduationBuild
