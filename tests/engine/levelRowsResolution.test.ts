import { describe, expect, it } from "vitest"
import {
  BREAKTHROUGH_TIERS,
  levelSelectionFor,
} from "../../src/definitions/baseStats/breakthroughs"
import { artLevelRows, mysticTierRows } from "../../src/definitions/skills/levelRowsDef"
import { levelScaled } from "../../src/definitions/skills/skillDef"
import {
  breakthroughFloor,
  debuffAtLevel,
  frozenAtLevel,
  rowAt,
  rowAtLevel,
  skillAtLevel,
} from "../../src/engine/levelRows"
import { makeDebuff } from "../../src/engine/debuff"
import { isLevelRows, makeHit, makeSkill, type CoefficientRow } from "../../src/engine/skill"

const row = (scale: number): CoefficientRow => ({
  physMultiplier: scale,
  attributeMultiplier: scale * 1.5,
  physFixed: scale * 10,
  attributeFixed: scale * 5,
})

const ART = artLevelRows({ 90: row(1), 95: row(2), 100: row(3) })
const MYSTIC = mysticTierRows({ 5: row(4), 6: row(5) })
const BRANCH = mysticTierRows({ 6: row(6) })

describe("breakthrough level selection", () => {
  it("maps every tier to its own art level and mystic tier", () => {
    const selected = BREAKTHROUGH_TIERS.map((tier) => ({
      breakthrough: tier.breakthrough,
      selection: levelSelectionFor(tier.breakthrough),
    }))
    expect(selected[0]).toEqual({ breakthrough: 13, selection: { artLevel: 90, mysticTier: 5 } })
    expect(selected[1]).toEqual({ breakthrough: 14, selection: { artLevel: 95, mysticTier: 6 } })
    expect(selected[2]).toEqual({ breakthrough: 15, selection: { artLevel: 95, mysticTier: 6 } })
    for (const { selection } of selected.slice(3)) {
      expect(selection).toEqual({ artLevel: 100, mysticTier: 6 })
    }
  })

  it("resolves a stored value outside the range to the nearest tier", () => {
    expect(levelSelectionFor(2)).toEqual(levelSelectionFor(13))
    expect(levelSelectionFor(99)).toEqual(levelSelectionFor(21))
  })
})

describe("level rows", () => {
  it("reads the art row by art level and the mystic row by tier", () => {
    expect(rowAt(ART, { artLevel: 95, mysticTier: 5 })).toEqual(row(2))
    expect(rowAt(MYSTIC, { artLevel: 95, mysticTier: 5 })).toEqual(row(4))
    expect(rowAt(MYSTIC, { artLevel: 100, mysticTier: 6 })).toEqual(row(5))
    expect(rowAt(BRANCH, { artLevel: 90, mysticTier: 5 })).toBeNull()
  })

  it("keeps the highest row in the authored fields", () => {
    expect(levelScaled(ART)).toMatchObject(row(3))
    expect(levelScaled(MYSTIC)).toMatchObject(row(5))
  })

  it("validates the shape", () => {
    expect(isLevelRows(ART)).toBe(true)
    expect(isLevelRows({ scale: "artLevel", rows: {} })).toBe(false)
    expect(isLevelRows({ scale: "other", rows: { "1": row(1) } })).toBe(false)
    expect(isLevelRows({ scale: "artLevel", rows: { first: row(1) } })).toBe(false)
    expect(isLevelRows({ scale: "artLevel", rows: { "1": { physMultiplier: 1 } } })).toBe(false)
  })

  it("returns a row without level rows unchanged and a missing key unchanged", () => {
    const plain = makeHit({ ...row(7) })
    expect(rowAtLevel(plain, levelSelectionFor(13))).toBe(plain)
    const branch = makeHit({ ...levelScaled(BRANCH) })
    expect(rowAtLevel(branch, levelSelectionFor(13))).toBe(branch)
  })

  it("replaces the four values and keeps the level rows", () => {
    const scaled = makeHit({ ...levelScaled(ART), frame: 12 })
    const resolved = rowAtLevel(scaled, levelSelectionFor(14))
    expect(resolved).toMatchObject({ ...row(2), frame: 12, levelRows: ART })
  })

  it("freezes a row at the resolved values without level rows", () => {
    const frozen = frozenAtLevel(makeHit({ ...levelScaled(ART) }), levelSelectionFor(13))
    expect(frozen).toMatchObject(row(1))
    expect("levelRows" in frozen).toBe(false)
  })
})

describe("skill and debuff resolution", () => {
  const variantRows = artLevelRows({ 90: row(8), 100: row(9) })
  const skill = makeSkill("probeClass", {
    hits: [
      makeHit({
        ...levelScaled(ART),
        variants: [
          { id: "variant-a", label: "A", conditions: [], ...levelScaled(variantRows) },
          { id: "variant-b", label: "B", conditions: [], ...row(11) },
        ],
      }),
      makeHit({ ...row(12) }),
    ],
  })

  it("replaces hit and variant values and leaves rows without level rows alone", () => {
    const resolved = skillAtLevel(skill, levelSelectionFor(13))
    expect(resolved.hits[0]).toMatchObject(row(1))
    expect(resolved.hits[0].variants![0]).toMatchObject(row(8))
    expect(resolved.hits[0].variants![1]).toBe(skill.hits[0].variants![1])
    expect(resolved.hits[1]).toBe(skill.hits[1])
  })

  it("returns the same object when the selection changes nothing", () => {
    expect(skillAtLevel(skill, levelSelectionFor(16))).toBe(skill)
    const plain = makeSkill("probeClass", { hits: [makeHit({ ...row(1) })] })
    expect(skillAtLevel(plain, levelSelectionFor(13))).toBe(plain)
  })

  it("returns the same resolved object on a second call", () => {
    expect(skillAtLevel(skill, levelSelectionFor(13))).toBe(
      skillAtLevel(skill, levelSelectionFor(13)),
    )
    expect(skillAtLevel(skill, levelSelectionFor(13))).not.toBe(
      skillAtLevel(skill, levelSelectionFor(14)),
    )
  })

  it("resolves a damage-over-time row", () => {
    const debuff = makeDebuff("probeClass", {
      dot: {
        tickIntervalFrames: 60,
        ...levelScaled(MYSTIC),
        attributeAttack: "",
        skillType: "weapon",
        count: 1,
      },
    })
    expect(debuffAtLevel(debuff, levelSelectionFor(13)).dot).toMatchObject(row(4))
    expect(debuffAtLevel(debuff, levelSelectionFor(14))).toBe(debuff)
    expect(debuffAtLevel(debuff, levelSelectionFor(13))).toBe(
      debuffAtLevel(debuff, levelSelectionFor(13)),
    )
    const plain = makeDebuff("probeClass")
    expect(debuffAtLevel(plain, levelSelectionFor(13))).toBe(plain)
  })

  it("names the lowest breakthrough that covers every level row of a skill", () => {
    const branchSkill = makeSkill("probeClass", { hits: [makeHit({ ...levelScaled(BRANCH) })] })
    expect(breakthroughFloor(branchSkill, 13)).toBe(14)
    expect(breakthroughFloor(branchSkill, 14)).toBeNull()
    expect(breakthroughFloor(skill, 13)).toBeNull()
  })
})
