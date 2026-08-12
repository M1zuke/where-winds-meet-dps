import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { gearBaseStatsFor } from "../../src/engine/gearStats"
import { getWordSpecs } from "../../src/engine/itemRanking"
import { ATTUNEMENT_OPTIONS } from "../../src/engine/attunements"
import type { Inputs } from "../../src/engine/types"
import {
  parseDashboardGearPayload,
  targetKey,
} from "../../src/ui/features/gear/import-gear-dialog/dashboardGearPayload"
import { AFFIX_ID_TO_STAT_LINE } from "../../src/ui/features/gear/import-gear-dialog/affixStatLineTable"
import {
  FALLBACK_LEVEL,
  FALLBACK_RARITY,
  effectiveIdentity,
  importablePieces,
  resolveAgainstBuild,
  toGearPieces,
  type AffixChoices,
} from "../../src/ui/features/gear/import-gear-dialog/importedGearPieces"
import fixture from "./fixtures/dashboardRoleInfo.json"

const fixtureText = JSON.stringify(fixture)
const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }

// Mirrors the ids in the fixture; the shipped table only carries what is confirmed.
const choices: AffixChoices = {
  "9793015": "word:Sword Martial Boost",
  "9793120": "word:Affinity",
  "9793005": "word:Power",
  "9793008": "word:Min Phys",
  "280701": "attunement:physPen",
  "9794014": "word:Affinity",
  "9793121": "word:All Martial Boost",
  "9794008": "word:Max Phys",
  "9794002": "word:Momentum",
  "9713004": "word:Min Bellstrike",
  "9743005": "word:Affinity",
  "280103": "attunement:bleedingDamage",
}

function resolved(text = fixtureText, withChoices: AffixChoices = choices) {
  return resolveAgainstBuild(parseDashboardGearPayload(text), inputs, withChoices)
}

function pieceFor(gameSlotId: string, withChoices: AffixChoices = choices) {
  const found = resolved(fixtureText, withChoices).pieces.find(
    (piece) => piece.gameSlotId === gameSlotId,
  )
  if (!found) throw new Error(`no piece for slot ${gameSlotId}`)
  return found
}

describe("the shipped affix table is the authority", () => {
  it("resolves an id it carries without any user choice", () => {
    const affix = pieceFor("1", {}).affixes[1]!
    expect(affix.affixId).toBe("9793119")
    expect(affix.resolution).toMatchObject({ kind: "resolved", target: { word: "Crit" } })
  })

  it("resolves the whole first weapon from the table alone", () => {
    const piece = pieceFor("1", {})
    expect(piece.affixes.map((affix) => affix.resolution.kind)).toEqual(Array(5).fill("resolved"))
    expect(piece.attunement!.resolution.kind).toBe("resolved")
  })

  it("leaves an id it does not carry unmapped", () => {
    const affix = pieceFor("2", {}).overflowAffixes[0]!
    expect(affix.affixId).toBe("9999999")
    expect(affix.resolution.kind).toBe("unmapped")
  })

  // The table spans every class, so a name is checked against the whole catalogue
  // rather than one build's slice of it — resolveAgainstBuild is what narrows an
  // entry to the active class, and the illegal-for-this-slot case covers that.
  it("names only stats that exist", () => {
    const words = new Set(getWordSpecs(inputs).map((spec) => spec.word))
    const attunements = new Set(ATTUNEMENT_OPTIONS.map((option) => option.id))
    for (const key of Object.values(AFFIX_ID_TO_STAT_LINE)) {
      const [kind, name] = [key.slice(0, key.indexOf(":")), key.slice(key.indexOf(":") + 1)]
      if (kind === "word") expect(words.has(name) || name.endsWith(" Martial Boost")).toBe(true)
      else expect(attunements.has(name), name).toBe(true)
    }
  })

  it("keeps each id on the side of the namespace its digits put it on", () => {
    for (const [affixId, key] of Object.entries(AFFIX_ID_TO_STAT_LINE)) {
      const isAttunementId = Number(affixId) < 1_000_000
      expect(key.startsWith("attunement:")).toBe(isAttunementId)
    }
  })
})

