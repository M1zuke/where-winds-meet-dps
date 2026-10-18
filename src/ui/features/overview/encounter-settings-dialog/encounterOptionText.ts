import { ATTACK_FOODS, HP_FOODS, type AttackFood } from "../../../../data/consumables/foods"
import {
  DIVINECRAFT_REFINEMENTS,
  type RefinementBuff,
} from "../../../../data/consumables/divinecraftRefinements"
import { SCRIPT_IDS, SCRIPT_LABEL_KEYS } from "../../../../data/skills/buffs/scriptOptions"
import {
  attackFoodOptionId,
  divinecraftOptionId,
  hpFoodOptionId,
  refinementOptionId,
  scriptOptionId,
  type EncounterCategory,
  type EncounterGroup,
} from "../../../../engine/encounterOptions"
import type { EncounterIconName } from "../encounter-icon/EncounterIcon"

export const CATEGORY_LABEL_KEYS: Record<EncounterCategory, string> = {
  food: "overview.encounterSettings.categoryFood",
  divinecraft: "overview.encounterSettings.divinecraft",
  scripts: "overview.encounterSettings.categoryScripts",
  teammate: "overview.encounterSettings.teammateBuffs",
  extras: "overview.encounterSettings.categoryExtras",
}

export const CATEGORY_HINT_KEYS: Record<EncounterCategory, string> = {
  food: "overview.encounterSettings.hintFood",
  divinecraft: "overview.encounterSettings.hintDivinecraft",
  scripts: "overview.encounterSettings.hintScripts",
  teammate: "overview.encounterSettings.hintTeammate",
  extras: "overview.encounterSettings.hintExtras",
}

export const CATEGORY_ICONS: Record<EncounterCategory, EncounterIconName> = {
  food: "food",
  divinecraft: "divinecraft",
  scripts: "scripts",
  teammate: "teammate",
  extras: "extras",
}

export const GROUP_LABEL_KEYS: Record<EncounterGroup, string> = {
  attackFood: "overview.encounterSettings.groupAttackFood",
  hpFood: "overview.encounterSettings.groupHpFood",
  consumables: "overview.encounterSettings.groupConsumables",
  party: "overview.encounterSettings.groupParty",
  sharedDebuffs: "overview.encounterSettings.sharedDebuffs",
  dragonHead: "overview.encounterSettings.groupDragonHead",
  qiTarget: "overview.encounterSettings.qiTarget",
}

export const OPTION_LABEL_KEYS: Record<string, string> = {
  "food:none": "common.none2",
  "food:rotisserieVenison": "overview.encounterSettings.foodRotisserieVenison",
  "food:crispyPheasant": "overview.encounterSettings.foodCrispyPheasant",
  "food:doubleShreds": "overview.encounterSettings.foodDoubleShreds",
  "food:camelMilkWine": "overview.encounterSettings.foodCamelMilkWine",
  "food:wildGinsengMeatballs": "overview.encounterSettings.foodWildGinsengMeatballs",
  "food:simmeringFishSlices": "overview.encounterSettings.foodSimmeringFishSlices",
  "food:clayOvenFlatbread": "overview.encounterSettings.foodClayOvenFlatbread",
  "food:jadescaleSlices": "overview.encounterSettings.foodJadescaleSlices",
  "food:twinImmortalsStew": "overview.encounterSettings.foodTwinImmortalsStew",
  "food:caiNengjiaAttackBun": "overview.encounterSettings.foodCaiNengjiaSpecialBun",
  "hpFood:none": "common.none2",
  "hpFood:fruitCreamRolls": "overview.encounterSettings.foodFruitCreamRolls",
  "hpFood:braisedSnakehead": "overview.encounterSettings.foodBraisedSnakehead",
  "hpFood:wineBraisedPork": "overview.encounterSettings.foodWineBraisedPork",
  "hpFood:wheatFriedMushrooms": "overview.encounterSettings.foodWheatFriedMushrooms",
  "hpFood:persimmonPastry": "overview.encounterSettings.foodPersimmonPastry",
  "hpFood:lotusSoup": "overview.encounterSettings.foodLotusSoup",
  fragrantOrchidBathBean: "overview.encounterSettings.fragrantOrchidBathBean",
  "divinecraft:none": "common.none2",
  "divinecraft:fire": "overview.encounterSettings.fireOil",
  "divinecraft:water": "overview.encounterSettings.aquaWax",
  "divinecraft:poison": "overview.encounterSettings.poison",
  "divinecraftRefinement:cinderAsh": "overview.encounterSettings.cinderAsh",
  "divinecraftRefinement:scorchingFlame": "overview.encounterSettings.scorchingFlame",
  "divinecraftRefinement:deepPool": "overview.encounterSettings.deepPool",
  "divinecraftRefinement:vastOcean": "overview.encounterSettings.vastOcean",
  "divinecraftRefinement:vipersFire": "overview.encounterSettings.vipersFire",
  "divinecraftRefinement:condensedMalice": "overview.encounterSettings.condensedMalice",
  "script:none": "common.none2",
  ...Object.fromEntries(SCRIPT_IDS.map((id) => [scriptOptionId(id), SCRIPT_LABEL_KEYS[id]])),
  healerBuff: "overview.encounterSettings.healerBuff",
  healerPanaceaFan: "overview.encounterSettings.healerPanaceaFan",
  breakExtension: "overview.encounterSettings.breakExtension",
  dragonsBreath: "overview.encounterSettings.dragonSBreath",
  shareDebuff5HenZhi: "overview.encounterSettings.bitterSeasonFromATeammate",
  shareEasyHurt: "overview.encounterSettings.tankSpearDebuffVulnerability",
  dragonHeadFullStacks: "overview.encounterSettings.dragonHeadFullStacks",
  dragonHeadLowHpMaxBonus: "overview.encounterSettings.dragonHeadLowHpMaxBonus",
  "qiTarget:swordTrial": "overview.encounterSettings.qiTargetSwordTrial",
  "qiTarget:swordTrialResistanceUp": "overview.encounterSettings.qiTargetSwordTrialResistanceUp",
  "qiTarget:herosRealm": "overview.encounterSettings.qiTargetHerosRealm",
}

