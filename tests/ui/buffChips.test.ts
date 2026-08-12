import { describe, expect, it } from "vitest"
import {
  buffChipHue,
  castBuffDisplayOrder,
  visibleCastBuffs,
  FALLBACK_BUFF_HUES,
} from "../../src/ui/features/rotation/buffChips"
import { hiddenTimelineBuffIds } from "../../src/engine/buffs/catalog"
import type { CastBuffTag, RotationCast } from "../../src/engine/types"

function tag(id: string, name: string): CastBuffTag {
  return { id, name, stacks: 1, maxStacks: 1, effects: [] }
}

function cast(index: number, timeSec: number, buffs: CastBuffTag[]): RotationCast {
  return {
    index,
    stepId: `step-${index}`,
    stepIndex: index - 1,
    skillName: `skill-${index}`,
    timeSec,
    inWindow: true,
    prePull: false,
    buffs,
  }
}

describe("buffChipHue", () => {
  it("returns the pinned hues for Bleed Tick / Smolder / Zenith Bar / Bitter Season Tick / Bitter Season Poison", () => {
    expect(buffChipHue("Bleed Tick")).toBe(0)
    expect(buffChipHue("Smolder")).toBe(30)
    expect(buffChipHue("Zenith Bar")).toBe(200)
    expect(buffChipHue("Bitter Season Tick")).toBe(100)
    expect(buffChipHue("Bitter Season Poison")).toBe(130)
  })

  it("the five pinned hues are distinct", () => {
    const hues = new Set([
      buffChipHue("Bleed Tick"),
      buffChipHue("Smolder"),
      buffChipHue("Zenith Bar"),
      buffChipHue("Bitter Season Tick"),
      buffChipHue("Bitter Season Poison"),
    ])
    expect(hues.size).toBe(5)
  })

  it("is stable for an unpinned name across calls and always lands in FALLBACK_BUFF_HUES", () => {
    const names = [
      "River Flow",
      "Soul Shaken",
      "Combustion",
      "Morale Chant",
      "Concentration",
      "Hawkwing (4-pc)",
      "Zenith Detonation",
      "Spear Special Cooldown",
    ]
    for (const name of names) {
      const first = buffChipHue(name)
      const second = buffChipHue(name)
      expect(second).toBe(first)
      expect(FALLBACK_BUFF_HUES).toContain(first)
    }
  })

  it("never returns a pinned hue for an unpinned name", () => {
    const pinned = new Set([0, 30, 200, 100, 130])
    const names = [
      "River Flow",
      "Soul Shaken",
      "Combustion",
      "Morale Chant",
      "Concentration",
      "Hawkwing (4-pc)",
      "Zenith Detonation",
      "Spear Special Cooldown",
    ]
    for (const name of names) {
      expect(pinned.has(buffChipHue(name))).toBe(false)
    }
  })
})

describe("castBuffDisplayOrder", () => {
  it("assigns slot 0/1/... by first chronological appearance and appends a late arrival at the end", () => {
    const casts = [
      cast(1, 0, [tag("a", "A"), tag("b", "B")]),
      cast(2, 1, [tag("a", "A"), tag("b", "B")]),
      cast(3, 2, [tag("a", "A"), tag("b", "B"), tag("c", "C")]),
    ]
    const order = castBuffDisplayOrder(casts, new Set())
    expect(order.get("a")).toBe(0)
    expect(order.get("b")).toBe(1)
    expect(order.get("c")).toBe(2)
  })

  it("sorts by index first even when the input array isn't already sorted", () => {
    const casts = [
      cast(2, 1, [tag("b", "B")]),
      cast(1, 0, [tag("a", "A")]),
      cast(3, 2, [tag("c", "C")]),
    ]
    const order = castBuffDisplayOrder(casts, new Set())
    expect(order.get("a")).toBe(0)
    expect(order.get("b")).toBe(1)
    expect(order.get("c")).toBe(2)
  })

  it("skips hidden ids entirely (they never occupy a slot)", () => {
    const casts = [cast(1, 0, [tag("hidden", "Hidden"), tag("a", "A")])]
    const order = castBuffDisplayOrder(casts, new Set(["hidden"]))
    expect(order.has("hidden")).toBe(false)
    expect(order.get("a")).toBe(0)
  })

  it("returns an empty map when casts is undefined", () => {
    const order = castBuffDisplayOrder(undefined, new Set())
    expect(order.size).toBe(0)
  })
})

describe("visibleCastBuffs", () => {
  it("drops hidden ids", () => {
    const buffs = [tag("hidden", "Hidden"), tag("a", "A")]
    const result = visibleCastBuffs(buffs, new Set(["hidden"]), new Map([["a", 0]]))
    expect(result.map((b) => b.id)).toEqual(["a"])
  })

  it("does not mutate the input array", () => {
    const buffs = [tag("b", "B"), tag("a", "A")]
    const original = [...buffs]
    visibleCastBuffs(
      buffs,
      new Set(),
      new Map([
        ["a", 0],
        ["b", 1],
      ]),
    )
    expect(buffs).toEqual(original)
  })

  it("returns rows in the shared order regardless of per-cast source order, and keeps relative order stable between rows (A B D vs A B C D)", () => {
    const order = new Map([
      ["a", 0],
      ["b", 1],
      ["c", 2],
      ["d", 3],
    ])
    const row1 = visibleCastBuffs([tag("d", "D"), tag("b", "B"), tag("a", "A")], new Set(), order)
    expect(row1.map((b) => b.id)).toEqual(["a", "b", "d"])

    const row2 = visibleCastBuffs(
      [tag("c", "C"), tag("a", "A"), tag("d", "D"), tag("b", "B")],
      new Set(),
      order,
    )
    expect(row2.map((b) => b.id)).toEqual(["a", "b", "c", "d"])
  })
})

describe("hiddenTimelineBuffIds ties into real Bellstrike Umbra data", () => {
  it("contains the two always-on passives and excludes Soul Shaken", () => {
    const ids = hiddenTimelineBuffIds("bellstrikeUmbra")
    expect(ids.has("bellstrikeUmbraBleedPen")).toBe(true)
    expect(ids.has("bellstrikeUmbraBleedingDamage")).toBe(true)
    expect(ids.has("soulShaken")).toBe(false)
  })
})
