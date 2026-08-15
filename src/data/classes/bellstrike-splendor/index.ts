import { defineClass } from "../../../definitions/classes/classDef"
import { CLASS_ID, SKILLS } from "../../skills/bellstrike-splendor"
import { DEBUFFS } from "../../skills/bellstrike-splendor/debuffs"
import { withUniversalSkills } from "../../../definitions/skills/universalSkills"
import { rotationPoolFor } from "../../../definitions/rotations/registry"
import { INNER_WAY_ID } from "../../innerWays/ids"
import { BELLSTRIKE_SPLENDOR_GRADUATION_BUILD } from "./graduationBuild"
import { belowSixtyEndurance } from "../../skills/bellstrike-splendor/buffs/belowSixtyEndurance"
import { endlessGale } from "../../skills/bellstrike-splendor/buffs/endlessGale"
import { qiImbalance } from "../../skills/bellstrike-splendor/buffs/qiImbalance"
import { swordEnergyEnhancement } from "../../skills/bellstrike-splendor/buffs/swordEnergyEnhancement"
import { swordEnergyHpDamage } from "../../skills/bellstrike-splendor/buffs/swordEnergyHpDamage"
import { swordSlashDamageBoost } from "../../skills/bellstrike-splendor/buffs/swordSlashDamageBoost"

export const bellstrikeSplendor = defineClass({
  id: CLASS_ID,
  displayName: "Bellstrike Splendor",
  validated: false,
  spec: "bellstrike_splendor",
  primaryAttribute: "Bellstrike",
  attributeMultiplier: 51.5,
  classMindGroup: INNER_WAY_ID.swordMorph,
  allowedMindMethods: [
    INNER_WAY_ID.battleAnthem,
    INNER_WAY_ID.mountainsMight,
    INNER_WAY_ID.moraleChant,
    INNER_WAY_ID.insightfulStrike,
    INNER_WAY_ID.bitterSeason,
  ],
  classSpecificAttunements: [
    "swordQ",
    "swordCharged",
    "swordSpecial",
    "spearCharged",
    "spearSpecial",
  ],
  weapons: ["Sword", "Spear"],
  critBoostWeaponTypes: [],
  skills: withUniversalSkills(CLASS_ID, "Bellstrike", SKILLS),
  debuffs: DEBUFFS,
  ...rotationPoolFor(CLASS_ID),
  graduationBuild: BELLSTRIKE_SPLENDOR_GRADUATION_BUILD,
  classBuffDefs: [
    endlessGale,
    swordSlashDamageBoost,
    swordEnergyEnhancement,
    swordEnergyHpDamage,
    qiImbalance,
    belowSixtyEndurance,
  ],
  gateBuffs: [],
  mechanics: [],
  skillBehaviors: [],
  displayGates: [],
  poisonExtensions: [],
})
