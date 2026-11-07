import type {
  AttributeKey,
  EngineRunOptions,
  GearLevel,
  GearWordId,
  Inputs,
  ItemRankingRow,
  WeaponName,
} from "./types"
import { ATTRIBUTE_KEYS, isWeaponName } from "./types"
import type { Skill } from "./skill"
import { runEngine, TOTALS_RUN } from "./dps"
import { getSchool } from "./panel"
import {
  GEAR_WORD_UNIT,
  gearWordIdForPath,
  gearWordMaxRoll,
  statLineLabel,
} from "../data/stats/statLines"
import { statLineKey } from "../i18n/contentKeys"
import {
  AGILITY_PER_POINT,
  MOMENTUM_PER_POINT,
  POWER_PER_POINT,
} from "../definitions/baseStats/attributeConversion"
import { WEAPON_BOOST_STAT_KEY } from "../data/stats/weaponBoosts"
import { attunementLabelKey, attunementMax, attunementsForClass } from "./attunements"
import { addStatDelta, resolveEnginePath } from "./statPaths"
import { builtinSkillsForClass, defaultRotationForClass } from "./builtinLibrary"
import { gearLevelForBreakthrough } from "../definitions/baseStats/breakthroughs"
import { resolveRotation } from "./rotation"

export interface WordSpec<TName extends string = string> {
  word: TName
  label: string
  labelKey: string
  amount: number
  unit: "raw" | "percent"
  apply(inputs: Inputs, roll?: number): Inputs
}

export function getWordSpecs(inputs: Inputs, level: GearLevel): WordSpec<GearWordId>[] {
  return buildWordSpecs(inputs, level)
}

function rotationWeapons(inputs: Inputs): WeaponName[] {
  const active = inputs.activeCustomRotation
  const rotation =
    active && active.classId === inputs.classId ? active : defaultRotationForClass(inputs.classId)
  if (!rotation) return []

  const byId = new Map<string, Skill>()
  for (const s of builtinSkillsForClass(inputs.classId)) byId.set(s.id, s)
  for (const s of inputs.customSkills ?? []) byId.set(s.id, s)
  const pool = [...byId.values()]

  const { steps } = resolveRotation(rotation, pool, [])
  const counts: Record<string, number> = {}
  for (const { skill } of steps) {
    if (skill.weaponOrAttribute)
      counts[skill.weaponOrAttribute] = (counts[skill.weaponOrAttribute] ?? 0) + skill.hits.length
  }
  return Object.entries(counts)
    .sort((first, second) => second[1] - first[1])
    .map(([weapon]) => weapon)
    .filter(isWeaponName)
}

function buildWordSpecs(inputs: Inputs, level: GearLevel): WordSpec<GearWordId>[] {
  function wordSpec(
    word: GearWordId,
    applyRoll: (inputs: Inputs, roll: number) => void,
  ): WordSpec<GearWordId> {
    const ceiling = gearWordMaxRoll(word, level)
    return {
      word,
      label: statLineLabel(word),
      labelKey: statLineKey(word),
      amount: ceiling,
      unit: GEAR_WORD_UNIT[word],
      apply: (inputs, roll = ceiling) => clone(inputs, (next) => applyRoll(next, roll)),
    }
  }

  const school = getSchool(inputs.classId)
  const weapons = rotationWeapons(inputs)
  const schoolWeapons = school.martialArts.map((martialArt) => martialArt.weaponType)
  const primaryWeapon = weapons[0] ?? schoolWeapons[0] ?? null
  const secondaryWeapon = weapons[1] ?? schoolWeapons[1] ?? null
  const specs: WordSpec<GearWordId>[] = [
    wordSpec("power", (x, roll) => {
      x.phys.min += roll * POWER_PER_POINT.minPhys
      x.phys.max += roll * POWER_PER_POINT.maxPhys
    }),
    wordSpec("agility", (x, roll) => {
      x.phys.min += roll * AGILITY_PER_POINT.minPhys
      x.critRate += roll * AGILITY_PER_POINT.critRate
    }),
    wordSpec("momentum", (x, roll) => {
      x.phys.max += roll * MOMENTUM_PER_POINT.maxPhys
      x.affinityRate += roll * MOMENTUM_PER_POINT.affinityRate
    }),
    wordSpec("minPhys", (x, roll) => {
      x.phys.min += roll
    }),
    wordSpec("maxPhys", (x, roll) => {
      x.phys.max += roll
    }),
    wordSpec("precision", (x, roll) => {
      x.precision += roll
    }),
    wordSpec("crit", (x, roll) => {
      x.critRate += roll
    }),
    wordSpec("affinity", (x, roll) => {
      x.affinityRate += roll
    }),
    wordSpec("allMartialBoost", (x, roll) => {
      x.allMartialBoost += roll
    }),
    wordSpec("maxHp", () => {}),
    wordSpec("body", () => {}),
    wordSpec("defense", () => {}),
    wordSpec("physDef", () => {}),
    wordSpec("damageVsPlayer", () => {}),
  ]
  for (const weapon of [primaryWeapon, secondaryWeapon]) {
    if (!weapon) continue
    const weaponWordId = gearWordIdForPath(WEAPON_BOOST_STAT_KEY[weapon])
    if (!weaponWordId) continue
    specs.push(
      wordSpec(weaponWordId, (x, roll) => {
        applyWeaponBoost(x, weapon, roll)
      }),
    )
  }

  specs.push(
    wordSpec("damageVsBoss", (x, roll) => {
      x.bossBoost += roll
    }),
    wordSpec("singleTargetMysticBoost", (x, roll) => {
      x.singleMysticBoost += roll
    }),
    wordSpec("areaMysticBoost", (x, roll) => {
      x.areaMysticBoost += roll
    }),
    wordSpec("allMysticBoost", (x, roll) => {
      x.allMysticBoost += roll
    }),
    ...ATTRIBUTE_KEYS.flatMap((attribute) => [
      wordSpec(`min${attribute}`, (x, roll) => {
        applyAttrAttack(x, attribute, "min", roll)
      }),
      wordSpec(`max${attribute}`, (x, roll) => {
        applyAttrAttack(x, attribute, "max", roll)
      }),
    ]),
    wordSpec("minFormless", (x, roll) => {
      applyAttrAttack(x, school.primaryAttribute, "min", roll)
    }),
    wordSpec("maxFormless", (x, roll) => {
      applyAttrAttack(x, school.primaryAttribute, "max", roll)
    }),
    wordSpec("physicalPenetration", (x, roll) => {
      x.phys.penetration += roll
    }),
    wordSpec("formlessPenetration", (x, roll) => {
      applyAttrPenetration(x, school.primaryAttribute, roll)
    }),
  )
  return specs.filter((spec) => spec.amount > 0)
}

