import { describe, expect, it } from "vitest"
import { reattunementPool } from "../../src/data/stats/gearReattunementWeights"
import { reattunementExactMaxChance } from "../../src/engine/reattunement"
import { GEAR_LEVELS } from "../../src/engine/types"

const REGISTERED_CLASSES = [
  "bellstrikeSplendor",
  "bellstrikeUmbra",
  "stonesplitStrength",
  "silkbindJade",
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
