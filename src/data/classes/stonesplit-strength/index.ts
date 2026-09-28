import { defineClass } from "../../../definitions/classes/classDef"
import { CLASS_ID, SKILLS } from "../../skills/stonesplit-strength"
import { DEBUFFS } from "../../skills/stonesplit-strength/debuffs"
import { withUniversalSkills } from "../../../definitions/skills/universalSkills"
import { rotationsFor } from "../../../definitions/rotations/registry"
import defaultRotation from "./rotations/tillaDummyRotation"
import { INNER_WAY_ID } from "../../innerWays/ids"
import { ironGuards } from "../../skills/stonesplit-strength/buffs/ironGuards"
import { cleftpeakDeflect } from "../../skills/stonesplit-strength/buffs/cleftpeakDeflect"
import { stonesplitStrengthSkillCritDamage } from "../../skills/stonesplit-strength/buffs/skillCritDamage"
import {
  phalanxbaneBladeAdditionalAttack,
  snowpartingBladeAdditionalAttack,
} from "../../skills/stonesplit-strength/buffs/additionalAttack"
import { STONESPLIT_STRENGTH_GATES } from "./gates"
import { MARTIAL_ART_ID } from "../../martialArts/ids"
import { enduranceMeter } from "../../resources/enduranceMeter"
import { bladeMomentumMeter } from "./bladeMomentumMeter"

export const stonesplitStrength = defineClass({
  id: CLASS_ID,
  displayName: "Stonesplit Strength",
  validated: true,
  spec: "stonesplit_strength",
  primaryAttribute: "Stonesplit",
  attributeMultiplier: 1.5,
  classMindGroup: INNER_WAY_ID.frostCladNight,
  allowedMindMethods: [
    INNER_WAY_ID.moraleChant,
    INNER_WAY_ID.throatPierce,
    INNER_WAY_ID.steadfastDevotion,
    INNER_WAY_ID.bitterSeason,
    INNER_WAY_ID.breakingPoint,
    INNER_WAY_ID.evasiveCharge,
  ],
  classSpecificAttunements: [
    "phalanxbaneQ",
    "phalanxChargeDamage",
    "snowpartingQ",
    "snowpartingCharged",
    "snowpartingVariedCombo",
  ],
  weapons: [MARTIAL_ART_ID.snowpartingBlade, MARTIAL_ART_ID.phalanxbaneBlade],
  // In-game values as of 2026-09-28: the shortest read reach on either
  // weapon (Grave Frost) — an assumption for every skill with no reach of
  // its own.
  defaultMeleeReachMeters: 4,
  meters: [enduranceMeter, bladeMomentumMeter],
  critBoostWeaponTypes: [],
  skills: withUniversalSkills(CLASS_ID, "Stonesplit", SKILLS),
  debuffs: DEBUFFS,
  rotations: rotationsFor(CLASS_ID),
  defaultRotationId: defaultRotation.id,
  classBuffDefs: [
    ironGuards,
    cleftpeakDeflect,
    stonesplitStrengthSkillCritDamage,
    phalanxbaneBladeAdditionalAttack,
    snowpartingBladeAdditionalAttack,
  ],
  gateBuffs: STONESPLIT_STRENGTH_GATES,
  mechanics: [],
  skillBehaviors: [],
  displayGates: [],
  poisonExtensions: [],
})
