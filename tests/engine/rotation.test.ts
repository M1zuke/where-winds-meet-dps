import { beforeEach, describe, expect, it } from "vitest"
import { isRotation, makeRotation, makeStep, resolveRotation } from "../../src/engine/rotation"
import { makeSkill } from "../../src/engine/skill"
import { makeBuff } from "../../src/engine/buff"
import {
  saveCustomRotation,
  loadCustomRotations,
  exportCustomRotation,
  importCustomRotation,
} from "../../src/storage"
import { kvStore } from "../../src/kvStore"

const CLASS = "bellstrikeUmbra"

describe("makeRotation / makeStep — defaults", () => {
  it("makeRotation seeds an empty step list and no permanent buffs", () => {
    const r = makeRotation(CLASS, { name: "test" })
    expect(r.classId).toBe(CLASS)
    expect(r.steps).toEqual([])
    expect(r.permanentBuffIds).toEqual([])
    expect(isRotation(r)).toBe(true)
  })

  it("makeStep defaults hitCount to 1 and prePull to false", () => {
    const s = makeStep({ skillId: "sk-1" })
    expect(s.hitCount).toBe(1)
    expect(s.prePull).toBe(false)
  })
})

describe("isRotation — validation", () => {
  it("rejects a rotation with a malformed step", () => {
    const r = makeRotation(CLASS, {
      steps: [{ ...makeStep(), hitCount: "1" as unknown as number }],
    })
    expect(isRotation(r)).toBe(false)
  })

  it("rejects a rotation whose permanentBuffIds isn't a string array", () => {
    const r = makeRotation(CLASS, { permanentBuffIds: [1 as unknown as string] })
    expect(isRotation(r)).toBe(false)
  })
})

describe("resolveRotation — binding + diagnostics", () => {
  it("binds every step to its skill, in order", () => {
    const a = makeSkill(CLASS, { name: "A" })
    const b = makeSkill(CLASS, { name: "B" })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: a.id, hitCount: 1 }), makeStep({ skillId: b.id, hitCount: 2 })],
    })
    const { steps, warnings } = resolveRotation(rotation, [a, b], [])
    expect(steps).toHaveLength(2)
    expect(steps[0].skill.name).toBe("A")
    expect(steps[1].skill.name).toBe("B")
    expect(warnings).toHaveLength(0)
  })

  it("reports and skips a step whose skillId no longer exists", () => {
    const rotation = makeRotation(CLASS, { steps: [makeStep({ skillId: "missing-skill" })] })
    const { steps, warnings } = resolveRotation(rotation, [], [])
    expect(steps).toHaveLength(0)
    expect(warnings.length).toBeGreaterThan(0)
  })

  it("reports a missing permanent buff id", () => {
    const a = makeSkill(CLASS, { name: "A" })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: a.id })],
      permanentBuffIds: ["missing-buff"],
    })
    const { warnings } = resolveRotation(rotation, [a], [])
    expect(warnings.some((w) => w.includes("permanent buff"))).toBe(true)
  })

  it("resolves a valid permanent buff id without warning", () => {
    const a = makeSkill(CLASS, { name: "A" })
    const buff = makeBuff(CLASS, { name: "Passive" })
    const rotation = makeRotation(CLASS, {
      steps: [makeStep({ skillId: a.id })],
      permanentBuffIds: [buff.id],
    })
    const { warnings } = resolveRotation(rotation, [a], [buff])
    expect(warnings.some((w) => w.includes("permanent buff"))).toBe(false)
  })

  it("reports an empty rotation", () => {
    const rotation = makeRotation(CLASS, { steps: [] })
    const { warnings } = resolveRotation(rotation, [], [])
    expect(warnings.length).toBeGreaterThan(0)
  })
})

describe("storage round-trip", () => {
  beforeEach(() => {
    try {
      kvStore.remove("wwm.customRotations")
    } catch {}
  })

  it("save → load preserves steps + permanentBuffIds", () => {
    const r = makeRotation(CLASS, {
      name: "Saved Rotation",
      steps: [makeStep({ skillId: "sk-a", hitCount: 3, prePull: true })],
      permanentBuffIds: ["bf-a"],
    })
    saveCustomRotation(r)
    const loaded = loadCustomRotations().find((x) => x.id === r.id)
    expect(loaded).toBeTruthy()
    expect(loaded!.steps[0].skillId).toBe("sk-a")
    expect(loaded!.steps[0].hitCount).toBe(3)
    expect(loaded!.steps[0].prePull).toBe(true)
    expect(loaded!.permanentBuffIds).toEqual(["bf-a"])
  })

  it("drops the retired pre-pull toggle from a rotation saved while it still existed", () => {
    const stale = { ...makeRotation(CLASS, { name: "Stale" }), prePullHitsCount: false }
    saveCustomRotation(stale)
    const loaded = loadCustomRotations().find((x) => x.id === stale.id)!
    expect("prePullHitsCount" in loaded).toBe(false)
  })

  it("export → import regenerates rotation + step ids", () => {
    const r = makeRotation(CLASS, { name: "x", steps: [makeStep({ skillId: "sk-a" })] })
    const imported = importCustomRotation(exportCustomRotation(r))
    expect(imported.id).not.toBe(r.id)
    expect(imported.steps[0].id).not.toBe(r.steps[0].id)
    expect(imported.steps[0].skillId).toBe("sk-a")
  })

  it("a stale v1 (entries/count) blob is dropped on load", () => {
    kvStore.set(
      "wwm.customRotations",
      JSON.stringify({
        v: 1,
        rotations: [
          {
            id: "cr-1",
            name: "old",
            classId: CLASS,
            duration: 60,
            entries: [{ sourceTickId: "x", count: 1 }],
            createdAt: "2020-01-01T00:00:00.000Z",
            updatedAt: "2020-01-01T00:00:00.000Z",
          },
        ],
      }),
    )
    expect(loadCustomRotations()).toEqual([])
  })
})
