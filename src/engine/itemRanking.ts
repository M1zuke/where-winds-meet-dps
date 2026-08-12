import type { AttributeKey, GearWordName, Inputs, ItemRankingRow, WeaponName } from "./types"
import { isWeaponName } from "./types"
import type { Skill } from "./skill"
import { runEngine } from "./dps"
import { getSchool } from "./panel"
import { WEAPON_BOOST_STAT_KEY } from "./statRegistry"
import { attunementsForClass, getAttunement } from "./attunements"
import { addStatDelta, resolveEnginePath } from "./statPaths"
import { builtinSkillsForClass, defaultRotationForClass } from "./builtinLibrary"
import { resolveRotation } from "./rotation"

export interface WordSpec<TName extends string = string> {
  word: TName
  amount: number
  unit: "raw" | "percent"
  apply(inputs: Inputs): Inputs
}

export function getWordSpecs(inputs: Inputs): WordSpec<GearWordName>[] {
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

function buildWordSpecs(inputs: Inputs): WordSpec<GearWordName>[] {
  const school = getSchool(inputs.classId)
  const physPenMax = getAttunement("physPen")?.max ?? 0.078
  const attrPenMax = getAttunement("formlessPen")?.max ?? 0.092
  const weapons = rotationWeapons(inputs)
  const schoolWeapons = school.weapons.filter(isWeaponName)
  const primaryWeapon = weapons[0] ?? schoolWeapons[0] ?? null
  const secondaryWeapon = weapons[1] ?? schoolWeapons[1] ?? null
  const specs: WordSpec<GearWordName>[] = [
    {
      word: "Power",
      amount: 49.4,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          x.phys.min += 11.115
          x.phys.max += 67.184
        }),
    },
    {
      word: "Agility",
      amount: 49.4,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          x.phys.min += 44.46
          x.critRate += 49.4 * 0.00076
        }),
    },
    {
      word: "Momentum",
      amount: 49.4,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          x.phys.max += 44.46
          x.affinityRate += 49.4 * 0.00038
        }),
    },
    {
      word: "Min Phys",
      amount: 77.8,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          x.phys.min += 77.8
        }),
    },
    {
      word: "Max Phys",
      amount: 77.8,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          x.phys.max += 77.8
        }),
    },
    {
      word: "Precision",
      amount: 0.08,
      unit: "percent",
      apply: (i) =>
        clone(i, (x) => {
          x.precision += 0.08
        }),
    },
    {
      word: "Crit",
      amount: 0.09,
      unit: "percent",
      apply: (i) =>
        clone(i, (x) => {
          x.critRate += 0.09
        }),
    },
    {
      word: "Affinity",
      amount: 0.044,
      unit: "percent",
      apply: (i) =>
        clone(i, (x) => {
          x.affinityRate += 0.044
        }),
    },
    {
      word: "All Martial Boost",
      amount: 0.032,
      unit: "percent",
      apply: (i) =>
        clone(i, (x) => {
          x.allMartialBoost += 0.032
        }),
    },
  ]
  // Weapon boost max roll: 6.2 % at breakthrough-16 (in-game, uniform across weapons).
  if (primaryWeapon)
    specs.push({
      word: `${primaryWeapon} Martial Boost`,
      amount: 0.062,
      unit: "percent",
      apply: (i) => clone(i, applyWeaponBoost(primaryWeapon, 0.062)),
    })
  if (secondaryWeapon)
    specs.push({
      word: `${secondaryWeapon} Martial Boost`,
      amount: 0.062,
      unit: "percent",
      apply: (i) => clone(i, applyWeaponBoost(secondaryWeapon, 0.062)),
    })

  specs.push(
    // Boss boost max roll: 3.2 % (in-game, 2026-08-01).
    {
      word: "Damage VS Boss %",
      amount: 0.032,
      unit: "percent",
      apply: (i) =>
        clone(i, (x) => {
          x.bossBoost += 0.032
        }),
    },
    {
      word: "Single-Target Mystic Skill DMG Boost",
      amount: 0.09797,
      unit: "percent",
      apply: (i) =>
        clone(i, (x) => {
          x.singleMysticBoost += 0.09797
        }),
    },
    {
      word: "Area Mystic Skill DMG Boost",
      amount: 0.07,
      unit: "percent",
      apply: (i) =>
        clone(i, (x) => {
          x.areaMysticBoost += 0.07
        }),
    },
    {
      word: "Min Bellstrike",
      amount: 44.2,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          x.bellstrike.min += 44.2
        }),
    },
    {
      word: "Max Bellstrike",
      amount: 44.2,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          x.bellstrike.max += 44.2
        }),
    },
    {
      word: "Min Stonesplit",
      amount: 44.2,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          x.stonesplit.min += 44.2
        }),
    },
    {
      word: "Max Stonesplit",
      amount: 44.2,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          x.stonesplit.max += 44.2
        }),
    },
    {
      word: "Min Silkbind",
      amount: 44.2,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          x.silkbind.min += 44.2
        }),
    },
    {
      word: "Max Silkbind",
      amount: 44.2,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          x.silkbind.max += 44.2
        }),
    },
    {
      word: "Min Bamboocut",
      amount: 44.2,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          x.bamboocut.min += 44.2
        }),
    },
    {
      word: "Max Bamboocut",
      amount: 44.2,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          x.bamboocut.max += 44.2
        }),
    },
    {
      word: "Min Void Attack",
      amount: 44.2,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          applyAttrAttack(x, school.primaryAttribute, "min", 44.2)
        }),
    },
    {
      word: "Max Void Attack",
      amount: 44.2,
      unit: "raw",
      apply: (i) =>
        clone(i, (x) => {
          applyAttrAttack(x, school.primaryAttribute, "max", 44.2)
        }),
    },
    {
      word: "Physical Penetration",
      amount: physPenMax,
      unit: "percent",
      apply: (i) =>
        clone(i, (x) => {
          x.phys.penetration += physPenMax
        }),
    },
    {
      word: "Attribute Penetration",
      amount: attrPenMax,
      unit: "percent",
      apply: (i) =>
        clone(i, (x) => {
          applyAttrPenetration(x, school.primaryAttribute, attrPenMax)
        }),
    },
  )
  return specs
}

// The `Physical Penetration` and `Attribute Penetration` word specs above take
// their max roll straight from these two attunements, so listing the attunements
// again would produce a duplicate row with identical numbers.
const ATTUNEMENTS_ALREADY_LISTED_AS_WORDS = new Set(["physPen", "formlessPen"])

function buildAttunementSpecs(inputs: Inputs): WordSpec[] {
  return attunementsForClass(inputs.classId)
    .filter((opt) => !ATTUNEMENTS_ALREADY_LISTED_AS_WORDS.has(opt.id))
    .map((opt) => ({
      word: opt.label,
      amount: opt.max,
      unit: "percent" as const,
      apply: (i: Inputs) =>
        clone(i, (x) => {
          if (!opt.enginePath) return
          addStatDelta(x, resolveEnginePath(opt.enginePath, x), opt.max)
        }),
    }))
}

function applyWeaponBoost(weapon: WeaponName, amt: number) {
  return (i: Inputs) => {
    const key = WEAPON_BOOST_STAT_KEY[weapon]
    if (!key) return
    const target = i as unknown as Record<string, number>
    target[key] = (target[key] ?? 0) + amt
  }
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
        word: spec.word,
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
    dingYinByTag: { ...i.dingYinByTag },
    mindMethods: i.mindMethods.map((m) => ({ ...m })) as Inputs["mindMethods"],
  }
  mut(next)
  return next
}
