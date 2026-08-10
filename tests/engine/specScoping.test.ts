// A class only loads buff-defs from its OWN site spec, so a foreign spec's
// buff can't attach to an ability tag two specs happen to share (both
// bellstrike_umbra and stonesplit_might have a `SpearHeavy` skill, but only
// stonesplit_might's `drumbeat` should fire on it).
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

  it("umbra (bellstrikeUmbra) does NOT load stonesplit's drumbeat/vulnerability", () => {
    const ids = new Set(buffDefsForClass("bellstrikeUmbra").map((d) => d.id))
    expect(ids.has("drumbeat")).toBe(false)
    expect(ids.has("vulnerability")).toBe(false)
    expect(ids.has("vulnerabilityWeapon")).toBe(false)
  })

  it("keeps the universal fluteBoost for a class whose spec bucket omits it", () => {
    const ids = new Set(buffDefsForClass("bellstrikeUmbra").map((d) => d.id))
    expect(ids.has("fluteBoost")).toBe(true)
  })

  it("unknown class falls back to the full universe", () => {
    const ids = new Set(buffDefsForClass("unknownClass").map((d) => d.id))
    expect(ids.has("drumbeat")).toBe(true)
  })
})

describe("spec-scoping — mechanicBuffDefsForClass", () => {
  it("loads soulShaken + umbra bleed buffs for the umbra class, spec-gated so they cannot leak elsewhere", () => {
    const umbra = mechanicBuffDefsForClass("bellstrikeUmbra")
    const ids = new Set(umbra.map((d) => d.id))
    expect(ids.has("soulShaken")).toBe(true)
    expect(ids.has("bellstrikeUmbraBleedPen")).toBe(true)

    // The gate itself: an untagged def is universal, so these must carry the spec.
    for (const id of ["soulShaken", "bellstrikeUmbraBleedPen"]) {
      expect(umbra.find((buffModule) => buffModule.id === id)!.specs).toContain("bellstrike_umbra")
    }
  })
})
