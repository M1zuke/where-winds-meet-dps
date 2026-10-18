import { SCRIPT_IDS, SCRIPT_MIN_BREAKTHROUGH } from "../data/skills/buffs/scriptOptions"
import { ATTACK_FOODS, HP_FOODS, type AttackFoodId, type HpFoodId } from "../data/consumables/foods"
import { QI_TARGET_IDS, type QiTargetId } from "../definitions/baseStats/qiTargetDef"
import {
  appliedRefinement,
  DIVINECRAFT_ELEMENTS,
  refinementsOf,
  type DivinecraftElement,
  type DivinecraftRefinementId,
} from "../data/consumables/divinecraftRefinements"
import { defaultCombatSettings, type CombatSettings, type Inputs, type ScriptId } from "./types"

export type EncounterCategory = "food" | "divinecraft" | "scripts" | "teammate" | "extras"

export const ENCOUNTER_CATEGORIES: readonly EncounterCategory[] = [
  "food",
  "divinecraft",
  "scripts",
  "teammate",
  "extras",
]

export type EncounterGroup =
  "attackFood" | "hpFood" | "consumables" | "party" | "sharedDebuffs" | "dragonHead" | "qiTarget"

export interface EncounterOption {
  id: string
  category: EncounterCategory
  group: EncounterGroup | null
  kind: "toggle" | "choice"
  minBreakthrough: number
  countsAsActive: boolean
  isSelected(inputs: Inputs): boolean
  select(inputs: Inputs): Inputs
}

type CombatToggleField = {
  [Field in keyof CombatSettings]: CombatSettings[Field] extends boolean ? Field : never
}[keyof CombatSettings]

type InputsToggleField = "shareDebuff5HenZhi" | "shareEasyHurt"

export const divinecraftOptionId = (divinecraft: DivinecraftElement | null): string =>
  `divinecraft:${divinecraft ?? "none"}`
export const refinementOptionId = (refinement: DivinecraftRefinementId): string =>
  `divinecraftRefinement:${refinement}`
export const attackFoodOptionId = (food: AttackFoodId | null): string => `food:${food ?? "none"}`
export const hpFoodOptionId = (food: HpFoodId | null): string => `hpFood:${food ?? "none"}`
export const scriptOptionId = (script: ScriptId | null): string => `script:${script ?? "none"}`
export const qiTargetOptionId = (qiTarget: QiTargetId): string => `qiTarget:${qiTarget}`

export const effectiveQiTarget = (inputs: Inputs): QiTargetId => inputs.qiTarget ?? "swordTrial"

export const combatSettingsOf = (inputs: Inputs): CombatSettings =>
  inputs.combatSettings ?? defaultCombatSettings()

function inputsToggle(
  field: InputsToggleField,
  category: EncounterCategory,
  group: EncounterGroup | null,
): EncounterOption {
  return {
    id: field,
    category,
    group,
    kind: "toggle",
    minBreakthrough: 0,
    countsAsActive: true,
    isSelected: (inputs) => inputs[field],
    select: (inputs) => ({ ...inputs, [field]: !inputs[field] }),
  }
}

function combatToggle(
  field: CombatToggleField,
  category: EncounterCategory,
  group: EncounterGroup | null,
): EncounterOption {
  return {
    id: field,
    category,
    group,
    kind: "toggle",
    minBreakthrough: 0,
    countsAsActive: true,
    isSelected: (inputs) => combatSettingsOf(inputs)[field],
    select: (inputs) => {
      const settings = combatSettingsOf(inputs)
      return { ...inputs, combatSettings: { ...settings, [field]: !settings[field] } }
    },
  }
}

const ATTACK_FOOD_OPTIONS: EncounterOption[] = [
  { id: null, minBreakthrough: 0 },
  ...ATTACK_FOODS,
].map((food) => ({
  id: attackFoodOptionId(food.id),
  category: "food",
  group: "attackFood",
  kind: "choice",
  minBreakthrough: food.minBreakthrough,
  countsAsActive: food.id !== null,
  isSelected: (inputs) => inputs.food === food.id,
  select: (inputs) => ({ ...inputs, food: food.id }),
}))

const HP_FOOD_OPTIONS: EncounterOption[] = [{ id: null, minBreakthrough: 0 }, ...HP_FOODS].map(
  (food) => ({
    id: hpFoodOptionId(food.id),
    category: "food",
    group: "hpFood",
    kind: "choice",
    minBreakthrough: food.minBreakthrough,
    countsAsActive: food.id !== null,
    isSelected: (inputs) => inputs.hpFood === food.id,
    select: (inputs) => ({ ...inputs, hpFood: food.id }),
  }),
)

function divinecraftOption(
  element: DivinecraftElement | null,
  refinementId: DivinecraftRefinementId | null,
): EncounterOption {
  return {
    id: refinementId ? refinementOptionId(refinementId) : divinecraftOptionId(element),
    category: "divinecraft",
    group: null,
    kind: "choice",
    minBreakthrough: 0,
    countsAsActive: element !== null,
    isSelected: (inputs) =>
      inputs.divinecraft === element && (appliedRefinement(inputs)?.id ?? null) === refinementId,
    select: (inputs) => ({ ...inputs, divinecraft: element, divinecraftRefinement: refinementId }),
  }
}

const DIVINECRAFT_OPTIONS: EncounterOption[] = [
  divinecraftOption(null, null),
  ...DIVINECRAFT_ELEMENTS.flatMap((element) => [
    divinecraftOption(element, null),
    ...refinementsOf(element).map((refinement) => divinecraftOption(element, refinement.id)),
  ]),
]

