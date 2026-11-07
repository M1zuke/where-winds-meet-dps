import { describe, expect, it } from "vitest"
import { SCRIPT_IDS, SCRIPT_MIN_BREAKTHROUGH } from "../../src/data/skills/buffs/scriptOptions"
import { QI_TARGET_IDS } from "../../src/definitions/baseStats/qiTargetDef"
import { defaultInputs } from "../../src/engine/defaults"
import { runEngine } from "../../src/engine/dps"
import { computeEncounterOptions } from "../../src/engine/dpsWorker"
import {
  activeEncounterOptionCount,
  encounterFieldsEqual,
  encounterOptionVariants,
  encounterOptionsOf,
  sortEncounterOptionsByDps,
  withEncounterFieldsOf,
} from "../../src/engine/encounterOptions"
import { defaultCombatSettings, type Inputs, type ScriptId } from "../../src/engine/types"

// Scoped to Bellstrike Umbra, a validated class (CLAUDE.md § "Implemented classes").
const UNLOCKED_BREAKTHROUGH = 16
const umbraInputs: Inputs = {
  ...defaultInputs,
  classId: "bellstrikeUmbra",
  breakthrough: UNLOCKED_BREAKTHROUGH,
  food: "simmeringFishSlices",
}

function dpsFor(inputs: Inputs): number {
  return runEngine(inputs).dps
}

function withScript(inputs: Inputs, script: ScriptId | null): Inputs {
  return { ...inputs, combatSettings: { ...defaultCombatSettings(), script } }
}

describe("computeEncounterOptions", { timeout: 60_000 }, () => {
  it("echoes reqId and category and reports the baseline of the inputs as given", () => {
    const res = computeEncounterOptions({ reqId: 7, inputs: umbraInputs, category: "food" })
    expect(res.reqId).toBe(7)
    expect(res.category).toBe("food")
    expect(res.baselineDps).toBe(dpsFor(umbraInputs))
  })

  it("answers every script except the selected one, matching the direct pipeline", () => {
    const res = computeEncounterOptions({ reqId: 1, inputs: umbraInputs, category: "scripts" })
    const unlocked = SCRIPT_IDS.filter(
      (script) => SCRIPT_MIN_BREAKTHROUGH[script] <= UNLOCKED_BREAKTHROUGH,
    )
    expect(Object.keys(res.dpsByOption).sort()).toEqual(
      unlocked.map((script) => `script:${script}`).sort(),
    )
    for (const script of unlocked) {
      expect(res.dpsByOption[`script:${script}`]).toBe(dpsFor(withScript(umbraInputs, script)))
    }
  })

  it("answers the unselected choices only, including a switch back to none", () => {
    const withScriptOn = withScript(umbraInputs, "opportunityScript")
    const res = computeEncounterOptions({ reqId: 1, inputs: withScriptOn, category: "scripts" })
    expect(res.dpsByOption).not.toHaveProperty("script:opportunityScript")
    expect(res.dpsByOption["script:none"]).toBe(dpsFor(withScript(umbraInputs, null)))
  })

  it("answers every food choice but the selected ones, matching the direct pipeline", () => {
    const res = computeEncounterOptions({ reqId: 1, inputs: umbraInputs, category: "food" })
    expect(res.dpsByOption).not.toHaveProperty("food:simmeringFishSlices")
    expect(res.dpsByOption).not.toHaveProperty("hpFood:none")
    expect(res.dpsByOption["food:none"]).toBe(dpsFor({ ...umbraInputs, food: null }))
    expect(res.dpsByOption["food:twinImmortalsStew"]).toBeUndefined()
    expect(res.dpsByOption["food:doubleShreds"]).toBe(
      dpsFor({ ...umbraInputs, food: "doubleShreds" }),
    )
    expect(res.dpsByOption["hpFood:lotusSoup"]).toBeUndefined()
    expect(res.dpsByOption["hpFood:wineBraisedPork"]).toBe(dpsFor(umbraInputs))
  })

  it("answers a toggle with its flipped state, matching the direct pipeline", () => {
    const res = computeEncounterOptions({ reqId: 1, inputs: umbraInputs, category: "food" })
    expect(res.dpsByOption.fragrantOrchidBathBean).toBe(
      dpsFor({
        ...umbraInputs,
        combatSettings: { ...defaultCombatSettings(), fragrantOrchidBathBean: true },
      }),
    )
  })

  it("answers every divinecraft option but the selected one with its full pair", () => {
    const fireInputs: Inputs = { ...umbraInputs, divinecraft: "fire", divinecraftRefinement: null }
    const res = computeEncounterOptions({ reqId: 1, inputs: fireInputs, category: "divinecraft" })
    expect(Object.keys(res.dpsByOption).sort()).toEqual([
      "divinecraft:none",
      "divinecraft:poison",
      "divinecraft:water",
      "divinecraftRefinement:cinderAsh",
      "divinecraftRefinement:condensedMalice",
      "divinecraftRefinement:deepPool",
      "divinecraftRefinement:scorchingFlame",
      "divinecraftRefinement:vastOcean",
      "divinecraftRefinement:vipersFire",
    ])
    expect(res.dpsByOption["divinecraft:water"]).toBe(
      dpsFor({ ...fireInputs, divinecraft: "water", divinecraftRefinement: null }),
    )
    expect(res.dpsByOption["divinecraftRefinement:deepPool"]).toBe(
      dpsFor({ ...fireInputs, divinecraft: "water", divinecraftRefinement: "deepPool" }),
    )
  })

  it("answers every Qi target but the selected one in the extras category", () => {
    const res = computeEncounterOptions({ reqId: 1, inputs: umbraInputs, category: "extras" })
    for (const qiTarget of QI_TARGET_IDS) {
      const answered = `qiTarget:${qiTarget}` in res.dpsByOption
      expect(answered).toBe(qiTarget !== "swordTrial")
    }
    expect(res.dpsByOption["qiTarget:herosRealm"]).toBe(
      dpsFor({ ...umbraInputs, qiTarget: "herosRealm" }),
    )
  })
})