describe("suggestions from the reported max roll", () => {
  it("offers every stat sharing the affix's ceiling", () => {
    const affix = pieceFor("1", {}).affixes[3]!
    expect(affix.derivedMax).toBeCloseTo(49.4, 6)
    const suggested = affix.resolution.suggestions.map(targetKey)
    expect(suggested).toEqual(
      expect.arrayContaining(["word:Power", "word:Agility", "word:Momentum"]),
    )
  })

  it("offers every legal stat as choosable, not just the suggestions", () => {
    const affix = pieceFor("1", {}).affixes[3]!
    expect(affix.resolution.choosableTargets.length).toBeGreaterThan(
      affix.resolution.suggestions.length,
    )
  })

  it("offers attunements for an attunement affix", () => {
    const affix = pieceFor("1", {}).attunement!
    expect(affix.resolution.suggestions.map(targetKey)).toContain("attunement:physPen")
  })

  it("never offers a word for an attunement row, nor an attunement for a tunement row", () => {
    const attunement = pieceFor("1", {}).attunement!
    expect(
      attunement.resolution.choosableTargets.every((target) => target.kind === "attunement"),
    ).toBe(true)

    const tunement = pieceFor("1", {}).affixes[3]!
    expect(tunement.resolution.choosableTargets.every((target) => target.kind === "word")).toBe(
      true,
    )
  })

  it("refuses a word mapped onto an attunement row instead of dropping the line", () => {
    const crossed: AffixChoices = { "280701": "word:Physical Penetration" }
    expect(pieceFor("1", crossed).attunement!.resolution).toMatchObject({
      kind: "unmapped",
      mappedTo: "word:Physical Penetration",
    })
  })
})

describe("a user choice maps an id", () => {
  it("resolves a chosen word and keeps the payload value", () => {
    expect(pieceFor("1").affixes[3]!.resolution).toMatchObject({
      kind: "resolved",
      target: { word: "Power" },
      value: 45.569,
      clampedFrom: null,
    })
  })

  it("keeps a percent word as a fraction", () => {
    expect(pieceFor("1").affixes[2]!.resolution).toMatchObject({
      kind: "resolved",
      value: 0.044,
    })
  })

  it("scales an attunement reported in percent into a fraction", () => {
    expect(pieceFor("1").attunement!.resolution).toMatchObject({
      kind: "resolved",
      target: { attunementId: "physPen" },
      value: 0.107,
    })
  })

  it("leaves an attunement already reported as a fraction unscaled", () => {
    expect(pieceFor("3").attunement!.resolution).toMatchObject({
      kind: "resolved",
      target: { attunementId: "bleedingDamage" },
      value: 0.059,
    })
  })

  it("clamps above the cap and records what it was", () => {
    const cap = getWordSpecs(inputs).find((spec) => spec.word === "Crit")!.amount
    const text = JSON.stringify({
      wearEquipsDetailed: {
        "1": {
          exVo: { baseAffixes: [{ equipmentDetails: [9793119, 0.5, 5.555555555555555, 3, true] }] },
        },
      },
    })
    expect(resolved(text).pieces[0]!.affixes[0]!.resolution).toMatchObject({
      kind: "resolved",
      value: cap,
      clampedFrom: 0.5,
    })
  })

  it("keeps full precision below the cap — no rounding", () => {
    const text = JSON.stringify({
      wearEquipsDetailed: {
        "1": {
          exVo: {
            baseAffixes: [{ equipmentDetails: [9793119, 0.0873421, 0.9704677777777778, 3, true] }],
          },
        },
      },
    })
    expect(resolved(text).pieces[0]!.affixes[0]!.resolution).toMatchObject({
      value: 0.0873421,
      clampedFrom: null,
    })
  })

  it("refuses a choice that is illegal for the resolved slot", () => {
    const armorOnly: AffixChoices = { "280701": "attunement:bleedingDamage" }
    expect(pieceFor("1", armorOnly).attunement!.resolution).toMatchObject({
      kind: "unmapped",
      mappedTo: "attunement:bleedingDamage",
    })
  })
})