function scriptOption(script: ScriptId | null): EncounterOption {
  return {
    id: scriptOptionId(script),
    category: "scripts",
    group: null,
    kind: "choice",
    minBreakthrough: script === null ? 0 : SCRIPT_MIN_BREAKTHROUGH[script],
    countsAsActive: script !== null,
    isSelected: (inputs) => combatSettingsOf(inputs).script === script,
    select: (inputs) => ({
      ...inputs,
      combatSettings: { ...combatSettingsOf(inputs), script },
    }),
  }
}

const SCRIPT_OPTIONS: EncounterOption[] = [null, ...SCRIPT_IDS].map(scriptOption)

const QI_TARGET_OPTIONS: EncounterOption[] = QI_TARGET_IDS.map((qiTarget) => ({
  id: qiTargetOptionId(qiTarget),
  category: "extras",
  group: "qiTarget",
  kind: "choice",
  minBreakthrough: 0,
  countsAsActive: false,
  isSelected: (inputs) => effectiveQiTarget(inputs) === qiTarget,
  select: (inputs) => ({ ...inputs, qiTarget }),
}))

export const ENCOUNTER_OPTIONS: readonly EncounterOption[] = [
  ...ATTACK_FOOD_OPTIONS,
  ...HP_FOOD_OPTIONS,
  combatToggle("fragrantOrchidBathBean", "food", "consumables"),
  ...DIVINECRAFT_OPTIONS,
  ...SCRIPT_OPTIONS,
  combatToggle("healerBuff", "teammate", "party"),
  combatToggle("healerPanaceaFan", "teammate", "party"),
  combatToggle("breakExtension", "teammate", "party"),
  combatToggle("dragonsBreath", "teammate", "party"),
  inputsToggle("shareDebuff5HenZhi", "teammate", "sharedDebuffs"),
  inputsToggle("shareEasyHurt", "teammate", "sharedDebuffs"),
  combatToggle("dragonHeadFullStacks", "extras", "dragonHead"),
  combatToggle("dragonHeadLowHpMaxBonus", "extras", "dragonHead"),
  ...QI_TARGET_OPTIONS,
]

export const isEncounterOptionAvailable = (option: EncounterOption, inputs: Inputs): boolean =>
  option.minBreakthrough <= inputs.breakthrough

export function encounterOptionsOf(category: EncounterCategory): EncounterOption[] {
  return ENCOUNTER_OPTIONS.filter((option) => option.category === category)
}

export function activeEncounterOptionCount(inputs: Inputs, category?: EncounterCategory): number {
  return ENCOUNTER_OPTIONS.filter(
    (option) =>
      (category === undefined || option.category === category) &&
      option.countsAsActive &&
      isEncounterOptionAvailable(option, inputs) &&
      option.isSelected(inputs),
  ).length
}

export function encounterOptionVariants(
  inputs: Inputs,
  category: EncounterCategory,
): { id: string; inputs: Inputs }[] {
  return encounterOptionsOf(category)
    .filter(
      (option) =>
        isEncounterOptionAvailable(option, inputs) &&
        !(option.kind === "choice" && option.isSelected(inputs)),
    )
    .map((option) => ({ id: option.id, inputs: option.select(inputs) }))
}

const ENCOUNTER_FIELDS = [
  "food",
  "hpFood",
  "divinecraft",
  "divinecraftRefinement",
  "shareDebuff5HenZhi",
  "shareEasyHurt",
  "qiTarget",
  "combatSettings",
  "dummyMode",
] as const satisfies readonly (keyof Inputs)[]

type EncounterFields = Pick<Inputs, (typeof ENCOUNTER_FIELDS)[number]>

function encounterFieldsOf(inputs: Inputs): EncounterFields {
  return Object.fromEntries(
    ENCOUNTER_FIELDS.map((field) => [field, inputs[field]]),
  ) as EncounterFields
}

export const withEncounterFieldsOf = (target: Inputs, source: Inputs): Inputs => ({
  ...target,
  ...encounterFieldsOf(source),
})

export const encounterFieldsEqual = (left: Inputs, right: Inputs): boolean =>
  JSON.stringify(encounterFieldsOf(left)) === JSON.stringify(encounterFieldsOf(right))

export interface EncounterOptionDps {
  baselineDps: number
  dpsByOption: Record<string, number>
}

export function encounterOptionDpsValue(
  option: EncounterOption,
  inputs: Inputs,
  dps: EncounterOptionDps,
): number | null {
  const selected = option.isSelected(inputs)
  if (option.kind === "choice" && selected) return dps.baselineDps
  const variantDps = dps.dpsByOption[option.id]
  if (variantDps === undefined) return null
  if (option.kind === "choice") return variantDps
  return selected ? dps.baselineDps - variantDps : variantDps - dps.baselineDps
}

export function sortEncounterOptionsByDps(
  options: readonly EncounterOption[],
  inputs: Inputs,
  dps: EncounterOptionDps | null,
  previousOrder: readonly string[],
): EncounterOption[] {
  const rankOf = (option: EncounterOption): number => {
    const rank = previousOrder.indexOf(option.id)
    return rank === -1 ? Number.POSITIVE_INFINITY : rank
  }
  const keyed = options.map((option) => ({
    option,
    value: dps ? (encounterOptionDpsValue(option, inputs, dps) ?? Number.NEGATIVE_INFINITY) : 0,
    rank: rankOf(option),
  }))
  keyed.sort((left, right) =>
    dps
      ? right.value === left.value
        ? 0
        : right.value > left.value
          ? 1
          : -1
      : left.rank === right.rank
        ? 0
        : left.rank > right.rank
          ? 1
          : -1,
  )
  return keyed.map((entry) => entry.option)
}
