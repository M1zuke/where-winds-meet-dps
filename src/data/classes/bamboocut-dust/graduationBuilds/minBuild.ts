import { defineGraduationBuild } from "../../../../definitions/graduationBuilds/graduationBuildDef"
import { SET_ID } from "../../../sets/ids"
import { createGraduationGearPiece } from "../../graduationGear"
import graduationRotation from "../rotations/placeholder"

const idPrefix = "graduation-bamboocut-dust"

export default defineGraduationBuild({
  id: "graduation-bamboocutDust-min-build",
  name: "Min Build",
  classId: "bamboocutDust",
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: ["minPhys", "minPhys", "umbrellaBoost", "agility", "precision"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: ["minPhys", "minPhys", "ropeDartBoost", "agility", "maxFormless"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "disc",
      words: ["minPhys", "minPhys", "allMartialBoost", "agility", "maxBamboocut"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "pendant",
      words: ["minPhys", "minPhys", "allMartialBoost", "agility", "maxBamboocut"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "helm",
      words: ["crit", "agility", "minPhys", "precision", "crit"],
      attunement: "everspringMartialArt",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["crit", "agility", "minPhys", "precision", "maxBamboocut"],
      attunement: "everspringMartialArt",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: ["crit", "agility", "minPhys", "damageVsBoss", "maxBamboocut"],
      attunement: "everspringMartialArt",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: ["crit", "agility", "minPhys", "damageVsBoss", "maxBamboocut"],
      attunement: "everspringMartialArt",
    }),
  ],
  set: SET_ID.tiltrim,
  bowSet: "crit",
  arsenal: "bamboocut",
  rotationId: graduationRotation.id,
  standardized: {
    encounter: {
      food: true,
      divinecraft: "fire",
    },
    innerWays: [{ id: "moraleChant", tier: 6 }],
  },
})
