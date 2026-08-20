// A class's own `classBuffDefs` is reachable purely by being that class;
// `buffDefsForClass` additionally folds in every slottable inner way's
// buffDefs and the globals — see docs/CLASSES.md § "Buff ownership".
import { describe, expect, it } from "vitest"
import { buffDefsForClass, specForClass } from "../../src/engine/buffs/data"
import { classDefinition } from "../../src/definitions/classes/registry"

describe("spec-scoping — buffDefsForClass", () => {
  it("maps the class to its spec", () => {
    expect(specForClass("bellstrikeUmbra")).toBe("bellstrike_umbra")
    expect(specForClass("unknownClass")).toBeUndefined()
  })

  it("bellstrikeUmbra's composed bucket DOES contain the once-mechanic-scoped defs — the class-owned pair marked, the inner-way-owned soulShaken unmarked", () => {
    const ids = new Set(buffDefsForClass("bellstrikeUmbra").map((d) => d.id))
    expect(ids.has("soulShaken")).toBe(true)
    expect(ids.has("bellstrikeUmbraBleedPen")).toBe(true)
    expect(ids.has("bellstrikeUmbraBleedingDamage")).toBe(true)
    for (const id of ["bellstrikeUmbraBleedPen", "bellstrikeUmbraBleedingDamage"]) {
      const module = buffDefsForClass("bellstrikeUmbra").find((candidate) => candidate.id === id)!
      expect("classBuff" in module).toBe(true)
    }
    const soulShaken = buffDefsForClass("bellstrikeUmbra").find(
      (candidate) => candidate.id === "soulShaken",
    )!
    expect("classBuff" in soulShaken).toBe(false)
  })

  it("keeps the universal fluteBoost for a class whose spec bucket omits it", () => {
    const ids = new Set(buffDefsForClass("bellstrikeUmbra").map((d) => d.id))
    expect(ids.has("fluteBoost")).toBe(true)
  })

  it("unknown class falls back to the full universe", () => {
    const ids = new Set(buffDefsForClass("unknownClass").map((d) => d.id))
    expect(ids.has("soulShaken")).toBe(true)
    expect(ids.has("fluteBoost")).toBe(true)
  })
})

describe("spec-scoping — classDef.classBuffDefs, the class's own", () => {
  it("bellstrikeUmbra's own list is exactly the two bleed passives, each carrying the class-buff marker", () => {
    const umbra = classDefinition("bellstrikeUmbra")!.classBuffDefs
    expect(umbra.map((module) => module.id).sort()).toEqual(
      ["bellstrikeUmbraBleedPen", "bellstrikeUmbraBleedingDamage"].sort(),
    )
    for (const module of umbra) expect("classBuff" in module).toBe(true)
  })
})
