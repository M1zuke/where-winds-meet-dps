import type { GraduationBuild } from "../../../definitions/classes/classDef"
import { SET_ID } from "../../sets/ids"
import { createGraduationGearPiece } from "../graduationGear"

const idPrefix = "graduation-bellstrike-umbra"

export const BELLSTRIKE_UMBRA_GRADUATION_BUILD: GraduationBuild = {
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: ["Max Phys", "Max Phys", "Power", "Momentum", "Sword Martial Boost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: ["Max Phys", "Max Phys", "Power", "Affinity", "Momentum"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "disc",
      words: ["Max Phys", "Power", "Max Phys", "All Martial Boost", "Momentum"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "pendant",
      words: ["Max Phys", "Max Phys", "Power", "All Martial Boost", "Momentum"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "helm",
      words: ["Affinity", "Affinity", "Power", "Max Phys", "Single-Target Mystic Skill DMG Boost"],
      attunement: "bleedingDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["Affinity", "Affinity", "Power", "Max Phys", "Single-Target Mystic Skill DMG Boost"],
      attunement: "bleedingDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: ["Power", "Power", "Max Phys", "Damage VS Boss %", "Affinity"],
      attunement: "bleedingDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: ["Power", "Power", "Max Phys", "Damage VS Boss %", "Momentum"],
      attunement: "bleedingDamage",
    }),
  ],
  set: SET_ID.hawking,
  bowSet: "crit",
  arsenal: "bellstrike",
  relayedOverrides: { bowSet: "affinity" },
}
