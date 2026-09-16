import { defineClass } from "../../../definitions/classes/classDef"
import { CLASS_ID, SKILLS } from "../../skills/bellstrike-splendor"
import { DEBUFFS } from "../../skills/bellstrike-splendor/debuffs"
import { withUniversalSkills } from "../../../definitions/skills/universalSkills"
import { rotationsFor } from "../../../definitions/rotations/registry"
import defaultRotation from "./rotations/kaezuma42Vs1Db"
import { INNER_WAY_ID } from "../../innerWays/ids"
import { MARTIAL_ART_ID } from "../../martialArts/ids"
import { belowSixtyEndurance } from "../../skills/bellstrike-splendor/buffs/belowSixtyEndurance"
import { endlessGale } from "../../skills/bellstrike-splendor/buffs/endlessGale"
import { qiImbalance } from "../../skills/bellstrike-splendor/buffs/qiImbalance"
import { swordEnergyEnhancement } from "../../skills/bellstrike-splendor/buffs/swordEnergyEnhancement"
import { swordEnergyHpDamage } from "../../skills/bellstrike-splendor/buffs/swordEnergyHpDamage"
import { swordSlashDamageBoost } from "../../skills/bellstrike-splendor/buffs/swordSlashDamageBoost"
import {
  namelessSpearAdditionalAttack,
  namelessSwordAdditionalAttack,
} from "../../skills/bellstrike-splendor/buffs/additionalAttack"

export const bellstrikeSplendor = defineClass({
  id: CLASS_ID,
  displayName: "Bellstrike Splendor",
  validated: true,
  spec: "bellstrike_splendor",
  primaryAttribute: "Bellstrike",
  attributeMultiplier: 1.5,
  classMindGroup: INNER_WAY_ID.swordMorph,
  allowedMindMethods: [
    INNER_WAY_ID.battleAnthem,
    INNER_WAY_ID.mountainsMight,
    INNER_WAY_ID.moraleChant,
    INNER_WAY_ID.insightfulStrike,
    INNER_WAY_ID.bitterSeason,
    INNER_WAY_ID.breakingPoint,
  ],
  classSpecificAttunements: [
    "swordQ",
    "swordCharged",
    "swordSpecial",
    "spearCharged",
    "spearSpecial",
  ],
  weapons: [MARTIAL_ART_ID.namelessSword, MARTIAL_ART_ID.namelessSpear],
  critBoostWeaponTypes: [],
  skills: withUniversalSkills(CLASS_ID, "Bellstrike", SKILLS),
  debuffs: DEBUFFS,
  rotations: rotationsFor(CLASS_ID),
  defaultRotationId: defaultRotation.id,
  classBuffDefs: [
    endlessGale,
    swordSlashDamageBoost,
    swordEnergyEnhancement,
    swordEnergyHpDamage,
    qiImbalance,
    belowSixtyEndurance,
    namelessSwordAdditionalAttack,
    namelessSpearAdditionalAttack,
  ],
  gateBuffs: [],
  mechanics: [],
  skillBehaviors: [],
  displayGates: [],
  poisonExtensions: [],
})
