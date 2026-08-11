import { defineClass } from "./define"
import { CLASS_ID, SKILLS } from "../skills/bellstrike-umbra"
import { withUniversalSkills } from "../skills"
import { DEBUFFS } from "../skills/bellstrike-umbra/debuffs"
import { SKILL } from "../skills/bellstrike-umbra/ids"
import { BUFF } from "../skills/buffs/ids"
import { rotationPoolFor } from "../rotations"
import { BELLSTRIKE_POOL } from "./retunementPools"
import { declareMechanic, MECHANIC_ORDER } from "../../engine/mechanics"
import { concentration } from "../skills/buffs/concentration"
import { revelryScript } from "../skills/buffs/revelryScript"
import { fluteBoost } from "../skills/buffs/fluteBoost"
import { potentRiverFlow } from "../skills/bellstrike-umbra/buffs/potentRiverFlow"
import { wineGu } from "../skills/bellstrike-umbra/buffs/wineGu"
import { crosswindSpirit } from "../skills/bellstrike-umbra/buffs/crosswindSpirit"
import { soulShaken } from "../skills/bellstrike-umbra/buffs/soulShaken"
import { bellstrikeUmbraBleedPen } from "../skills/bellstrike-umbra/buffs/bleedPen"
import { bellstrikeUmbraBleedingDamage } from "../skills/bellstrike-umbra/buffs/bleedingDamage"
import {
  BELLSTRIKE_UMBRA_GATES,
  ZENITH_DETONATION_BUFF_ID,
  ZENITH_MAX_EXTENDED_DURATION_FRAMES,
} from "./bellstrikeUmbraGates"
import { levelAttributeBonusMechanic } from "./bellstrikeUmbraLevelBonus"
import { concentrationMechanic, concentrationAvailable } from "./bellstrikeUmbraConcentration"
import { crosswindBehavior } from "./bellstrikeUmbraCrosswind"

export const bellstrikeUmbra = defineClass({
  id: CLASS_ID,
  displayName: "Bellstrike Umbra",
  validated: true,
  spec: "bellstrike_umbra",
  primaryAttribute: "Bellstrike",
  attributeMultiplier: 51.5,
  classMindGroup: "swordHorizon",
  allowedMindMethods: ["wolfchasersArt", "insightfulStrike", "moraleChant", "bitterSeason"],
  dingYinTags: ["Bleed Boost"],
  weapons: ["Sword", "Spear"],
  // `.tmp/site/deobfuscated.js` ~L42153-42160 gates the min-phys crit-damage
  // bonus on a weapon match against `grantsCritBoost === true` items — neither
  // of Umbra's (Strategic Sword, Heavenquaker Spear) is one.
  critBoostWeaponTypes: [],
  skills: withUniversalSkills(CLASS_ID, "Bellstrike", SKILLS),
  debuffs: DEBUFFS,
  ...rotationPoolFor(CLASS_ID),
  retunementPool: BELLSTRIKE_POOL,
  classBuffDefs: [
    concentration,
    potentRiverFlow,
    wineGu,
    crosswindSpirit,
    revelryScript,
    fluteBoost,
  ],
  mechanicBuffDefs: [soulShaken, bellstrikeUmbraBleedPen, bellstrikeUmbraBleedingDamage],
  gateBuffs: BELLSTRIKE_UMBRA_GATES,
  mechanics: [
    declareMechanic(levelAttributeBonusMechanic, MECHANIC_ORDER.levelAttributeBonus),
    declareMechanic(concentrationMechanic, MECHANIC_ORDER.concentration),
  ],
  skillBehaviors: [{ skillId: SKILL.bleedDetonation, factory: crosswindBehavior }],
  displayGates: [{ defId: BUFF.concentration, predicate: concentrationAvailable }],
  // Sword Horizon's Zenith detonation extends an active Bitter Season poison.
  poisonExtensions: [
    {
      statusId: ZENITH_DETONATION_BUFF_ID,
      maxRemainingSec: ZENITH_MAX_EXTENDED_DURATION_FRAMES / 60,
    },
  ],
})
