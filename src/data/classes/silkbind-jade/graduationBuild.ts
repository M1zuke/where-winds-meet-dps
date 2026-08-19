import type { GraduationBuild } from "../../../definitions/classes/classDef"
import { SET_ID } from "../../sets/ids"
import { createGraduationGearPiece } from "../graduationGear"

const idPrefix = "graduation-silkbind-jade"

// Word choices mirror Bellstrike Splendor's because no workbook row or
// reference-site def for Silkbind Jade's named best-in-slot has been
// captured — the Fan and Umbrella words (`fanBoost` / `umbrellaBoost`) come
// from the weapons registered on the class, and the rest is the same
// Bellstrike-style raw phys + momentum split that the existing silkbind
// rotation uses.
export const SILKBIND_JADE_GRADUATION_BUILD: GraduationBuild = {
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: ["maxPhys", "maxPhys", "momentum", "power", "fanBoost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: ["maxPhys", "maxPhys", "momentum", "affinity", "umbrellaBoost"],
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
      words: ["affinity", "affinity", "momentum", "maxPhys", "fanBoost"],
      attunement: "fanQ",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["affinity", "affinity", "momentum", "maxPhys", "umbrellaBoost"],
      attunement: "umbQ",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: ["power", "power", "maxPhys", "damageVsBoss", "affinity"],
      attunement: "fanQ",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: ["power", "power", "maxPhys", "damageVsBoss", "momentum"],
      attunement: "umbQ",
    }),
  ],
  set: SET_ID.jadeware,
  bowSet: "crit",
  arsenal: "silkbind",
}