const ATTUNEMENTS_ALREADY_LISTED_AS_WORDS = new Set(["physPen", "formlessPen"])

function buildAttunementSpecs(inputs: Inputs, level: GearLevel): WordSpec[] {
  return attunementsForClass(inputs.classId)
    .filter((opt) => !ATTUNEMENTS_ALREADY_LISTED_AS_WORDS.has(opt.id))
    .filter((opt) => attunementMax(opt, level) > 0)
    .map((opt) => {
      const ceiling = attunementMax(opt, level)
      return {
        word: opt.id,
        label: opt.label,
        labelKey: attunementLabelKey(opt, inputs.classId),
        amount: ceiling,
        unit: "percent" as const,
        apply: (i: Inputs, roll = ceiling) =>
          clone(i, (x) => {
            if (!opt.enginePath) return
            addStatDelta(x, resolveEnginePath(opt.enginePath, x), roll)
          }),
      }
    })
}

function applyWeaponBoost(i: Inputs, weapon: WeaponName, amt: number) {
  const key = WEAPON_BOOST_STAT_KEY[weapon]
  if (!key) return
  const target = i as unknown as Record<string, number>
  target[key] = (target[key] ?? 0) + amt
}

function applyAttrPenetration(i: Inputs, attr: AttributeKey, amt: number) {
  const block =
    attr === "Bellstrike"
      ? i.bellstrike
      : attr === "Stonesplit"
        ? i.stonesplit
        : attr === "Silkbind"
          ? i.silkbind
          : i.bamboocut
  block.penetration += amt
}

function applyAttrAttack(i: Inputs, attr: AttributeKey, field: "min" | "max", amt: number) {
  const block =
    attr === "Bellstrike"
      ? i.bellstrike
      : attr === "Stonesplit"
        ? i.stonesplit
        : attr === "Silkbind"
          ? i.silkbind
          : i.bamboocut
  block[field] += amt
}

export interface RankingBlock {
  index: number
  count: number
}

interface CatalogueEntry {
  source: ItemRankingRow["source"]
  spec: WordSpec
}

function rankingCatalogue(inputs: Inputs): CatalogueEntry[] {
  const level = gearLevelForBreakthrough(inputs.breakthrough)
  return [
    ...buildWordSpecs(inputs, level).map((spec) => ({ source: "tunement" as const, spec })),
    ...buildAttunementSpecs(inputs, level).map((spec) => ({ source: "attunement" as const, spec })),
  ]
}

export function rankingRows(
  inputs: Inputs,
  baseDps: number,
  options: EngineRunOptions = TOTALS_RUN,
  block?: RankingBlock,
): ItemRankingRow[] {
  const catalogue = rankingCatalogue(inputs)
  const blockStart = block ? Math.floor((catalogue.length * block.index) / block.count) : 0
  const blockEnd = block
    ? Math.floor((catalogue.length * (block.index + 1)) / block.count)
    : catalogue.length
  return catalogue.slice(blockStart, blockEnd).map(({ source, spec }) => {
    const withSpec = runEngine(spec.apply(inputs), options)
    return {
      statLineId: spec.word,
      label: spec.label,
      labelKey: spec.labelKey,
      source,
      amount: spec.amount,
      unit: spec.unit,
      expectedDps: withSpec.dps,
      dpsDelta: withSpec.dps - baseDps,
      liftPercent: baseDps > 0 ? withSpec.dps / baseDps - 1 : 0,
      leadVsMin: 0,
    }
  })
}

export function withLeadVsMin(rows: readonly ItemRankingRow[]): ItemRankingRow[] {
  const positive = rows.filter((row) => row.liftPercent > 0.001).map((row) => row.liftPercent)
  const minPositive = positive.length ? Math.min(...positive) : 0
  return rows.map((row) => ({
    ...row,
    leadVsMin:
      row.liftPercent > 0.001 && minPositive > 0 ? row.liftPercent / minPositive - 1 : "(none)",
  }))
}

export function computeRanking(
  inputs: Inputs,
  baseDps: number,
  options: EngineRunOptions = TOTALS_RUN,
): ItemRankingRow[] {
  return withLeadVsMin(rankingRows(inputs, baseDps, options))
}

function clone(i: Inputs, mut: (x: Inputs) => void): Inputs {
  const next: Inputs = {
    ...i,
    phys: { ...i.phys },
    bellstrike: { ...i.bellstrike },
    stonesplit: { ...i.stonesplit },
    silkbind: { ...i.silkbind },
    bamboocut: { ...i.bamboocut },
    classSpecificAttunement: { ...i.classSpecificAttunement },
    mindMethods: i.mindMethods.map((m) => ({ ...m })) as Inputs["mindMethods"],
  }
  mut(next)
  return next
}
