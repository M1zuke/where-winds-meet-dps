import { beforeEach, describe, expect, it } from "vitest"
import { makeDebuff, isDebuff, seedDebuffFromBuiltin, type Debuff } from "../../src/engine/debuff"
import {
  saveCustomDebuff,
  deleteCustomDebuff,
  loadCustomDebuffsForClass,
  exportCustomDebuff,
  importCustomDebuff,
} from "../../src/storage"
import { kvStore } from "../../src/kvStore"

const CLASS = "bellstrikeUmbra"

describe("makeDebuff — defaults", () => {
  it("seeds sane defaults with no DoT and flat/1-stack scaling", () => {
    const d = makeDebuff(CLASS, { name: "Bleed" })
    expect(d.classId).toBe(CLASS)
    expect(d.name).toBe("Bleed")
    expect(d.activation).toBe("triggered")
    expect(d.durationFrames).toBe(600)
    expect(d.effects).toEqual([])
    expect(d.dot).toBeNull()
    expect(d.maxStacks).toBe(1)
    expect(d.stackScaling).toBe("flat")
    expect(isDebuff(d)).toBe(true)
  })
})

describe("isDebuff — validation + tolerance", () => {
  it("rejects an object missing required identity fields", () => {
    const d = makeDebuff(CLASS, { name: "x" })
    expect(isDebuff({ ...d, activation: "not-a-mode" })).toBe(false)
    expect(isDebuff({ ...d, effects: "not-an-array" })).toBe(false)
    expect(isDebuff({ ...d, effects: [{ statKey: "target.defense" }] })).toBe(false)
  })

  it("tolerates a debuff object missing stackScaling/maxStacks (pre-stacking blob)", () => {
    const d = makeDebuff(CLASS, { name: "legacy" }) as unknown as Record<string, unknown>
    delete d.stackScaling
    delete d.maxStacks
    expect(isDebuff(d)).toBe(true)
  })

  it("does not deep-validate a malformed dot — hydrate sanitizes it instead", () => {
    const d = makeDebuff(CLASS, { name: "x", dot: "not-an-object" as unknown as Debuff["dot"] })
    expect(isDebuff(d)).toBe(true)
  })

  it("accepts a triggersBuffs array of ids, and rejects a non-array or non-string entry", () => {
    const withTriggers = makeDebuff(CLASS, { name: "x", triggersBuffs: ["mountainSplitter"] })
    expect(isDebuff(withTriggers)).toBe(true)
    expect(isDebuff({ ...withTriggers, triggersBuffs: "mountainSplitter" })).toBe(false)
    expect(isDebuff({ ...withTriggers, triggersBuffs: [42] })).toBe(false)
  })
})

describe("seedDebuffFromBuiltin — carries triggersBuffs through, like receives", () => {
  it("copies an explicit triggersBuffs onto the seeded copy", () => {
    const builtin = makeDebuff(CLASS, { name: "Source", triggersBuffs: ["mountainSplitter"] })
    const seeded = seedDebuffFromBuiltin(CLASS, builtin)
    expect(seeded.triggersBuffs).toEqual(["mountainSplitter"])
  })

  it("leaves the seeded copy without one when the source carries none", () => {
    const builtin = makeDebuff(CLASS, { name: "Source" })
    const seeded = seedDebuffFromBuiltin(CLASS, builtin)
    expect(seeded.triggersBuffs).toBeUndefined()
  })
})

