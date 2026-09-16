import { defineGraduationBuild } from "../../../../definitions/graduationBuilds/graduationBuildDef"
import { SET_ID } from "../../../sets/ids"
import { createGraduationGearPiece } from "../../graduationGear"
import graduationRotation from "../rotations/nox1mDh"

const idPrefix = "graduation-bellstrike-umbra"

export default defineGraduationBuild({
  id: "graduation-bellstrikeUmbra-st-burst",
  name: "ST Burst",
  classId: "bellstrikeUmbra",
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
      words: ["affinity", "affinity", "momentum", "maxPhys", "singleTargetMysticBoost"],
      attunement: "bleedingDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["affinity", "affinity", "momentum", "maxPhys", "singleTargetMysticBoost"],
      attunement: "bleedingDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: ["power", "power", "maxPhys", "damageVsBoss", "momentum"],
      attunement: "bleedingDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: ["power", "power", "maxPhys", "damageVsBoss", "momentum"],
      attunement: "bleedingDamage",
    }),
  ],
  set: SET_ID.hawkwing,
  bowSet: "crit",
  arsenal: "bellstrike",
  rotationId: graduationRotation.id,
  relayedOverrides: { bowSet: "affinity" },
})
