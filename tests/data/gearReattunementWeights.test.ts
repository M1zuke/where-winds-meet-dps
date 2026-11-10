import { describe, expect, it } from "vitest"
import { reattunementPool } from "../../src/data/stats/gearReattunementWeights"
import { attunementsFor } from "../../src/engine/attunements"
import { reattunementExactMaxChance } from "../../src/engine/reattunement"
import { GEAR_LEVELS } from "../../src/engine/types"
import { BAMBOOCUT_DRAUGHT_ATTUNEMENTS } from "../../src/data/classes/bamboocut-draught/attunements"
import { BELLSTRIKE_SPLENDOR_ATTUNEMENTS } from "../../src/data/classes/bellstrike-splendor/attunements"

const REGISTERED_CLASSES = [
  "bellstrikeSplendor",
  "bellstrikeUmbra",
  "stonesplitStrength",
  "silkbindJade",
  "bamboocutDraught",
] as const

describe("reattunementPool — armour (class) pools", () => {
  it("has a pool for every registered class at every gear level", () => {
    for (const classId of REGISTERED_CLASSES) {
      for (const level of GEAR_LEVELS) {
        const pool = reattunementPool(classId, "helm", level)
        expect(pool).not.toBeNull()
        expect(pool!.lines.length).toBeGreaterThan(0)
        expect(pool!.totalWeight).toBeGreaterThanOrEqual(
          pool!.lines.reduce((sum, line) => sum + line.weight, 0),
        )
      }
    }
  })

  it("shares the same pool across every armour slot", () => {
    for (const level of GEAR_LEVELS) {
      const helm = reattunementPool("bellstrikeUmbra", "helm", level)
      const armor = reattunementPool("bellstrikeUmbra", "armor", level)
      const greaves = reattunementPool("bellstrikeUmbra", "greaves", level)
      const bracer = reattunementPool("bellstrikeUmbra", "bracer", level)
      expect(helm).toEqual(armor)
      expect(helm).toEqual(greaves)
      expect(helm).toEqual(bracer)
    }
  })

  it("offers every Draught attunement line at the same weights on every level, covering the whole pool", () => {
    for (const level of GEAR_LEVELS) {
      const pool = reattunementPool("bamboocutDraught", "helm", level)!
      expect(pool.totalWeight).toBe(500)
      expect(Object.fromEntries(pool.lines.map((line) => [line.optionId, line.weight]))).toEqual({
        driftcleaveDeepdaze: 150,
        gauntletsSpecial: 80,
        gauntletsMartialArt: 100,
        twinbladesLightAttack: 70,
        twinbladesMartialArt: 100,
      })
      expect(pool.lines.map((line) => line.optionId).sort()).toEqual(
        BAMBOOCUT_DRAUGHT_ATTUNEMENTS.map((option) => option.id).sort(),
      )
      expect(pool.lines.reduce((sum, line) => sum + line.weight, 0)).toBe(pool.totalWeight)
    }
  })

  it("has no entry for an unregistered class", () => {
    expect(reattunementPool("noSuchClass", "helm", 96)).toBeNull()
  })

  it("does not offer a weapon-slot line on an armour piece", () => {
    const pool = reattunementPool("bellstrikeUmbra", "helm", 96)!
    expect(pool.lines.some((line) => line.optionId === "physPen")).toBe(false)
  })
})

describe("reattunementPool — the shared weapon/disc/pendant penetration pool", () => {
  it("is class-blind — every classId resolves to the same pool", () => {
    for (const level of GEAR_LEVELS) {
      const a = reattunementPool("bellstrikeUmbra", "leftWeapon", level)
      const b = reattunementPool("silkbindJade", "leftWeapon", level)
      expect(a).toEqual(b)
    }
  })

  it("carries formlessPen from level 91 up but not at 86", () => {
    const at86 = reattunementPool("bellstrikeUmbra", "leftWeapon", 86)!
    const at91 = reattunementPool("bellstrikeUmbra", "leftWeapon", 91)!
    expect(at86.lines.some((line) => line.optionId === "formlessPen")).toBe(false)
    expect(at91.lines.some((line) => line.optionId === "formlessPen")).toBe(true)
  })

  it("leaves unmodelled weight (the four class-specific pen lines) in the level-86 total", () => {
    const pool = reattunementPool("bellstrikeUmbra", "disc", 86)!
    const modelled = pool.lines.reduce((sum, line) => sum + line.weight, 0)
    expect(pool.totalWeight).toBeGreaterThan(modelled)
  })
})

