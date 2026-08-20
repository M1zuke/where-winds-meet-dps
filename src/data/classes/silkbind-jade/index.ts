import { defineClass } from "../../../definitions/classes/classDef"
import { CLASS_ID, SKILLS } from "../../skills/silkbind-jade"
import { DEBUFFS } from "../../skills/silkbind-jade/debuffs"
import { withUniversalSkills } from "../../../definitions/skills/universalSkills"
import { rotationPoolFor } from "../../../definitions/rotations/registry"
import { INNER_WAY_ID } from "../../innerWays/ids"
import { lowQiFollowUp } from "../../skills/silkbind-jade/buffs/lowQiFollowUp"
import { trajectorySkill } from "../../skills/silkbind-jade/buffs/trajectorySkill"
import { SILKBIND_JADE_GRADUATION_BUILD } from "./graduationBuild"
import { MARTIAL_ART_ID } from "../../martialArts/ids"

export const silkbindJade = defineClass({
  id: CLASS_ID,
  displayName: "Silkbind Jade",
  validated: false,
  spec: "silkbind_jade",
  primaryAttribute: "Silkbind",
  attributeMultiplier: 50,
  classMindGroup: INNER_WAY_ID.blossomBarrage,
  allowedMindMethods: [
    INNER_WAY_ID.moraleChant,
    INNER_WAY_ID.bitterSeason,
    INNER_WAY_ID.starReacher,
    INNER_WAY_ID.thunderousBloom,
    INNER_WAY_ID.breakingPoint,
  ],
  classSpecificAttunements: [
    "umbQ",
    "umbFrequentProjectile",
    "umbLightHeavyVariedCombo",
    "fanQ",
    "fanCharged",
    "fanSpecial",
  ],
  weapons: [MARTIAL_ART_ID.vernalUmbrella, MARTIAL_ART_ID.inkwellFan],
  critBoostWeaponTypes: ["Umbrella", "Fan"],
  skills: withUniversalSkills(CLASS_ID, "Silkbind", SKILLS),
  debuffs: DEBUFFS,
  ...rotationPoolFor(CLASS_ID),
  graduationBuild: SILKBIND_JADE_GRADUATION_BUILD,
  classBuffDefs: [lowQiFollowUp, trajectorySkill],
  gateBuffs: [],
  mechanics: [],
  skillBehaviors: [],
  displayGates: [],
  poisonExtensions: [],
})
