import { describe, expect, it } from "vitest"
import { MYSTIC_DEBUFFS, MYSTIC_SKILLS } from "../../src/data/skills/mystic"
import { LEVEL_ROWS } from "../../src/data/skills/mystic/levelRows"
import { levelSelectionFor } from "../../src/definitions/baseStats/breakthroughs"
import { breakthroughFloor, debuffAtLevel, skillAtLevel } from "../../src/engine/levelRows"

const skillNamed = (id: string) => MYSTIC_SKILLS.find((skill) => skill.id === id)!
const debuffNamed = (id: string) => MYSTIC_DEBUFFS.find((debuff) => debuff.id === id)!

describe("mystic arts read their row at the breakthrough's mystic tier", () => {
  it("reads the tier 5 row at breakthrough 13 and the tier 6 row from breakthrough 14", () => {
    const dragonHead = skillNamed("mystic-dragon-head")
    expect(skillAtLevel(dragonHead, levelSelectionFor(13)).hits[0]).toMatchObject(
      LEVEL_ROWS.dragonHead.rows["5"]!,
    )
    for (const breakthrough of [14, 15, 18, 21]) {
      expect(skillAtLevel(dragonHead, levelSelectionFor(breakthrough))).toBe(dragonHead)
    }
    expect(dragonHead.hits[0]).toMatchObject(LEVEL_ROWS.dragonHead.rows["6"]!)
  })

  it("lowers a damage-over-time tick at breakthrough 13", () => {
    const poison = debuffNamed("debuff-mystic-toad-poison")
    const lowered = debuffAtLevel(poison, levelSelectionFor(13)).dot!
    expect(lowered.physMultiplier).toBeLessThan(poison.dot!.physMultiplier)
    expect(lowered).toMatchObject(LEVEL_ROWS.toadPoisonDot.rows["5"]!)
  })

  it("makes a branch form unavailable below breakthrough 15 and available from 15", () => {
    for (const id of [
      "mystic-dragon-head-plus",
      "mystic-toad-fury",
      "mystic-toad-fury-hit",
      "mystic-dragon-fire-smolder-1-hit",
      "mystic-dragon-fire-smolder-2-hits",
      "mystic-ghostly-afterimage",
    ]) {
      const skill = skillNamed(id)
      expect(breakthroughFloor(skill, 13), id).toBe(15)
      expect(breakthroughFloor(skill, 14), id).toBe(15)
      expect(breakthroughFloor(skill, 15), id).toBeNull()
    }
  })

  it("leaves a mystic art whose rows never change on its single row", () => {
    const afterimage = skillNamed("mystic-ghostly-afterimage")
    expect(afterimage.hits[0]!.levelRows).toBeUndefined()
    expect(breakthroughFloor(afterimage, 15)).toBeNull()
  })
})
