import { defineClass } from "../../../definitions/classes/classDef"
import { CLASS_ID, SKILLS } from "../../skills/bamboocut-draught"
import { withUniversalSkills } from "../../../definitions/skills/universalSkills"
import { DEBUFFS } from "../../skills/bamboocut-draught/debuffs"
import { rotationsFor } from "../../../definitions/rotations/registry"
import defaultRotation from "./rotations/1mDummyByWindsFromCn"
import { INNER_WAY_ID } from "../../innerWays/ids"
import { MARTIAL_ART_ID } from "../../martialArts/ids"
import { inebriateSkillCritDamage } from "../../skills/bamboocut-draught/buffs/inebriateSkillCritDamage"
import { inebriateDamageScaling } from "../../skills/bamboocut-draught/buffs/inebriateDamageScaling"
import {
  rivenTwinbladesAdditionalAttack,
  skystrikeGauntletsAdditionalAttack,
  skystrikeGauntletsAdditionalAttackCoefficient,
} from "../../skills/bamboocut-draught/buffs/additionalAttack"
import { BAMBOOCUT_DRAUGHT_GATES } from "./gates"
import { BAMBOOCUT_DRAUGHT_GRADUATION_BUILD } from "./graduationBuild"
import { STATUS } from "../../skills/bamboocut-draught/ids"

const classSkillIds = new Set(SKILLS.map((skill) => skill.id))
const skillsWithClassOverrides = withUniversalSkills(CLASS_ID, "Bamboocut", SKILLS).filter(
  (skill, index) => index < SKILLS.length || !classSkillIds.has(skill.id),
)

// The talent "Inebriate Critical Enhancement" is carried by its own module,
// so the weapon-type crit-boost gate stays empty on purpose.
export const bamboocutDraught = defineClass({
  id: CLASS_ID,
  displayName: "Bamboocut Draught",
  validated: true,
  spec: "bamboocut_draught",
  primaryAttribute: "Bamboocut",
  attributeMultiplier: 1.5,
  classMindGroup: INNER_WAY_ID.eonpour,
  allowedMindMethods: [
    INNER_WAY_ID.skyspeak,
    INNER_WAY_ID.mistwing,
    INNER_WAY_ID.volutefit,
    INNER_WAY_ID.moraleChant,
    INNER_WAY_ID.bitterSeason,
    INNER_WAY_ID.breakingPoint,
  ],
  classSpecificAttunements: [
    "gauntletsMartialArt",
    "gauntletsSpecial",
    "twinbladesMartialArt",
    "twinbladesLightAttack",
    "driftcleaveDeepdaze",
  ],
  weapons: [MARTIAL_ART_ID.skystrikeGauntlets, MARTIAL_ART_ID.rivenTwinblades],
  critBoostWeaponTypes: [],
  skills: skillsWithClassOverrides,
  debuffs: DEBUFFS,
  rotations: rotationsFor(CLASS_ID),
  defaultRotationId: defaultRotation.id,
  graduationBuild: BAMBOOCUT_DRAUGHT_GRADUATION_BUILD,
  classBuffDefs: [
    inebriateSkillCritDamage,
    inebriateDamageScaling,
    skystrikeGauntletsAdditionalAttack,
    rivenTwinbladesAdditionalAttack,
    skystrikeGauntletsAdditionalAttackCoefficient,
  ],
  gateBuffs: BAMBOOCUT_DRAUGHT_GATES,
  openingStackBuffIds: [STATUS.bingePoints],
  mechanics: [],
  skillBehaviors: [],
  displayGates: [],
  poisonExtensions: [],
})
