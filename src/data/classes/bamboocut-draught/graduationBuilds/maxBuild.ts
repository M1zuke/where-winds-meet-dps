import { defineGraduationBuild } from "../../../../definitions/graduationBuilds/graduationBuildDef"
import { SET_ID } from "../../../sets/ids"
import { createGraduationGearPiece } from "../../graduationGear"
import graduationRotation from "../rotations/1mDummyByWindsFromCn"

const idPrefix = "graduation-bamboocut-draught"

export default defineGraduationBuild({
  id: "graduation-bamboocutDraught-max-build",
  name: "Max Build",
  classId: "bamboocutDraught",
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: ["maxPhys", "maxPhys", "dualKnivesBoost", "power", "crit"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: ["maxPhys", "maxPhys", "gauntletsBoost", "power", "agility"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "disc",
      words: ["maxPhys", "maxPhys", "allMartialBoost", "power", "crit"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "pendant",
      words: ["maxPhys", "maxPhys", "allMartialBoost", "power", "crit"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "helm",
      words: ["crit", "agility", "maxPhys", "precision", "crit"],
      attunement: "driftcleaveDeepdaze",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["precision", "agility", "maxPhys", "precision", "crit"],
      attunement: "driftcleaveDeepdaze",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: ["power", "power", "maxPhys", "damageVsBoss", "crit"],
      attunement: "driftcleaveDeepdaze",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: ["power", "power", "maxPhys", "damageVsBoss", "crit"],
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
