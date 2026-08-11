// A class only loads buff-defs from its own site-spec bucket; the
// mechanic-scoped defs (soulShaken, the two bleed defs) live in a separate
// list (`ClassDef.mechanicBuffDefs`) and never leak into `buffDefsForClass`.
import { describe, expect, it } from "vitest"
import {
  buffDefsForClass,
  mechanicBuffDefsForClass,
  specForClass,
} from "../../src/engine/buffs/data"

describe("spec-scoping — buffDefsForClass", () => {
  it("maps the class to its spec", () => {
    expect(specForClass("bellstrikeUmbra")).toBe("bellstrike_umbra")
    expect(specForClass("unknownClass")).toBeUndefined()
  })

  it("bellstrikeUmbra's class-buff bucket does NOT pull in the mechanic-scoped defs", () => {
    const ids = new Set(buffDefsForClass("bellstrikeUmbra").map((d) => d.id))
    expect(ids.has("soulShaken")).toBe(false)
    expect(ids.has("bellstrikeUmbraBleedPen")).toBe(false)
    expect(ids.has("bellstrikeUmbraBleedingDamage")).toBe(false)
  })

  it("keeps the universal fluteBoost for a class whose spec bucket omits it", () => {
    const ids = new Set(buffDefsForClass("bellstrikeUmbra").map((d) => d.id))
    expect(ids.has("fluteBoost")).toBe(true)
  })

  it("unknown class falls back to the full universe", () => {
    const ids = new Set(buffDefsForClass("unknownClass").map((d) => d.id))
    expect(ids.has("concentration")).toBe(true)
  })
})

describe("spec-scoping — mechanicBuffDefsForClass", () => {
  it("returns exactly soulShaken + the two umbra bleed buffs for the umbra class, each carrying the class-buff marker", () => {
    const umbra = mechanicBuffDefsForClass("bellstrikeUmbra")
    const ids = umbra.map((module) => module.id).sort()
    expect(ids).toEqual(
      ["bellstrikeUmbraBleedPen", "bellstrikeUmbraBleedingDamage", "soulShaken"].sort(),
    )
    // Ownership, not a tag: mechanicBuffDefsForClass returning a def IS the
    // scope statement, and every returned module is a declared class buff.
    for (const module of umbra) expect("classBuff" in module).toBe(true)
  })
})
