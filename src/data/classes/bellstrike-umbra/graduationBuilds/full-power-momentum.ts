import { defineGraduationBuild } from "../../../../definitions/graduationBuilds/graduationBuildDef"
import { SET_ID } from "../../../sets/ids"
import { createGraduationGearPiece } from "../../graduationGear"
import { BELLSTRIKE_UMBRA_STANDARDIZED } from "../standardizedGraduation"
import thirtyEightBBs from "../rotations/38Bbs"

const idPrefix = "graduation-bellstrike-umbra"

export default defineGraduationBuild({
  id: "graduation-bellstrikeUmbra-full-power-momentum",
  name: "No ST Burst",
  classId: "bellstrikeUmbra",
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: ["maxPhys", "maxPhys", "power", "swordBoost", "momentum"],
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
      words: ["maxPhys", "maxPhys", "power", "allMartialBoost", "momentum"],
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
      words: ["affinity", "affinity", "power", "maxPhys", "momentum"],
      attunement: "bleedingDamage",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["affinity", "affinity", "power", "maxPhys", "momentum"],
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
  rotationId: thirtyEightBBs.id,
  standardized: BELLSTRIKE_UMBRA_STANDARDIZED,
})
