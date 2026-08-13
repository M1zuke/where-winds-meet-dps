import type { GraduationBuild } from "../../../definitions/classes/classDef"
import { SET_ID } from "../../sets/ids"
import { createGraduationGearPiece } from "../graduationGear"

const idPrefix = "graduation-bellstrike-umbra"

export const BELLSTRIKE_UMBRA_GRADUATION_BUILD: GraduationBuild = {
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: ["maxPhys", "maxPhys", "power", "momentum", "swordBoost"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: ["maxPhys", "maxPhys", "power", "affinity", "momentum"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "disc",
      words: ["maxPhys", "power", "maxPhys", "allMartialBoost", "momentum"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "pendant",
      words: ["maxPhys", "maxPhys", "power", "allMartialBoost", "momentum"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "helm",
      words: ["affinity", "affinity", "power", "maxPhys", "singleTargetMysticBoost"],
      attunement: "bleedingDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["affinity", "affinity", "power", "maxPhys", "singleTargetMysticBoost"],
      attunement: "bleedingDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: ["power", "power", "maxPhys", "damageVsBoss", "affinity"],
      attunement: "bleedingDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: ["power", "power", "maxPhys", "damageVsBoss", "momentum"],
      attunement: "bleedingDamage",
    }),
  ],
  set: SET_ID.hawking,
  bowSet: "crit",
  arsenal: "bellstrike",
  relayedOverrides: { bowSet: "affinity" },
}
