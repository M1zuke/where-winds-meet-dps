import { defineClass } from "../../../definitions/classes/classDef"
import { CLASS_ID, SKILLS } from "../../skills/stonesplit-strength"
import { DEBUFFS } from "../../skills/stonesplit-strength/debuffs"
import { withUniversalSkills } from "../../../definitions/skills/universalSkills"
import { rotationPoolFor } from "../../../definitions/rotations/registry"
import { INNER_WAY_ID } from "../../innerWays/ids"
import { ironGuards } from "../../skills/stonesplit-strength/buffs/ironGuards"
import { shatteredRidgeDeflect } from "../../skills/stonesplit-strength/buffs/shatteredRidgeDeflect"
import { stonesplitStrengthSkillCritDamage } from "../../skills/stonesplit-strength/buffs/skillCritDamage"
import { STONESPLIT_STRENGTH_GATES } from "./gates"
import { STONESPLIT_STRENGTH_GRADUATION_BUILD } from "./graduationBuild"
import { MARTIAL_ART_ID } from "../../martialArts/ids"

export const stonesplitStrength = defineClass({
  id: CLASS_ID,
  displayName: "Stonesplit Strength",
  validated: true,
  spec: "stonesplit_strength",
  primaryAttribute: "Stonesplit",
  attributeMultiplier: 51.5,
  classMindGroup: INNER_WAY_ID.frostCladNight,
  allowedMindMethods: [
    INNER_WAY_ID.moraleChant,
    INNER_WAY_ID.throatPierce,
    INNER_WAY_ID.steadfastDevotion,
    INNER_WAY_ID.bitterSeason,
  ],
  classSpecificAttunements: [
    "phalanxbaneQ",
    "phalanxChargeDamage",
    "snowpartingQ",
    "snowpartingCharged",
    "snowpartingVariedCombo",
  ],
  weapons: [MARTIAL_ART_ID.snowpartingBlade, MARTIAL_ART_ID.phalanxbaneBlade],
  critBoostWeaponTypes: [],
  skills: withUniversalSkills(CLASS_ID, "Stonesplit", SKILLS),
  debuffs: DEBUFFS,
  ...rotationPoolFor(CLASS_ID),
  graduationBuild: STONESPLIT_STRENGTH_GRADUATION_BUILD,
  classBuffDefs: [ironGuards, shatteredRidgeDeflect, stonesplitStrengthSkillCritDamage],
  gateBuffs: STONESPLIT_STRENGTH_GATES,
  mechanics: [],
  skillBehaviors: [],
  displayGates: [],
  poisonExtensions: [],
})
