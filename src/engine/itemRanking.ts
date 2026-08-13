import type { AttributeKey, GearWordId, Inputs, ItemRankingRow, WeaponName } from "./types"
import { ATTRIBUTE_KEYS, isWeaponName } from "./types"
import type { Skill } from "./skill"
import { runEngine } from "./dps"
import { getSchool } from "./panel"
import {
  GEAR_WORD_MAX_ROLL,
  GEAR_WORD_UNIT,
  gearWordIdForPath,
  statLineLabel,
} from "../data/stats/statLines"
import { WEAPON_BOOST_STAT_KEY } from "./statRegistry"
import { attunementsForClass } from "./attunements"
import { addStatDelta, resolveEnginePath } from "./statPaths"
import { builtinSkillsForClass, defaultRotationForClass } from "./builtinLibrary"
import { resolveRotation } from "./rotation"

export interface WordSpec<TName extends string = string> {
  word: TName
  label: string
  amount: number
  unit: "raw" | "percent"
  apply(inputs: Inputs): Inputs
}

export function getWordSpecs(inputs: Inputs): WordSpec<GearWordId>[] {
  return buildWordSpecs(inputs)
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
  for (const { step, skill } of steps) {
    if (skill.weaponOrAttribute)
      counts[skill.weaponOrAttribute] = (counts[skill.weaponOrAttribute] ?? 0) + step.hitCount
  }
  return Object.entries(counts)
    .sort((first, second) => second[1] - first[1])
    .map(([weapon]) => weapon)
    .filter(isWeaponName)
}

function wordSpec(
  word: GearWordId,
  apply: (inputs: Inputs, roll: number) => void,
): WordSpec<GearWordId> {
  const roll = GEAR_WORD_MAX_ROLL[word]
  return {
    word,
    label: statLineLabel(word),
    amount: roll,
    unit: GEAR_WORD_UNIT[word],
    apply: (inputs) => clone(inputs, (next) => apply(next, roll)),
  }
}

function buildWordSpecs(inputs: Inputs): WordSpec<GearWordId>[] {
  const school = getSchool(inputs.classId)
  const weapons = rotationWeapons(inputs)
  const schoolWeapons = school.weapons.filter(isWeaponName)
  const primaryWeapon = weapons[0] ?? schoolWeapons[0] ?? null
  const secondaryWeapon = weapons[1] ?? schoolWeapons[1] ?? null
  const specs: WordSpec<GearWordId>[] = [
    wordSpec("power", (x) => {
      x.phys.min += 11.115
      x.phys.max += 67.184
    }),
    wordSpec("agility", (x, roll) => {
      x.phys.min += 44.46
      x.critRate += roll * 0.00076
    }),
    wordSpec("momentum", (x, roll) => {
      x.phys.max += 44.46
      x.affinityRate += roll * 0.00038
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
    ...ATTRIBUTE_KEYS.flatMap((attribute) => [
      wordSpec(`min${attribute}`, (x, roll) => {
        applyAttrAttack(x, attribute, "min", roll)
      }),
      wordSpec(`max${attribute}`, (x, roll) => {
        applyAttrAttack(x, attribute, "max", roll)
      }),
    ]),
    wordSpec("minVoidAttack", (x, roll) => {
      applyAttrAttack(x, school.primaryAttribute, "min", roll)
    }),
    wordSpec("maxVoidAttack", (x, roll) => {
      applyAttrAttack(x, school.primaryAttribute, "max", roll)
    }),
    wordSpec("physicalPenetration", (x, roll) => {
      x.phys.penetration += roll
    }),
    wordSpec("formlessPenetration", (x, roll) => {
      applyAttrPenetration(x, school.primaryAttribute, roll)
    }),
  )
  return specs
}

const ATTUNEMENTS_ALREADY_LISTED_AS_WORDS = new Set(["physPen", "formlessPen"])

function buildAttunementSpecs(inputs: Inputs): WordSpec[] {
  return attunementsForClass(inputs.classId)
    .filter((opt) => !ATTUNEMENTS_ALREADY_LISTED_AS_WORDS.has(opt.id))
    .map((opt) => ({
      word: opt.id,
      label: opt.label,
      amount: opt.max,
      unit: "percent" as const,
      apply: (i: Inputs) =>
        clone(i, (x) => {
          if (!opt.enginePath) return
          addStatDelta(x, resolveEnginePath(opt.enginePath, x), opt.max)
        }),
    }))
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

export function computeRanking(inputs: Inputs, baseDps: number): ItemRankingRow[] {
  const catalogues: { source: ItemRankingRow["source"]; specs: WordSpec[] }[] = [
    { source: "tunement", specs: buildWordSpecs(inputs) },
    { source: "attunement", specs: buildAttunementSpecs(inputs) },
  ]
  const rows: ItemRankingRow[] = []
  for (const { source, specs } of catalogues) {
    for (const spec of specs) {
      const withSpec = runEngine(spec.apply(inputs))
      const lift = baseDps > 0 ? withSpec.dps / baseDps - 1 : 0
      rows.push({
        statLineId: spec.word,
        label: spec.label,
        source,
        amount: spec.amount,
        unit: spec.unit,
        expectedDps: withSpec.dps,
        dpsDelta: withSpec.dps - baseDps,
        liftPercent: lift,
        leadVsMin: 0,
      })
    }
  }
  const positive = rows.filter((r) => r.liftPercent > 0.001).map((r) => r.liftPercent)
  const minPositive = positive.length ? Math.min(...positive) : 0
  for (const r of rows) {
    r.leadVsMin =
      r.liftPercent > 0.001 && minPositive > 0 ? r.liftPercent / minPositive - 1 : "(none)"
  }
  return rows
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
