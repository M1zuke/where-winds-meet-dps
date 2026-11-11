import { describe, expect, it } from "vitest"
import { BREAKTHROUGH_TIERS } from "../../src/definitions/baseStats/breakthroughs"
import { CLASS_DEFS } from "../../src/definitions/classes/registry"
import { highestRow } from "../../src/definitions/skills/levelRowsDef"
import { MYSTIC_DEBUFFS, MYSTIC_SKILLS } from "../../src/data/skills/mystic"
import type { CoefficientRow, LevelRows } from "../../src/engine/skill"

interface ScaledRow extends CoefficientRow {
  levelRows?: LevelRows
}

const scaledRows: { owner: string; row: ScaledRow }[] = []

const skills = [...CLASS_DEFS().flatMap((classDef) => classDef.skills), ...MYSTIC_SKILLS]
for (const skill of skills) {
  skill.hits.forEach((hit, hitIndex) => {
    scaledRows.push({ owner: `${skill.id} hit ${hitIndex}`, row: hit })
    for (const variant of hit.variants ?? []) {
      scaledRows.push({
        owner: `${skill.id} hit ${hitIndex} variant ${variant.label}`,
        row: variant,
      })
    }
  })
}
const debuffs = [...CLASS_DEFS().flatMap((classDef) => classDef.debuffs), ...MYSTIC_DEBUFFS]
for (const debuff of debuffs) {
  if (debuff.dot) scaledRows.push({ owner: `${debuff.id} dot`, row: debuff.dot })
}

const withLevelRows = scaledRows.filter(
  (entry): entry is { owner: string; row: ScaledRow & { levelRows: LevelRows } } =>
    entry.row.levelRows !== undefined,
)

const selectedLevels = (scale: LevelRows["scale"]) =>
  new Set(
    BREAKTHROUGH_TIERS.map((tier) => (scale === "artLevel" ? tier.artLevel : tier.mysticTier)),
  )

describe("level rows cover every breakthrough", () => {
  it("is exercised by at least one built-in row", () => {
    expect(withLevelRows.length).toBeGreaterThan(0)
  })

  it("keeps a row's own four fields equal to its highest row", () => {
    for (const { owner, row } of withLevelRows) {
      const { physMultiplier, attributeMultiplier, physFixed, attributeFixed } = row
      expect({ physMultiplier, attributeMultiplier, physFixed, attributeFixed }, owner).toEqual(
        highestRow(row.levelRows),
      )
    }
  })

  it("holds no key that no breakthrough selects", () => {
    for (const { owner, row } of withLevelRows) {
      const selected = selectedLevels(row.levelRows.scale)
      for (const key of Object.keys(row.levelRows.rows)) {
        expect(selected.has(Number(key)), `${owner} key ${key}`).toBe(true)
      }
    }
  })

  it("covers every martial-art level a breakthrough selects", () => {
    for (const { owner, row } of withLevelRows) {
      if (row.levelRows.scale !== "artLevel") continue
      for (const level of selectedLevels("artLevel")) {
        expect(Object.keys(row.levelRows.rows), owner).toContain(String(level))
      }
    }
  })

  it("covers the highest mystic tier, and a lower tier only together with every tier below the top", () => {
    const tiers = [...selectedLevels("mysticTier")].sort((left, right) => left - right)
    const top = tiers[tiers.length - 1]!
    for (const { owner, row } of withLevelRows) {
      if (row.levelRows.scale !== "mysticTier") continue
      const keys = Object.keys(row.levelRows.rows)
      expect(keys, owner).toContain(String(top))
      const lower = tiers.slice(0, -1).map(String)
      const covered = lower.filter((tier) => keys.includes(tier))
      expect(covered.length === 0 || covered.length === lower.length, owner).toBe(true)
    }
  })
})
