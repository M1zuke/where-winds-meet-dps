import { defineClass } from "../../../definitions/classes/classDef"
import { CLASS_ID, SKILLS } from "../../skills/bellstrike-umbra"
import { withUniversalSkills } from "../../../definitions/skills/universalSkills"
import { DEBUFFS } from "../../skills/bellstrike-umbra/debuffs"
import { rotationPoolFor } from "../../../definitions/rotations/registry"
import { BELLSTRIKE_POOL } from "./retunementPool"
import { declareMechanic, MECHANIC_ORDER } from "../../../engine/mechanics"
import { bellstrikeUmbraBleedPen } from "../../skills/bellstrike-umbra/buffs/bleedPen"
import { bellstrikeUmbraBleedingDamage } from "../../skills/bellstrike-umbra/buffs/bleedingDamage"
import { BELLSTRIKE_UMBRA_GATES } from "./gates"
import {
  ZENITH_DETONATION_BUFF_ID,
  ZENITH_MAX_EXTENDED_DURATION_FRAMES,
} from "../../innerWays/swordHorizonZenith"
import { levelAttributeBonusMechanic } from "./levelBonus"
import { BELLSTRIKE_UMBRA_GRADUATION_BUILD } from "./graduationBuild"

export const bellstrikeUmbra = defineClass({
  id: CLASS_ID,
  displayName: "Bellstrike Umbra",
  validated: true,
  spec: "bellstrike_umbra",
  primaryAttribute: "Bellstrike",
  attributeMultiplier: 51.5,
  classMindGroup: "swordHorizon",
  allowedMindMethods: ["wolfchasersArt", "insightfulStrike", "moraleChant", "bitterSeason"],
  classSpecificAttunements: [
    "Bleed Boost",
    "Strategic Sword Martial Boost",
    "Strategic Sword Special Boost",
    "Heavenquaker Spear Martial Boost",
    "Heavenquaker Spear Charged Boost",
  ],
  weapons: ["Sword", "Spear"],
  // `.tmp/site/deobfuscated.js` ~L42153-42160 gates the min-phys crit-damage
  // bonus on a weapon match against `grantsCritBoost === true` items — neither
  // of Umbra's (Strategic Sword, Heavenquaker Spear) is one.
  critBoostWeaponTypes: [],
  skills: withUniversalSkills(CLASS_ID, "Bellstrike", SKILLS),
  debuffs: DEBUFFS,
  ...rotationPoolFor(CLASS_ID),
  graduationBuild: BELLSTRIKE_UMBRA_GRADUATION_BUILD,
  retunementPool: BELLSTRIKE_POOL,
  classBuffDefs: [bellstrikeUmbraBleedPen, bellstrikeUmbraBleedingDamage],
  gateBuffs: BELLSTRIKE_UMBRA_GATES,
  mechanics: [declareMechanic(levelAttributeBonusMechanic, MECHANIC_ORDER.levelAttributeBonus)],
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