describe("encounter option catalogue", () => {
  it("offers no script variant below the breakthrough that unlocks it", () => {
    const belowEveryGate = { ...umbraInputs, breakthrough: 13 }
    expect(encounterOptionVariants(belowEveryGate, "scripts")).toEqual([])
  })

  it("leaves a script saved above the current breakthrough in place and uncounted", () => {
    const lowestGate = Math.min(...SCRIPT_IDS.map((script) => SCRIPT_MIN_BREAKTHROUGH[script]))
    const lockedScript = SCRIPT_IDS.find((script) => SCRIPT_MIN_BREAKTHROUGH[script] > lowestGate)!
    const saved = withScript({ ...umbraInputs, breakthrough: lowestGate }, lockedScript)
    expect(saved.combatSettings?.script).toBe(lockedScript)
    expect(activeEncounterOptionCount(saved, "scripts")).toBe(0)
    const variantIds = encounterOptionVariants(saved, "scripts").map((variant) => variant.id)
    expect(variantIds).toEqual([
      "script:none",
      ...SCRIPT_IDS.filter((script) => SCRIPT_MIN_BREAKTHROUGH[script] <= lowestGate).map(
        (script) => `script:${script}`,
      ),
    ])
  })

  it("counts toggles that are on and choices that are not none, and ignores fight setup", () => {
    const configured: Inputs = {
      ...umbraInputs,
      food: "simmeringFishSlices",
      hpFood: "wineBraisedPork",
      divinecraft: "poison",
      dummyMode: true,
      qiTarget: "herosRealm",
      combatSettings: { ...defaultCombatSettings(), healerBuff: true, script: "voidrotScript" },
    }
    expect(activeEncounterOptionCount(configured, "food")).toBe(2)
    expect(activeEncounterOptionCount(configured, "divinecraft")).toBe(1)
    expect(activeEncounterOptionCount(configured, "scripts")).toBe(1)
    expect(activeEncounterOptionCount(configured, "teammate")).toBe(1)
    expect(activeEncounterOptionCount(configured, "extras")).toBe(0)
    expect(activeEncounterOptionCount(configured)).toBe(5)
  })

  it("counts the divinecraft category once while an enchant applies, refined or not", () => {
    const refined: Inputs = {
      ...umbraInputs,
      divinecraft: "fire",
      divinecraftRefinement: "cinderAsh",
    }
    expect(activeEncounterOptionCount(refined, "divinecraft")).toBe(1)
    expect(activeEncounterOptionCount({ ...refined, divinecraft: "water" }, "divinecraft")).toBe(1)
    expect(activeEncounterOptionCount({ ...refined, divinecraft: null }, "divinecraft")).toBe(0)
    expect(
      activeEncounterOptionCount({ ...refined, divinecraftRefinement: null }, "divinecraft"),
    ).toBe(1)
  })

  describe("the flat divinecraft list", () => {
    const options = encounterOptionsOf("divinecraft")
    const optionById = (id: string) => options.find((option) => option.id === id)!
    const selectedIds = (inputs: Inputs) =>
      options.filter((option) => option.isSelected(inputs)).map((option) => option.id)

    it("lists every enchant with its refined items in a single ungrouped list", () => {
      expect(options.map((option) => option.id)).toEqual([
        "divinecraft:none",
        "divinecraft:fire",
        "divinecraftRefinement:cinderAsh",
        "divinecraftRefinement:scorchingFlame",
        "divinecraft:water",
        "divinecraftRefinement:deepPool",
        "divinecraftRefinement:vastOcean",
        "divinecraft:poison",
        "divinecraftRefinement:vipersFire",
        "divinecraftRefinement:condensedMalice",
      ])
      expect(options.every((option) => option.group === null)).toBe(true)
    })

    it("writes both fields when an option is picked", () => {
      const start: Inputs = { ...umbraInputs, divinecraft: "fire", divinecraftRefinement: null }
      const refined = optionById("divinecraftRefinement:vastOcean").select(start)
      expect([refined.divinecraft, refined.divinecraftRefinement]).toEqual(["water", "vastOcean"])
      const plain = optionById("divinecraft:poison").select(refined)
      expect([plain.divinecraft, plain.divinecraftRefinement]).toEqual(["poison", null])
      const none = optionById("divinecraft:none").select(refined)
      expect([none.divinecraft, none.divinecraftRefinement]).toEqual([null, null])
    })

    it("selects exactly the applied pair", () => {
      expect(
        selectedIds({ ...umbraInputs, divinecraft: null, divinecraftRefinement: null }),
      ).toEqual(["divinecraft:none"])
      expect(
        selectedIds({ ...umbraInputs, divinecraft: "water", divinecraftRefinement: "deepPool" }),
      ).toEqual(["divinecraftRefinement:deepPool"])
    })

    it("shows the plain enchant for a stored pair whose element does not match, without rewriting it", () => {
      const mismatched: Inputs = {
        ...umbraInputs,
        divinecraft: "fire",
        divinecraftRefinement: "deepPool",
      }
      expect(selectedIds(mismatched)).toEqual(["divinecraft:fire"])
      expect(mismatched.divinecraftRefinement).toBe("deepPool")
    })

    it("shows none for a stored refinement without an enchant", () => {
      expect(
        selectedIds({ ...umbraInputs, divinecraft: null, divinecraftRefinement: "cinderAsh" }),
      ).toEqual(["divinecraft:none"])
    })
  })

  const changedEncounter: Inputs = {
    ...umbraInputs,
    food: null,
    hpFood: "persimmonPastry",
    divinecraft: null,
    divinecraftRefinement: "cinderAsh",
    shareEasyHurt: true,
    shareDebuff5HenZhi: true,
    dummyMode: true,
    qiTarget: "herosRealm",
    combatSettings: { ...defaultCombatSettings(), dragonsBreath: true, script: "voidrotScript" },
  }

  it("copies every encounter field onto a target and nothing else", () => {
    const target: Inputs = { ...umbraInputs, breakthrough: 3, precision: 0.5 }
    expect(withEncounterFieldsOf(target, changedEncounter)).toEqual({
      ...target,
      food: null,
      hpFood: "persimmonPastry",
      divinecraft: null,
      divinecraftRefinement: "cinderAsh",
      shareEasyHurt: true,
      shareDebuff5HenZhi: true,
      dummyMode: true,
      qiTarget: "herosRealm",
      combatSettings: changedEncounter.combatSettings,
    })
  })

  it("compares encounter fields only", () => {
    expect(encounterFieldsEqual(umbraInputs, { ...umbraInputs, precision: 0.5 })).toBe(true)
    expect(encounterFieldsEqual(umbraInputs, changedEncounter)).toBe(false)
    expect(
      encounterFieldsEqual(umbraInputs, { ...umbraInputs, dummyMode: !umbraInputs.dummyMode }),
    ).toBe(false)
  })
})