describe("level and rarity inference", () => {
  it("reads a legendary weapon from its attack range", () => {
    expect(pieceFor("1").identity).toMatchObject({ level: 96, rarity: "legendary" })
  })

  it("reads an epic weapon from its attack range", () => {
    expect(pieceFor("2").identity).toMatchObject({ level: 96, rarity: "epic" })
  })

  it("reads armor level and rarity from its hp and defense", () => {
    const armor = pieceFor("3")
    expect(armor.identity).toMatchObject({ level: 96, rarity: "legendary" })
    expect(effectiveIdentity(armor, resolved().pieces, {})).toEqual({
      level: 96,
      rarity: "legendary",
    })
  })

  it("falls back when nothing can be inferred", () => {
    const text = JSON.stringify({ wearEquipsDetailed: { "3": { exVo: { baseAffixes: [] } } } })
    const result = resolved(text)
    expect(effectiveIdentity(result.pieces[0]!, result.pieces, {})).toEqual({
      level: FALLBACK_LEVEL,
      rarity: FALLBACK_RARITY,
    })
  })

  it("lets an override win over inference", () => {
    const result = resolved()
    const weapon = result.pieces.find((piece) => piece.gameSlotId === "1")!
    expect(
      effectiveIdentity(weapon, result.pieces, { "1": { level: 91, rarity: "epic" } }),
    ).toEqual({ level: 91, rarity: "epic" })
  })
})

describe("toGearPieces", () => {
  it("imports only the slots that map", () => {
    const result = resolved()
    expect(importablePieces(result)).toHaveLength(3)
    expect(toGearPieces(result, {}).map((piece) => piece.slot)).toEqual([
      "leftWeapon",
      "rightWeapon",
      "helm",
    ])
  })

  it("always writes five word rows and never marks a piece relayed", () => {
    for (const piece of toGearPieces(resolved(), {})) {
      expect(piece.words).toHaveLength(5)
      expect(piece.relayed).toBe(false)
      expect(piece.isNew).toBe(true)
    }
  })

  it("mints a unique id per piece", () => {
    const ids = toGearPieces(resolved(), {}).map((piece) => piece.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("derives base stats from the table, never from the payload", () => {
    for (const piece of toGearPieces(resolved(), {})) {
      expect(piece).toMatchObject(gearBaseStatsFor(piece))
    }
  })

  it("pads unmapped rows in place, preserving payload order", () => {
    const helm = toGearPieces(resolved(), {}).find((piece) => piece.slot === "helm")!
    expect(helm.words[0]).toEqual({ word: "Affinity", value: 0.03996, retuned: false })
    expect(helm.words.slice(1)).toEqual(Array(4).fill({ word: "", value: 0, retuned: false }))
  })

  it("writes the attunement only when it resolved", () => {
    const weapon = toGearPieces(resolved(), {}).find((piece) => piece.slot === "leftWeapon")!
    expect(weapon.attunement).toBe("physPen")
    expect(weapon.attunementValue).toBeCloseTo(0.107, 10)

    const unknownSuffix = JSON.stringify({
      wearEquipsDetailed: {
        "1": { exVo: { baseAffixes: [{ equipmentDetails: [280999, 10.7, 0.97, 3, true] }] } },
      },
    })
    const unmapped = toGearPieces(resolved(unknownSuffix, {}), {})[0]!
    expect(unmapped.attunement).toBe("")
    expect(unmapped.attunementValue).toBe(0)
  })
})
