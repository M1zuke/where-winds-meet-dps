// Diagnostic parity check for one confirmed-correct bellstrikeUmbra (Bellstrike
// Umbra) build against the reference site's cached run (T6-Bili rotation,
// target DPS 48,365 / total damage 2,936,621 / Bleed Detonation 1,578,359
// over a ~60.7 s window). The DPS/total/detonation bands below are an
// intentionally LOOSE, re-centered fit around what the engine actually
// produces — NOT a locked fixture — while the rate-conversion assertion is
// exact and must stay green through every future change.
import { describe, expect, it } from "vitest"
import { runEngine } from "../../src/engine/dps"
import { effectiveRates } from "../../src/engine/panel"
import { defaultInputs } from "../../src/engine/defaults"
import { EMPTY_EQUIPPED } from "../../src/engine/types"
import type { Inputs } from "../../src/engine/types"
import { SET_ID } from "../../src/data/sets/ids"

const SITE_TARGET_DPS = 48365
const SITE_TARGET_TOTAL = 2936621
const SITE_TARGET_DETONATION = 1578359

const inputs: Inputs = {
  ...defaultInputs,
  classId: "bellstrikeUmbra",
  breakthrough: 14,

  // Site panel min/max are 977.23/2983.92; the +90/+180 is this level-91-95
  // build's older food tier (pre Simmering Fish Slices), folded into `phys`
  // instead of `food: true` so this fixture measures engine parity rather
  // than the food-table change. Equivalent to `food: true` only because
  // `BuildView.grantsMinPhysCritBoost` is false for every bellstrikeUmbra
  // weapon type — do NOT copy this trick to a class where that gate can pass.
  phys: { min: 977.23 + 90, max: 2983.92 + 180, penetration: 0.411 },
  bellstrike: { min: 274, max: 687.63, penetration: 0.18 },
  stonesplit: { min: 0, max: 0, penetration: 0 },
  silkbind: { min: 0, max: 0, penetration: 0 },
  bamboocut: { min: 0, max: 36.2, penetration: 0 },

  // White inputs — see CLAUDE.md § "White vs Yellow rates".
  precision: 1.002,
  critRate: 0.4431,
  affinityRate: 0.5795,
  directCritRate: 0.046,
  directAffinityRate: 0.023,
  critDamageBoost: 0.5,
  affinityDamageBoost: 0.402,
  attributeDamageBoost: 0.09,
  physBoost: 0,
  sustainDamageBoost: 0,
  allDamageBoost: 0,

  set: SET_ID.hawking,
  bowSet: "affinity",
  arsenal: "bellstrike",
  mindMethods: [
    { name: "Sword Horizon", stacks: "tier 6" },
    { name: "Wolfchaser's Art", stacks: "tier 6" },
    { name: "Insightful Strike", stacks: "tier 6" },
    { name: "Morale Chant", stacks: "tier 6" },
  ],
  classSpecificAttunement: { bleedingDamage: 0.1988 },
  combatSettings: {
    qiBreak: { enabled: true, startSec: 25, durationSec: 10 },
    dragonsBreath: false,
    healerBuff: false,
    breakExtension: false,
    revelryScript: false,
    dragonHeadFullStacks: false,
    dragonHeadLowHpMaxBonus: false,
  },
  shareDebuff5HenZhi: false,
  shareEasyHurt: false,
  tianGongElement: "fire",
  food: false,
  bossBoost: 0.0244,
  allMartialBoost: 0.04844,
  swordBoost: 0.0489,
  spearBoost: 0,
  fanBoost: 0,
  umbrellaBoost: 0,
  modaoBoost: 0,
  dualKnivesBoost: 0,
  ropeDartBoost: 0,
  hengDaoBoost: 0,
  singleMysticBoost: 0,
  areaMysticBoost: 0,
  dummyMode: false,
  rotation: null,
  activeCustomRotation: null,
  martialArtsTalents: [],
  equipped: { ...EMPTY_EQUIPPED },
  inventory: [],
  oddities: {},
  selectedBuiltinRotationId: "builtin-bellstrikeUmbra-t6-bili",
}

describe("Bellstrike Umbra (bellstrikeUmbra) — T6-Bili parity vs the reference site", () => {
  it("effective rates match the site's yellow 89.28 % / 30.56 % / 39.97 % (resistance 0.45)", () => {
    const eff = effectiveRates(inputs)
    expect(eff.precision).toBeCloseTo(0.8928, 3)
    expect(eff.critRate).toBeCloseTo(0.3056, 3)
    expect(eff.affinityRate).toBeCloseTo(0.3997, 3)
    expect(eff.resistance).toBeCloseTo(0.45, 3)
  })

  it("runs the T6-Bili rotation (~60.7 s) and lands within a loose band of the site's target", () => {
    const result = runEngine(inputs)

    expect(result.rotationDuration).toBeGreaterThan(60.2)
    expect(result.rotationDuration).toBeLessThan(61.2)

    const detonation = result.perSkill.find((s) => s.name === "Bleed Detonation")

    console.log("warnings:", result.warnings)
    console.log(
      `dps ${result.dps.toFixed(0)} (site target ${SITE_TARGET_DPS}) — ${((result.dps / SITE_TARGET_DPS) * 100).toFixed(1)}% of target`,
    )
    console.log(
      `total ${result.totalDamage.toFixed(0)} (site target ${SITE_TARGET_TOTAL}) — ${((result.totalDamage / SITE_TARGET_TOTAL) * 100).toFixed(1)}% of target`,
    )
    if (detonation) {
      console.log(
        `Bleed Detonation ${detonation.expectedDamage.toFixed(0)} over ${detonation.count} hits ` +
          `(avg ${(detonation.expectedDamage / detonation.count).toFixed(0)}, site target ${SITE_TARGET_DETONATION} / 29 hits)`,
      )
    }
    console.table(
      [...result.perSkill]
        .sort((a, b) => b.expectedDamage - a.expectedDamage)
        .map((s) => ({
          name: s.name,
          type: s.type,
          count: s.count,
          expectedDamage: Math.round(s.expectedDamage),
          percentOfTotal: `${(s.percentOfTotal * 100).toFixed(1)}%`,
        })),
    )

    expect(detonation?.count).toBe(29)

    // Intentionally loose, re-centered bands (see the file header) — not the
    // site's cached target. Re-center as further mechanics land; do not
    // widen a band to paper over a regression.
    expect(result.dps).toBeGreaterThan(48490)
    expect(result.dps).toBeLessThan(48660)
    expect(result.totalDamage).toBeGreaterThan(2942000)
    expect(result.totalDamage).toBeLessThan(2956000)
    expect(detonation?.expectedDamage).toBeGreaterThan(1592000)
    expect(detonation?.expectedDamage).toBeLessThan(1606000)

    // The engine sits ~0.4 % ABOVE the cached target: bleed ticks and Bleed
    // Detonation take all-martial (and ticks sword boost) per the lvl-110
    // workbook's Sword typing, which the cached run predates.
    expect(result.dps / SITE_TARGET_DPS).toBeGreaterThan(0.999)
    expect(result.dps / SITE_TARGET_DPS).toBeLessThan(1.009)
    expect(result.totalDamage / SITE_TARGET_TOTAL).toBeGreaterThan(0.999)
    expect(result.totalDamage / SITE_TARGET_TOTAL).toBeLessThan(1.009)
    expect((detonation?.expectedDamage ?? 0) / SITE_TARGET_DETONATION).toBeLessThan(1.018)
  })
})
