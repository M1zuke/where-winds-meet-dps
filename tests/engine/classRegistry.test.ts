import { describe, expect, it } from "vitest"
import { CLASS_IDS, classDefinition } from "../../src/data/classes/registry"

describe("class registry — one call answers what a class is made of", () => {
  it("knows every class, and nothing else", () => {
    expect(CLASS_IDS).toContain("bellstrikeUmbra")
    expect(CLASS_IDS).toHaveLength(8)
    expect(classDefinition("notAClass")).toBeNull()
  })

  it("assembles Bellstrike Umbra from every registry that used to be separate", () => {
    const umbra = classDefinition("bellstrikeUmbra")!
    expect(umbra.spec).toBe("bellstrike_umbra")
    expect(umbra.primaryAttribute).toBe("Bellstrike")
    expect(umbra.innerWays).toContain("Sword Horizon")
    expect(umbra.dingYinTags).toEqual(["Bleed Boost"])
    expect(umbra.skills.length).toBeGreaterThan(20)
    expect(umbra.debuffs.map((d) => d.name)).toContain("Bleed Tick")
    expect(umbra.buffs.map((b) => b.name)).toContain("River Flow")
    expect(umbra.rotations.length).toBeGreaterThan(0)
    expect(umbra.defaultRotationId).toBeTruthy()
    expect(umbra.attunements.map((a) => a.id)).toContain("bleedingDamage")
    expect(umbra.retunementPool).not.toBeNull()
  })

  it("gives every class a resolvable definition", () => {
    for (const classId of CLASS_IDS) {
      const definition = classDefinition(classId)
      expect(definition, classId).not.toBeNull()
      expect(definition!.primaryAttribute, classId).toBeTruthy()
    }
  })
})
