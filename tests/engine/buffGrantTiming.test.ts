import { describe, expect, it } from "vitest"
import type { BuffEngine } from "../../src/engine/buffs/buffEngine"
import { defineBuff } from "../../src/definitions/skills/buffDef"
import { stat } from "../../src/engine/effects/effect"
import { blossomBarrage } from "../../src/data/innerWays/blossomBarrage"
import { BUFF } from "../../src/data/skills/buffs/ids"
import { buffEngineWith, exhaustedFrom } from "../helpers/qiBars"

const lateGrant = defineBuff({
  id: "lateGrant",
  name: "Late grant",
  duration: 5,
  buffAppliesAfterLastHitSec: 0.03,
  effects: [stat("allDamageBoost", 0.1)],
})

const castEndGrant = defineBuff({
  id: "castEndGrant",
  name: "Cast end grant",
  duration: 5,
  buffAppliesOnCastEnd: true,
  buffAppliesAfterLastHitSec: 0.03,
  effects: [stat("allDamageBoost", 0.1)],
})

function cast(buffs: BuffEngine, ids: string[], props: Record<string, number> = {}, time = 10) {
  buffs.processSkillCast("cast", time, props, false, ids)
}

describe("a grant that lands after the cast's last hit", () => {
  it("opens that long after the last landed hit instead of at the cast's start", () => {
    const buffs = buffEngineWith({}, [lateGrant])
    cast(buffs, ["lateGrant"], { lastHitSec: 0.8, castTime: 1.5 })
    expect(buffs.isBuffActiveAtTime("lateGrant", 10.82)).toBe(false)
    expect(buffs.isBuffActiveAtTime("lateGrant", 10.84)).toBe(true)
    expect(buffs.isBuffActiveAtTime("lateGrant", 15.82)).toBe(true)
    expect(buffs.isBuffActiveAtTime("lateGrant", 15.84)).toBe(false)
  })

  it("opens at the cast's start when the cast landed no hit", () => {
    const buffs = buffEngineWith({}, [lateGrant])
    cast(buffs, ["lateGrant"], { castTime: 1.5 })
    expect(buffs.isBuffActiveAtTime("lateGrant", 10.01)).toBe(true)
  })

  it("yields to a grant on the cast's end", () => {
    const buffs = buffEngineWith({}, [castEndGrant])
    cast(buffs, ["castEndGrant"], { lastHitSec: 0.8, castTime: 1.5 })
    expect(buffs.isBuffActiveAtTime("castEndGrant", 11.4)).toBe(false)
    expect(buffs.isBuffActiveAtTime("castEndGrant", 11.6)).toBe(true)
  })

  it("compares its cooldown at the grant's own time, within float tolerance", () => {
    const cooledDown = defineBuff({
      id: "cooledDown",
      name: "Cooled down",
      duration: 5,
      buffAppliesAfterLastHitSec: 0,
      cooldown: 1,
      effects: [],
    })
    const buffs = buffEngineWith({}, [cooledDown])
    cast(buffs, ["cooledDown"], { lastHitSec: 0 }, 10)
    cast(buffs, ["cooledDown"], { lastHitSec: 0 }, 10.5)
    expect(buffs.isBuffActiveAtTime("cooledDown", 15.2)).toBe(false)
    cast(buffs, ["cooledDown"], { lastHitSec: 0 }, 10 + 1 - 1e-12)
    expect(buffs.isBuffActiveAtTime("cooledDown", 15.9)).toBe(true)
  })
})

describe("one grant dispelling or blocking another", () => {
  const plain = defineBuff({
    id: "plain",
    name: "Plain",
    duration: 12,
    blockedWhileActive: ["supreme"],
    effects: [stat("allDamageBoost", 0.075)],
  })
  const supreme = defineBuff({
    id: "supreme",
    name: "Supreme",
    duration: 12,
    triggerPhase: ["below30", "exhausted"],
    dispelsOnGrant: ["plain"],
    effects: [stat("allDamageBoost", 0.15)],
  })
  const engine = () => buffEngineWith({}, [plain, supreme], [], exhaustedFrom(15, 15))

  it("a later grant of the dispelling one ends the window of the other where it lands", () => {
    const buffs = engine()
    cast(buffs, ["supreme", "plain"], {}, 10)
    expect(buffs.isBuffActiveAtTime("plain", 12)).toBe(true)
    cast(buffs, ["supreme", "plain"], {}, 18)
    expect(buffs.isBuffActiveAtTime("plain", 17.9)).toBe(true)
    expect(buffs.isBuffActiveAtTime("plain", 18.1)).toBe(false)
    expect(buffs.isBuffActiveAtTime("supreme", 18.1)).toBe(true)
  })

  it("a blocked grant neither opens nor refreshes its window", () => {
    const buffs = engine()
    cast(buffs, ["supreme", "plain"], {}, 20)
    cast(buffs, ["supreme", "plain"], {}, 31)
    expect(buffs.isBuffActiveAtTime("plain", 31.5)).toBe(false)
    expect(buffs.isBuffActiveAtTime("plain", 38)).toBe(false)
  })

  it("a phase list gates a grant on any of its phases", () => {
    const buffs = engine()
    cast(buffs, ["supreme"], {}, 5)
    expect(buffs.isBuffActiveAtTime("supreme", 6)).toBe(false)
    cast(buffs, ["supreme"], {}, 25)
    expect(buffs.isBuffActiveAtTime("supreme", 26)).toBe(true)
  })
})

describe("Blossom Barrage's Combo", () => {
  const umbrellaCast = (tier: number) => {
    const buffs = buffEngineWith(
      { blossomBarrage: true, blossomBarrageTier: tier },
      blossomBarrage.buffDefs ?? [],
    )
    buffs.processSkillCast("cast", 10, { lastHitSec: 0.8, castTime: 1.1 }, false, [
      BUFF.combo,
      BUFF.comboUmbLightBonus,
      BUFF.comboSpringAwayBonus,
    ])
    return buffs
  }

  it("lands a frame after the hit it comes from, so that hit never receives it", () => {
    const buffs = umbrellaCast(6)
    expect(buffs.isBuffActiveAtTime(BUFF.combo, 10.8)).toBe(false)
    expect(buffs.isBuffActiveAtTime(BUFF.combo, 10.8 + 1 / 60 + 0.001)).toBe(true)
  })

  it("lasts 15 s from rank 3 and 10 s below it", () => {
    expect(umbrellaCast(6).isBuffActiveAtTime(BUFF.combo, 10.85 + 14.9)).toBe(true)
    expect(umbrellaCast(6).isBuffActiveAtTime(BUFF.combo, 10.85 + 15.1)).toBe(false)
    expect(umbrellaCast(2).isBuffActiveAtTime(BUFF.combo, 10.85 + 9.9)).toBe(true)
    expect(umbrellaCast(2).isBuffActiveAtTime(BUFF.combo, 10.85 + 10.1)).toBe(false)
  })
})
