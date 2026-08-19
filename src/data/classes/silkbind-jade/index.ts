import { defineClass } from "../../../definitions/classes/classDef"
import { CLASS_ID, SKILLS } from "../../skills/silkbind-jade"
import { DEBUFFS } from "../../skills/silkbind-jade/debuffs"
import { withUniversalSkills } from "../../../definitions/skills/universalSkills"
import { rotationPoolFor } from "../../../definitions/rotations/registry"
import { INNER_WAY_ID } from "../../innerWays/ids"
import { MARTIAL_ART_ID } from "../../martialArts/ids"
import { SILKBIND_JADE_GATES } from "./gates"
import { SILKBIND_JADE_GRADUATION_BUILD } from "./graduationBuild"

export const silkbindJade = defineClass({
  id: CLASS_ID,
  displayName: "Silkbind Jade",
  validated: false,
  spec: "silkbind_jade",
  primaryAttribute: "Silkbind",
  attributeMultiplier: 51.5,
  classMindGroup: "",
  allowedMindMethods: [
    INNER_WAY_ID.moraleChant,
    INNER_WAY_ID.insightfulStrike,
    INNER_WAY_ID.bitterSeason,
  ],
  classSpecificAttunements: ["fanQ", "fanCharged", "fanSpecial", "umbQ", "umbCharged"],
  weapons: [MARTIAL_ART_ID.silkbindFan, MARTIAL_ART_ID.silkbindUmbrella],
  critBoostWeaponTypes: [],
  skills: withUniversalSkills(CLASS_ID, "Silkbind", SKILLS),
  debuffs: DEBUFFS,
  ...rotationPoolFor(CLASS_ID),
  graduationBuild: SILKBIND_JADE_GRADUATION_BUILD,
  classBuffDefs: [],
  gateBuffs: SILKBIND_JADE_GATES,
  mechanics: [],
  skillBehaviors: [],
  displayGates: [],
  poisonExtensions: [],
})