describe("sortEncounterOptionsByDps", () => {
  const partyIds = ["healerBuff", "healerPanaceaFan", "breakExtension", "dragonsBreath"]
  const partyOptions = encounterOptionsOf("teammate").filter((option) =>
    partyIds.includes(option.id),
  )
  const idsOf = (options: { id: string }[]) => options.map((option) => option.id)
  const withParty = (enabled: string[]): Inputs => ({
    ...umbraInputs,
    combatSettings: {
      ...defaultCombatSettings(),
      ...Object.fromEntries(enabled.map((id) => [id, true])),
    },
  })

  it("orders toggles that are off by what turning them on adds", () => {
    const sorted = sortEncounterOptionsByDps(
      partyOptions,
      withParty([]),
      {
        baselineDps: 1000,
        dpsByOption: {
          healerBuff: 1010,
          healerPanaceaFan: 1050,
          breakExtension: 1020,
          dragonsBreath: 1005,
        },
      },
      [],
    )
    expect(idsOf(sorted)).toEqual([
      "healerPanaceaFan",
      "breakExtension",
      "healerBuff",
      "dragonsBreath",
    ])
  })

  it("orders toggles that are on by what turning them off removes", () => {
    const sorted = sortEncounterOptionsByDps(
      partyOptions,
      withParty(["healerBuff", "breakExtension"]),
      {
        baselineDps: 1000,
        dpsByOption: {
          healerBuff: 980,
          healerPanaceaFan: 1001,
          breakExtension: 990,
          dragonsBreath: 1005,
        },
      },
      [],
    )
    expect(idsOf(sorted)).toEqual([
      "healerBuff",
      "breakExtension",
      "dragonsBreath",
      "healerPanaceaFan",
    ])
  })

  it("orders choices by the DPS of the build with each one selected, the current one at baseline", () => {
    const enchants = encounterOptionsOf("divinecraft").filter((option) =>
      option.id.startsWith("divinecraft:"),
    )
    const sorted = sortEncounterOptionsByDps(
      enchants,
      { ...umbraInputs, divinecraft: "fire" },
      {
        baselineDps: 1000,
        dpsByOption: {
          "divinecraft:none": 1100,
          "divinecraft:water": 950,
          "divinecraft:poison": 900,
        },
      },
      [],
    )
    expect(idsOf(sorted)).toEqual([
      "divinecraft:none",
      "divinecraft:fire",
      "divinecraft:water",
      "divinecraft:poison",
    ])
  })

  it("orders enchants and refined items together by the DPS of each full pair", () => {
    const fireInputs: Inputs = { ...umbraInputs, divinecraft: "fire", divinecraftRefinement: null }
    const sorted = sortEncounterOptionsByDps(
      encounterOptionsOf("divinecraft"),
      fireInputs,
      {
        baselineDps: 1000,
        dpsByOption: {
          "divinecraft:none": 900,
          "divinecraftRefinement:cinderAsh": 1010,
          "divinecraftRefinement:scorchingFlame": 1000,
          "divinecraft:water": 950,
          "divinecraftRefinement:deepPool": 1020,
          "divinecraftRefinement:vastOcean": 940,
          "divinecraft:poison": 930,
          "divinecraftRefinement:vipersFire": 920,
          "divinecraftRefinement:condensedMalice": 910,
        },
      },
      [],
    )
    expect(idsOf(sorted)).toEqual([
      "divinecraftRefinement:deepPool",
      "divinecraftRefinement:cinderAsh",
      "divinecraft:fire",
      "divinecraftRefinement:scorchingFlame",
      "divinecraft:water",
      "divinecraftRefinement:vastOcean",
      "divinecraft:poison",
      "divinecraftRefinement:vipersFire",
      "divinecraftRefinement:condensedMalice",
      "divinecraft:none",
    ])
  })

  it("keeps catalogue order for ties", () => {
    const sorted = sortEncounterOptionsByDps(
      partyOptions,
      withParty([]),
      {
        baselineDps: 1000,
        dpsByOption: {
          healerBuff: 1010,
          healerPanaceaFan: 1010,
          breakExtension: 1010,
          dragonsBreath: 1010,
        },
      },
      [],
    )
    expect(idsOf(sorted)).toEqual(idsOf(partyOptions))
  })

  it("keeps the previous order while no result is available", () => {
    const previousOrder = ["dragonsBreath", "healerBuff", "breakExtension", "healerPanaceaFan"]
    expect(
      idsOf(sortEncounterOptionsByDps(partyOptions, withParty([]), null, previousOrder)),
    ).toEqual(previousOrder)
    expect(idsOf(sortEncounterOptionsByDps(partyOptions, withParty([]), null, []))).toEqual(
      idsOf(partyOptions),
    )
  })
})
