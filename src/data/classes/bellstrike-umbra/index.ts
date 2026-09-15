import { defineClass } from "../../../definitions/classes/classDef"
import { CLASS_ID, SKILLS } from "../../skills/bellstrike-umbra"
import { withUniversalSkills } from "../../../definitions/skills/universalSkills"
import { DEBUFFS } from "../../skills/bellstrike-umbra/debuffs"
import { rotationsFor } from "../../../definitions/rotations/registry"
import defaultRotation from "./rotations/38Bbs"
import { bellstrikeUmbraBleedPen } from "../../skills/bellstrike-umbra/buffs/bleedPen"
import { bellstrikeUmbraBleedingDamage } from "../../skills/bellstrike-umbra/buffs/bleedingDamage"
import {
  heavenquakerSpearAdditionalAttack,
  strategicSwordAdditionalAttack,
  strategicSwordAdditionalAttackCoefficient,
} from "../../skills/bellstrike-umbra/buffs/additionalAttack"
import {
  ZENITH_DETONATION_BUFF_ID,
  ZENITH_MAX_EXTENDED_DURATION_FRAMES,
} from "../../innerWays/swordHorizonZenith"
import { BELLSTRIKE_UMBRA_GRADUATION_BUILD } from "./graduationBuild"
import { MARTIAL_ART_ID } from "../../martialArts/ids"

export const bellstrikeUmbra = defineClass({
  id: CLASS_ID,
  displayName: "Bellstrike Umbra",
  validated: true,
  spec: "bellstrike_umbra",
  primaryAttribute: "Bellstrike",
  attributeMultiplier: 1.5,
  classMindGroup: "swordHorizon",
  allowedMindMethods: [
    "wolfchasersArt",
    "insightfulStrike",
    "moraleChant",
    "bitterSeason",
    "breakingPoint",
  ],
  classSpecificAttunements: ["bleedingDamage", "swordQ", "swordSpecial", "spearQ", "spearCharged"],
  weapons: [MARTIAL_ART_ID.strategicSword, MARTIAL_ART_ID.heavenquakerSpear],
  critBoostWeaponTypes: [],
  skills: withUniversalSkills(CLASS_ID, "Bellstrike", SKILLS),
  debuffs: DEBUFFS,
  rotations: rotationsFor(CLASS_ID),
  defaultRotationId: defaultRotation.id,
  graduationBuild: BELLSTRIKE_UMBRA_GRADUATION_BUILD,
  classBuffDefs: [
    bellstrikeUmbraBleedPen,
    bellstrikeUmbraBleedingDamage,
    strategicSwordAdditionalAttackCoefficient,
    strategicSwordAdditionalAttack,
    heavenquakerSpearAdditionalAttack,
  ],
  gateBuffs: [],
  mechanics: [],
  skillBehaviors: [],
  displayGates: [],
  // Sword Horizon's Zenith detonation extends an active Bitter Season poison.
  poisonExtensions: [
    {
      statusId: ZENITH_DETONATION_BUFF_ID,
      maxRemainingSec: ZENITH_MAX_EXTENDED_DURATION_FRAMES / 60,
    },
  ],
})