describe("reattunementExactMaxChance — the P(max) anchor", () => {
  it("reproduces the level-91 physPen figure from the referenced pool table", () => {
    const pool = reattunementPool("bellstrikeUmbra", "leftWeapon", 91)!
    const physPen = pool.lines.find((line) => line.optionId === "physPen")!
    expect(reattunementExactMaxChance(physPen)).toBeCloseTo(0.0143, 3)
  })

  it("reproduces the level-86 physPen figure, a 2-band line", () => {
    const pool = reattunementPool("bellstrikeUmbra", "leftWeapon", 86)!
    const physPen = pool.lines.find((line) => line.optionId === "physPen")!
    expect(reattunementExactMaxChance(physPen)).toBeCloseTo(0.0333, 3)
  })
})

describe("reattunementPool — Splendor", () => {
  it("offers exactly its own attunement lines, covering the whole pool", () => {
    for (const level of GEAR_LEVELS) {
      const pool = reattunementPool("bellstrikeSplendor", "helm", level)!
      expect(pool.totalWeight).toBe(500)
      expect(pool.lines.map((line) => line.optionId).sort()).toEqual(
        BELLSTRIKE_SPLENDOR_ATTUNEMENTS.map((option) => option.id).sort(),
      )
      expect(pool.lines.reduce((sum, line) => sum + line.weight, 0)).toBe(500)
    }
  })

  it("weights the lines per gear level", () => {
    const weights = (level: (typeof GEAR_LEVELS)[number]) =>
      Object.fromEntries(
        reattunementPool("bellstrikeSplendor", "helm", level)!.lines.map((line) => [
          line.optionId,
          line.weight,
        ]),
      )
    expect(weights(86)).toEqual({
      namelessSwordQ: 100,
      swordCharged: 100,
      namelessSwordSpecial: 100,
      namelessSpearCharged: 100,
      spearSpecial: 100,
    })
    expect(weights(91)).toEqual({
      namelessSwordQ: 100,
      swordCharged: 160,
      namelessSwordSpecial: 70,
      namelessSpearCharged: 100,
      spearSpecial: 70,
    })
    expect(weights(100)).toEqual({
      namelessSwordQ: 100,
      swordCharged: 150,
      namelessSwordSpecial: 80,
      namelessSpearCharged: 100,
      spearSpecial: 70,
    })
  })
})

describe("reattunementPool — Jade", () => {
  const weights = (level: (typeof GEAR_LEVELS)[number]) =>
    Object.fromEntries(
      reattunementPool("silkbindJade", "helm", level)!.lines.map((line) => [
        line.optionId,
        line.weight,
      ]),
    )

  it("weights the umbrella and fan lines per gear level", () => {
    expect(weights(86)).toEqual({
      fanCharged: 100,
      fanSpecial: 100,
      umbQ: 100,
      umbCharged: 100,
      umbSpecial: 100,
    })
    expect(weights(91)).toEqual({
      fanCharged: 50,
      fanSpecial: 100,
      umbQ: 80,
      umbCharged: 120,
      umbSpecial: 150,
    })
    expect(weights(96)).toEqual({
      fanCharged: 50,
      fanSpecial: 100,
      umbQ: 100,
      umbFrequentProjectile: 151,
      umbLightHeavyVariedCombo: 100,
    })
    for (const level of [100, 105] as const) {
      expect(weights(level)).toEqual({
        fanCharged: 50,
        fanSpecial: 100,
        umbQ: 100,
        umbFrequentProjectile: 150,
        umbLightHeavyVariedCombo: 100,
      })
    }
  })

  it("covers the whole pool at every gear level", () => {
    for (const level of GEAR_LEVELS) {
      const pool = reattunementPool("silkbindJade", "helm", level)!
      expect(pool.lines.reduce((sum, line) => sum + line.weight, 0)).toBe(pool.totalWeight)
    }
  })
})

describe("reattunementPool — every class's armour pool", () => {
  it("lists exactly the armour attunements the class rolls at that gear level", () => {
    for (const classId of REGISTERED_CLASSES) {
      for (const level of GEAR_LEVELS) {
        const rolled = attunementsFor("helm", classId, level)
          .filter((option) => option.classIds !== null)
          .map((option) => option.id)
          .sort()
        const pooled = reattunementPool(classId, "helm", level)!
          .lines.map((line) => line.optionId)
          .sort()
        expect(pooled, `${classId} ${level}`).toEqual(rolled)
      }
    }
  })
})
