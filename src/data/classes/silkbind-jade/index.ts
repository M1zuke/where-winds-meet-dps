import { defineClass } from "../../../definitions/classes/classDef"
import { CLASS_ID, SKILLS } from "../../skills/silkbind-jade"
import { DEBUFFS } from "../../skills/silkbind-jade/debuffs"
import { withUniversalSkills } from "../../../definitions/skills/universalSkills"
import { rotationsFor } from "../../../definitions/rotations/registry"
import defaultRotation from "./rotations/standardized17"
import { INNER_WAY_ID } from "../../innerWays/ids"
import { lowQiFollowUp } from "../../skills/silkbind-jade/buffs/lowQiFollowUp"
import { trajectorySkill } from "../../skills/silkbind-jade/buffs/trajectorySkill"
import {
  inkwellFanAdditionalAttack,
  vernalUmbrellaAdditionalAttack,
} from "../../skills/silkbind-jade/buffs/additionalAttack"
import { MARTIAL_ART_ID } from "../../martialArts/ids"
import { blossomResource, legacyDroneSkillIds } from "./blossoms"
import { enduranceMeter } from "../../resources/enduranceMeter"
import { SILKBIND_JADE_GATES } from "./gates"

const classSkillIds = new Set(SKILLS.map((skill) => skill.id))
const skillsWithClassOverrides = withUniversalSkills(CLASS_ID, "Silkbind", SKILLS).filter(
  (skill, index) => index < SKILLS.length || !classSkillIds.has(skill.id),
)

export const silkbindJade = defineClass({
  id: CLASS_ID,
  displayName: "Silkbind Jade",
  validated: false,
  resources: [blossomResource],
  legacySkillIds: legacyDroneSkillIds,
  spec: "silkbind_jade",
  primaryAttribute: "Silkbind",
  attributeMultiplier: 1.5,
  classMindGroup: INNER_WAY_ID.blossomBarrage,
  allowedMindMethods: [
    INNER_WAY_ID.moraleChant,
    INNER_WAY_ID.bitterSeason,
    INNER_WAY_ID.starReacher,
    INNER_WAY_ID.thunderousBloom,
    INNER_WAY_ID.breakingPoint,
    INNER_WAY_ID.evasiveCharge,
    INNER_WAY_ID.gourdToss,
  ],
  classSpecificAttunements: [
    "umbQ",
    "umbCharged",
    "umbFrequentProjectile",
    "umbLightHeavyVariedCombo",
    "fanQ",
    "fanCharged",
    "fanSpecial",
  ],
  weapons: [MARTIAL_ART_ID.vernalUmbrella, MARTIAL_ART_ID.inkwellFan],
  // In-game values as of 2026-09-28: the shortest read reach on either
  // weapon (Peak's Springless Silence / Moon Shatter Spring) — an assumption
  // for every skill with no reach of its own.
  defaultMeleeReachMeters: 9,
  meters: [enduranceMeter],
  critBoostWeaponTypes: ["Umbrella", "Fan"],
  skills: skillsWithClassOverrides,
  debuffs: DEBUFFS,
  rotations: rotationsFor(CLASS_ID),
  defaultRotationId: defaultRotation.id,
  classBuffDefs: [
    lowQiFollowUp,
    trajectorySkill,
    inkwellFanAdditionalAttack,
    vernalUmbrellaAdditionalAttack,
  ],
  gateBuffs: SILKBIND_JADE_GATES,
  mechanics: [],
  skillBehaviors: [],
  displayGates: [],
  poisonExtensions: [],
})
