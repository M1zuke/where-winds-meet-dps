import type { Inputs, ItemRankingRow } from "./types"
import type { Skill } from "./skill"
import { runEngine } from "./dps"
import { getSchool } from "./panel"
import { getAttunement } from "./attunements"
import { builtinSkillsForClass, defaultRotationForClass } from "./builtinLibrary"
import { resolveRotation } from "./rotation"

export interface WordSpec {
  word: string
  amount: number
  unit: "raw" | "percent"
  apply(inputs: Inputs): Inputs
}

export function getWordSpecs(inputs: Inputs): WordSpec[] {
  return buildWordSpecs(inputs)
}

function rotationWeapons(inputs: Inputs): string[] {
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
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
}

function buildWordSpecs(inputs: Inputs): WordSpec[] {
  const school = getSchool(inputs.classId)
  const physPenMax = getAttunement("physPen")?.max ?? 0.078
  const attrPenMax = getAttunement("formlessPen")?.max ?? 0.092
  const weapons = rotationWeapons(inputs)
  const w0 = weapons[0] ?? school.weapons[0] ?? null
  const w1 = weapons[1] ?? school.weapons[1] ?? null
  const specs: WordSpec[] = [
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
      amount: 0.036,
      unit: "percent",
      apply: (i) =>
        clone(i, (x) => {
          x.allMartialBoost += 0.036
        }),
    },
  ]
  // Weapon boost max roll: 6.2 % at breakthrough-16 (in-game, uniform across weapons).
  if (w0)
    specs.push({
      word: `${w0} Martial Boost`,
      amount: 0.062,
      unit: "percent",
      apply: (i) => clone(i, applyWeaponBoost(w0, 0.062)),
    })
  if (w1)
    specs.push({
      word: `${w1} Martial Boost`,
      amount: 0.062,
      unit: "percent",
      apply: (i) => clone(i, applyWeaponBoost(w1, 0.062)),
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
    // Single-Target Mystic Skill DMG Boost max roll: 11 % (observed in game,
    // 2026-07-31). The two area words below still carry the older 7 % figure
    // because their max hasn't been re-observed — don't "harmonise" them to 11 %.
    {
      word: "Single-Target Mystic Skill DMG Boost",
      amount: 0.11,
      unit: "percent",
      apply: (i) =>
        clone(i, (x) => {
          x.singleMysticBoost += 0.11
        }),
    },
    {
      word: "Area Debuff Mystic Skill DMG Boost",
      amount: 0.07,
      unit: "percent",
      apply: (i) =>
        clone(i, (x) => {
          x.groupAnomalyBoost += 0.07
        }),
    },
    {
      word: "Area DMG Mystic Skill DMG Boost",
      amount: 0.07,
      unit: "percent",
      apply: (i) =>
        clone(i, (x) => {
          x.groupDamageBoost += 0.07
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

function applyWeaponBoost(weapon: string, amt: number) {
  return (i: Inputs) => {
    const map: Record<string, keyof Inputs> = {
      Sword: "swordBoost",
      Spear: "spearBoost",
      Fan: "fanBoost",
      Umbrella: "umbrellaBoost",
      Modao: "modaoBoost",
      "Twin Blades": "dualKnivesBoost",
      "Rope Dart": "ropeDartBoost",
      Hengdao: "hengDaoBoost",
    }
    const key = map[weapon]
    if (!key) return
    const target = i as unknown as Record<string, number>
    target[key as string] = (target[key as string] ?? 0) + amt
  }
}

function applyAttrPenetration(
  i: Inputs,
  attr: "Bellstrike" | "Stonesplit" | "Silkbind" | "Bamboocut",
  amt: number,
) {
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

function applyAttrAttack(
  i: Inputs,
  attr: "Bellstrike" | "Stonesplit" | "Silkbind" | "Bamboocut",
  field: "min" | "max",
  amt: number,
) {
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
  const specs = buildWordSpecs(inputs)
  const rows: ItemRankingRow[] = []
  for (const spec of specs) {
    const next = spec.apply(inputs)
    const r = runEngine(next)
    const lift = baseDps > 0 ? r.dps / baseDps - 1 : 0
    rows.push({
      word: spec.word,
      amount: spec.amount,
      unit: spec.unit,
      expectedDps: r.dps,
      dpsDelta: r.dps - baseDps,
      liftPercent: lift,
      leadVsMin: 0,
    })
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
    mindMethods: i.mindMethods.map((m) => ({ ...m })) as Inputs["mindMethods"],
  }
  mut(next)
  return next
}