describe("storage round-trip", () => {
  beforeEach(() => {
    try {
      kvStore.remove("wwm.customDebuffs")
    } catch {}
    try {
      kvStore.remove("wwm.customBuffs")
    } catch {}
  })

  it("save / load / delete a debuff", () => {
    const d = makeDebuff(CLASS, {
      name: "Bleed",
      effects: [{ statKey: "target.generalDamageTaken", amount: 0.1 }],
    })
    saveCustomDebuff(d)
    expect(loadCustomDebuffsForClass(CLASS).some((x) => x.id === d.id)).toBe(true)
    deleteCustomDebuff(d.id)
    expect(loadCustomDebuffsForClass(CLASS).some((x) => x.id === d.id)).toBe(false)
  })

  it("export → import preserves effects + dot + stacking fields and reassigns id/class", () => {
    const d = makeDebuff(CLASS, {
      name: "Combustion",
      durationFrames: 300,
      effects: [{ statKey: "target.generalDamageTaken", amount: 0.1 }],
      dot: {
        tickIntervalFrames: 60,
        physMultiplier: 1,
        physFixed: 100,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
      },
      maxStacks: 5,
      stackScaling: "perStack",
    })
    const imported = importCustomDebuff(exportCustomDebuff(d), "bellstrikeUmbra")
    expect(imported.id).not.toBe(d.id)
    expect(imported.classId).toBe("bellstrikeUmbra")
    expect(imported.effects).toEqual(d.effects)
    expect(imported.dot?.tickIntervalFrames).toBe(60)
    expect(imported.maxStacks).toBe(5)
    expect(imported.stackScaling).toBe("perStack")
  })

  it("export → import carries an explicit receives through unchanged", () => {
    const debuff = makeDebuff(CLASS, {
      name: "Combustion",
      receives: ["bellstrikeUmbraBleedingDamage"],
    })
    const imported = importCustomDebuff(exportCustomDebuff(debuff), "bellstrikeUmbra")
    expect(imported.receives).toEqual(["bellstrikeUmbraBleedingDamage"])
  })

  it("export → import carries an explicit triggersBuffs through unchanged", () => {
    const debuff = makeDebuff(CLASS, {
      name: "Combustion",
      triggersBuffs: ["mountainSplitter"],
    })
    const imported = importCustomDebuff(exportCustomDebuff(debuff), "bellstrikeUmbra")
    expect(imported.triggersBuffs).toEqual(["mountainSplitter"])
  })

  it("import heals receives immediately from a dot's implied sustain type", () => {
    const dotDebuff = makeDebuff(CLASS, {
      name: "Combustion",
      dot: {
        tickIntervalFrames: 60,
        physMultiplier: 1,
        physFixed: 100,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
      },
    })
    const imported = importCustomDebuff(exportCustomDebuff(dotDebuff), "bellstrikeUmbra")
    expect(imported.receives).toEqual(["soulShaken"])
  })

  it("export → import preserves a well-formed perStackShapes table", () => {
    const d = makeDebuff(CLASS, {
      name: "Bleed",
      maxStacks: 3,
      stackScaling: "flat",
      dot: {
        tickIntervalFrames: 60,
        physMultiplier: 0,
        physFixed: 0,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
        perStackShapes: [
          { physMultiplier: 0, physFixed: 100, attributeMultiplier: 0, attributeFixed: 0 },
          { physMultiplier: 0, physFixed: 250, attributeMultiplier: 0, attributeFixed: 0 },
          { physMultiplier: 0, physFixed: 500, attributeMultiplier: 0, attributeFixed: 0 },
        ],
      },
    })
    const imported = importCustomDebuff(exportCustomDebuff(d), "bellstrikeUmbra")
    expect(imported.dot?.perStackShapes).toEqual(d.dot!.perStackShapes)
  })

  it("export → import preserves a perStackMultipliers ladder, and sanitizes a malformed one to ×1", () => {
    const d = makeDebuff(CLASS, {
      name: "Bleed",
      maxStacks: 5,
      stackScaling: "perStack",
      dot: {
        tickIntervalFrames: 60,
        physMultiplier: 0.06864,
        physFixed: 0,
        attributeMultiplier: 0.10296,
        attributeFixed: 0,
        attributeAttack: "Bellstrike",
        skillType: "sustain",
        count: 1,
        perStackShapes: null,
        perStackMultipliers: [2, 2.5, 3, 4, 5],
      },
    })
    expect(
      importCustomDebuff(exportCustomDebuff(d), "bellstrikeUmbra").dot?.perStackMultipliers,
    ).toEqual([2, 2.5, 3, 4, 5])

    const corrupt = importCustomDebuff(
      JSON.stringify({
        name: "Corrupt",
        maxStacks: 5,
        stackScaling: "perStack",
        dot: {
          tickIntervalFrames: 60,
          physMultiplier: 0.1,
          physFixed: 0,
          attributeMultiplier: 0.1,
          attributeFixed: 0,
          attributeAttack: "",
          skillType: "sustain",
          count: 1,
          perStackMultipliers: [2, "nope", -3, null, 5],
        },
      }),
      "bellstrikeUmbra",
    )
    expect(corrupt.dot?.perStackMultipliers).toEqual([2, 1, 1, 1, 5])

    const none = importCustomDebuff(
      JSON.stringify({
        name: "None",
        maxStacks: 5,
        stackScaling: "perStack",
        dot: {
          tickIntervalFrames: 60,
          physMultiplier: 0.1,
          physFixed: 0,
          attributeMultiplier: 0.1,
          attributeFixed: 0,
          attributeAttack: "",
          skillType: "sustain",
          count: 1,
          perStackMultipliers: [],
        },
      }),
      "bellstrikeUmbra",
    )
    expect(none.dot?.perStackMultipliers).toBeNull()
  })

  it("importCustomDebuff sanitizes a malformed perStackShapes into null / finite numbers", () => {
    const raw = JSON.stringify({
      name: "Corrupt",
      maxStacks: 3,
      stackScaling: "flat",
      dot: {
        tickIntervalFrames: 60,
        physMultiplier: 0,
        physFixed: 0,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
        perStackShapes: [{ physMultiplier: "not-a-number", physFixed: 100 }, null, 42],
      },
    })
    const imported = importCustomDebuff(raw, CLASS)
    expect(imported.dot?.perStackShapes).toEqual([
      { physMultiplier: 0, physFixed: 100, attributeMultiplier: 0, attributeFixed: 0 },
      { physMultiplier: 0, physFixed: 0, attributeMultiplier: 0, attributeFixed: 0 },
      { physMultiplier: 0, physFixed: 0, attributeMultiplier: 0, attributeFixed: 0 },
    ])

    const emptyTable = importCustomDebuff(
      JSON.stringify({
        name: "Empty",
        dot: {
          tickIntervalFrames: 60,
          physMultiplier: 0,
          physFixed: 0,
          attributeMultiplier: 0,
          attributeFixed: 0,
          attributeAttack: "",
          skillType: "sustain",
          count: 1,
          perStackShapes: [],
        },
      }),
      CLASS,
    )
    expect(emptyTable.dot?.perStackShapes).toBeNull()
  })

  it("importCustomDebuff drops any player-scope effect (debuffs are target-only)", () => {
    const raw = JSON.stringify({
      name: "Mixed",
      effects: [
        { statKey: "target.defense", amount: -50 },
        { statKey: "critDamageBoost", amount: 0.2 },
      ],
    })
    const imported = importCustomDebuff(raw, CLASS)
    expect(imported.effects).toEqual([{ statKey: "target.defense", amount: -50 }])
  })

  it("a debuff missing stackScaling (pre-stacking blob) hydrates to 'flat' with maxStacks >= 1", () => {
    const d = makeDebuff(CLASS, { name: "legacy" })
    const legacy = { ...d, maxStacks: 0 } as Debuff
    delete (legacy as unknown as Record<string, unknown>).stackScaling
    saveCustomDebuff(legacy)
    const loaded = loadCustomDebuffsForClass(CLASS).find((x) => x.name === "legacy")
    expect(loaded?.stackScaling).toBe("flat")
    expect(loaded?.maxStacks).toBeGreaterThanOrEqual(1)
  })

  it("loadCustomDebuffs strips a malformed perStackShapes on hydrate", () => {
    const d = makeDebuff(CLASS, {
      name: "CorruptStored",
      dot: {
        tickIntervalFrames: 60,
        physMultiplier: 0,
        physFixed: 0,
        attributeMultiplier: 0,
        attributeFixed: 0,
        attributeAttack: "",
        skillType: "sustain",
        count: 1,
      },
    })
    const corruptedDot = { ...d.dot, perStackShapes: "not-an-array" }
    const corrupted = { ...d, dot: corruptedDot } as unknown as Debuff
    saveCustomDebuff(corrupted)
    const loaded = loadCustomDebuffsForClass(CLASS).find((x) => x.name === "CorruptStored")
    expect(loaded?.dot?.perStackShapes).toBeNull()
  })

  it("loadCustomDebuffsForClass filters by classId", () => {
    saveCustomDebuff(makeDebuff(CLASS, { name: "A" }))
    saveCustomDebuff(makeDebuff("someOtherClass", { name: "B" }))
    const mine = loadCustomDebuffsForClass(CLASS)
    expect(mine.every((d) => d.classId === CLASS)).toBe(true)
    expect(mine.some((d) => d.name === "A")).toBe(true)
    expect(mine.some((d) => d.name === "B")).toBe(false)
  })
})
