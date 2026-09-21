import { defineGraduationBuild } from "../../../../definitions/graduationBuilds/graduationBuildDef"
import { SET_ID } from "../../../sets/ids"
import { createGraduationGearPiece } from "../../graduationGear"
import graduationRotation from "../rotations/1mDummyByWindsFromCn"

const idPrefix = "graduation-bamboocut-draught"

export default defineGraduationBuild({
  id: "graduation-bamboocutDraught-tiltrim-crit",
  name: "Min Build",
  classId: "bamboocutDraught",
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: ["minPhys", "minPhys", "dualKnivesBoost", "agility", "maxFormless"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: ["minPhys", "minPhys", "gauntletsBoost", "agility", "precision"],
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
      attunement: "driftcleaveDeepdaze",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["crit", "agility", "minPhys", "precision", "maxBamboocut"],
      attunement: "driftcleaveDeepdaze",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: ["crit", "agility", "minPhys", "damageVsBoss", "maxBamboocut"],
      attunement: "driftcleaveDeepdaze",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: ["crit", "agility", "minPhys", "damageVsBoss", "maxBamboocut"],
      attunement: "driftcleaveDeepdaze",
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
    innerWays: [
      { id: "eonpour", tier: 6 },
      { id: "skyspeak", tier: 6 },
      { id: "mistwing", tier: 6 },
      { id: "moraleChant", tier: 6 },
    ],
  },
})
