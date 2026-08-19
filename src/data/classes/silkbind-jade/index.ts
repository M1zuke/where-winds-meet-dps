import { defineClass } from "../../../definitions/classes/classDef"
import { CLASS_ID as SKILL_CLASS_ID, SKILLS } from "../../skills/silkbind-jade"
import { DEBUFFS } from "../../skills/silkbind-jade/debuffs"
import { withUniversalSkills } from "../../../definitions/skills/universalSkills"
import { rotationPoolFor } from "../../../definitions/rotations/registry"

export const CLASS_ID = SKILL_CLASS_ID

export const silkbindJade = defineClass({
  id: CLASS_ID,
  displayName: "Silkbind Jade",
  validated: false,
  spec: "silkbind_jade",
  primaryAttribute: "Silkbind",
  attributeMultiplier: 51.5,
  classMindGroup: "",
  allowedMindMethods: [
    // keep empty or add innerWay ids later if needed, e.g. INNER_WAY_ID.moraleChant
  ],
  classSpecificAttunements: [],
  weapons: [], // populate with MARTIAL_ART_ID.* entries if available later
  critBoostWeaponTypes: [],
  // include the skill list, plus universal skills provided by the shared helper
  skills: withUniversalSkills(CLASS_ID, "Silkbind", SKILLS),
  debuffs: DEBUFFS,
  ...rotationPoolFor(CLASS_ID),
  defaultRotationId: null,
  graduationBuild: {
    gear: [],
    set: null,
    bowSet: null,
    arsenal: "silkbind",
  },
  classBuffDefs: [],
  gateBuffs: [],
  mechanics: [],
  skillBehaviors: [],
  displayGates: [],
  poisonExtensions: [],
})