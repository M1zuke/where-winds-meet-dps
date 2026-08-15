import type { GraduationBuild } from "../../../definitions/classes/classDef"
import { SET_ID } from "../../sets/ids"
import { createGraduationGearPiece } from "../graduationGear"

const idPrefix = "graduation-bellstrike-splendor"

// Momentum where Umbra's build takes Power, because Nameless Sword and Spear
// scale off Momentum, and Jadeware because every row of the reference rotation
// runs it. Nothing measured backs the word choices themselves.
export const BELLSTRIKE_SPLENDOR_GRADUATION_BUILD: GraduationBuild = {
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: ["maxPhys", "maxPhys", "momentum", "power", "swordBoost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: ["maxPhys", "maxPhys", "momentum", "affinity", "power"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "disc",
      words: ["maxPhys", "momentum", "maxPhys", "allMartialBoost", "power"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "pendant",
      words: ["maxPhys", "maxPhys", "momentum", "allMartialBoost", "power"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "helm",
      words: ["affinity", "affinity", "momentum", "maxPhys", "power"],
      attunement: "swordCharged",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["affinity", "affinity", "momentum", "maxPhys", "power"],
      attunement: "swordCharged",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: ["power", "power", "maxPhys", "damageVsBoss", "affinity"],
      attunement: "swordCharged",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: ["power", "power", "maxPhys", "damageVsBoss", "momentum"],
      attunement: "swordCharged",
    }),
  ],
  set: SET_ID.jadeware,
  bowSet: "crit",
  arsenal: "bellstrike",
  relayedOverrides: {
    bowSet: "affinity",
  },
}
