import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  importCustomDebuff,
  importCustomSkill,
  loadCustomDebuffsForClass,
  loadCustomSkillsForClass,
  migrateDotStandinOverrides,
  saveCustomDebuff,
  saveCustomSkill,
} from "../src/storage"
import { makeDebuff } from "../src/engine/debuff"
import { makeHit, makeSkill, type CoefficientRow } from "../src/engine/skill"
import { artLevelRows, mysticTierRows } from "../src/definitions/skills/levelRowsDef"
import { levelScaled } from "../src/definitions/skills/skillDef"
import { builtinDebuffsForClass } from "../src/engine/builtinLibrary"

const CLASS_ID = "bellstrikeUmbra"

const lowRow: CoefficientRow = {
  physMultiplier: 1,
  attributeMultiplier: 1.5,
  physFixed: 10,
  attributeFixed: 5,
}
const highRow: CoefficientRow = {
  physMultiplier: 2,
  attributeMultiplier: 3,
  physFixed: 20,
  attributeFixed: 10,
}
const LEVEL_ROWS = artLevelRows({ 90: lowRow, 100: highRow })
const BAD_LEVEL_ROWS = { scale: "artLevel", rows: { "100": { physMultiplier: 1 } } }

function skillWithVariant(hitLevelRows: unknown, variantLevelRows: unknown) {
  return makeSkill(CLASS_ID, {
    name: "Level Probe",
    hits: [
      {
        ...makeHit({ ...highRow }),
        levelRows: hitLevelRows as never,
        variants: [
          {
            id: "variant-probe",
            label: "Probe",
            conditions: [],
            ...highRow,
            levelRows: variantLevelRows as never,
          },
        ],
      },
    ],
  })
}

describe("level rows in saved skills", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it("keeps valid level rows on a hit and a variant through a save and load", () => {
    const skill = skillWithVariant(LEVEL_ROWS, LEVEL_ROWS)
    saveCustomSkill(skill)
    const [loaded] = loadCustomSkillsForClass(CLASS_ID).filter((entry) => entry.id === skill.id)
    expect(loaded.hits[0].levelRows).toEqual(LEVEL_ROWS)
    expect(loaded.hits[0].variants![0].levelRows).toEqual(LEVEL_ROWS)
  })

  it("drops malformed level rows without dropping the variant", () => {
    const skill = skillWithVariant(BAD_LEVEL_ROWS, BAD_LEVEL_ROWS)
    saveCustomSkill(skill)
    const [loaded] = loadCustomSkillsForClass(CLASS_ID).filter((entry) => entry.id === skill.id)
    expect(loaded.hits[0].levelRows).toBeUndefined()
    expect(loaded.hits[0].variants).toHaveLength(1)
    expect(loaded.hits[0].variants![0].levelRows).toBeUndefined()
    expect(loaded.hits[0].variants![0].physMultiplier).toBe(highRow.physMultiplier)
  })

  it("keeps valid level rows on import and drops malformed ones without dropping the variant", () => {
    const valid = importCustomSkill(
      JSON.stringify(skillWithVariant(LEVEL_ROWS, LEVEL_ROWS)),
      CLASS_ID,
    )
    expect(valid.hits[0].levelRows).toEqual(LEVEL_ROWS)
    expect(valid.hits[0].variants![0].levelRows).toEqual(LEVEL_ROWS)

    const malformed = importCustomSkill(
      JSON.stringify(skillWithVariant(BAD_LEVEL_ROWS, BAD_LEVEL_ROWS)),
      CLASS_ID,
    )
    expect(malformed.hits[0].levelRows).toBeUndefined()
    expect(malformed.hits[0].variants).toHaveLength(1)
    expect(malformed.hits[0].variants![0].levelRows).toBeUndefined()
  })
})

describe("level rows in saved debuffs", () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  const dotRows = mysticTierRows({ 5: lowRow, 6: highRow })

  function debuffWith(levelRows: unknown) {
    return makeDebuff(CLASS_ID, {
      name: "Level Probe Dot",
      dot: {
        tickIntervalFrames: 60,
        attributeAttack: "",
        skillType: "weapon",
        count: 1,
        ...levelScaled(dotRows),
        levelRows: levelRows as never,
      },
    })
  }

  it("keeps valid level rows on a dot through a save and load and an import", () => {
    const debuff = debuffWith(dotRows)
    saveCustomDebuff(debuff)
    const [loaded] = loadCustomDebuffsForClass(CLASS_ID).filter((entry) => entry.id === debuff.id)
    expect(loaded.dot!.levelRows).toEqual(dotRows)
    expect(importCustomDebuff(JSON.stringify(debuff), CLASS_ID).dot!.levelRows).toEqual(dotRows)
  })

  it("drops malformed level rows from a dot and keeps the dot", () => {
    const debuff = debuffWith(BAD_LEVEL_ROWS)
    saveCustomDebuff(debuff)
    const [loaded] = loadCustomDebuffsForClass(CLASS_ID).filter((entry) => entry.id === debuff.id)
    expect(loaded.dot!.levelRows).toBeUndefined()
    expect(loaded.dot!.physMultiplier).toBe(highRow.physMultiplier)
    const imported = importCustomDebuff(JSON.stringify(debuff), CLASS_ID)
    expect(imported.dot!.levelRows).toBeUndefined()
  })

  it("removes level rows from the skill hits a tick-source stand-in is merged into", () => {
    const builtin = builtinDebuffsForClass(CLASS_ID).find((debuff) =>
      debuff.id.endsWith("bleed-tick"),
    )!
    const standIn = {
      ...builtin,
      dot: { ...builtin.dot!, physMultiplier: 0.5, levelRows: LEVEL_ROWS },
    }
    saveCustomDebuff(standIn)
    migrateDotStandinOverrides()
    const merged = loadCustomSkillsForClass(CLASS_ID).find((skill) =>
      skill.id.endsWith("bleed-tick"),
    )!
    expect(merged.hits[0].physMultiplier).toBe(0.5)
    expect(merged.hits[0].levelRows).toBeUndefined()
  })
})