export const OPTION_HINT_KEYS: Record<string, string> = {
  "divinecraft:none": "overview.encounterSettings.noEnchantHint",
  "divinecraft:fire": "overview.encounterSettings.fireOilHint",
  "divinecraft:water": "overview.encounterSettings.aquaWaxHint",
  "divinecraft:poison": "overview.encounterSettings.poisonHint",
  fragrantOrchidBathBean: "overview.encounterSettings.fragrantOrchidBathBeanHint",
  "script:opportunityScript": "overview.encounterSettings.opportunityScriptHint",
  "script:detachmentScript": "overview.encounterSettings.detachmentScriptHint",
  "script:insightScript": "overview.encounterSettings.insightScriptHint",
  "script:wraithstrikeScript": "overview.encounterSettings.wraithstrikeScriptHint",
  "script:voidrotScript": "overview.encounterSettings.voidrotScriptHint",
  "script:convergenceScript": "overview.encounterSettings.convergenceScriptHint",
  "script:voidskyScript": "overview.encounterSettings.voidskyScriptHint",
  "script:soullinkScript": "overview.encounterSettings.soullinkScriptHint",
  "script:purewrathScript": "overview.encounterSettings.purewrathScriptHint",
  "script:karmaScript": "overview.encounterSettings.karmaScriptHint",
  "script:chaosScript": "overview.encounterSettings.chaosScriptHint",
  "script:wavebornScript": "overview.encounterSettings.wavebornScriptHint",
  "script:clearfallScript": "overview.encounterSettings.clearfallScriptHint",
}

const REFINEMENT_BUFF_HINT_KEYS: Record<RefinementBuff, string> = {
  heartPoison: "overview.encounterSettings.heartPoisonHint",
  temperedFire: "overview.encounterSettings.temperedFireHint",
  nourishingWater: "overview.encounterSettings.nourishingWaterHint",
}

const PHYS_ATTACK_FOOD_HINT_KEYS = {
  beforeMultiplier: "overview.encounterSettings.foodPhysAttackHint",
  afterMultiplier: "overview.encounterSettings.foodFlatPhysAttackHint",
} as const

const HP_FOOD_HINT_KEY = "overview.encounterSettings.foodMaxHpHint"

const groupedThousands = (value: number): string =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ")

function attackFoodHint(food: AttackFood, t: (key: string) => string): string {
  return t(PHYS_ATTACK_FOOD_HINT_KEYS[food.channel])
    .replace("{min}", String(food.physAttack.min))
    .replace("{max}", String(food.physAttack.max))
}

export function optionHintText(optionId: string, t: (key: string) => string): string | null {
  const attackFood = ATTACK_FOODS.find((food) => attackFoodOptionId(food.id) === optionId)
  if (attackFood) return attackFoodHint(attackFood, t)
  const refinement = DIVINECRAFT_REFINEMENTS.find(
    (candidate) => refinementOptionId(candidate.id) === optionId,
  )
  if (refinement) {
    return `${t(OPTION_HINT_KEYS[divinecraftOptionId(refinement.element)])}; ${t(REFINEMENT_BUFF_HINT_KEYS[refinement.buff])}`
  }
  const hpFood = HP_FOODS.find((food) => hpFoodOptionId(food.id) === optionId)
  if (hpFood) return t(HP_FOOD_HINT_KEY).replace("{hp}", groupedThousands(hpFood.maxHp))
  return OPTION_HINT_KEYS[optionId] ? t(OPTION_HINT_KEYS[optionId]) : null
}
