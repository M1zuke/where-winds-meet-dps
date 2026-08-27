import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearSlot, Inputs } from "../../src/engine/types"
import { relayedCapValue } from "../../src/engine/gearStats"
import { parseGearScreenshot } from "../../src/ui/features/gear/screenshot-gear-dialog/ocrGearPiece"

const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
const FALLBACK_SLOT: GearSlot = "leftWeapon"

const TRANSCRIPT_A = `
Mirage Sentinel
Relaying · Tier 96
Max Physical Attack +73.1
Momentum +45.9
Affinity Rate +4.1%
Power +46.4
[Turn]Max Physical Attack +73.1
Physical Penetration +10.7
`

const TRANSCRIPT_B = `
Mirage Veilbright
Relaying · Tier 96
Max Formless Attack +41.3
Max Formless Attack +41.2
Art of Sword DMG Boost +5.8%
[Turn]Max Physical Attack +73.1
Momentum +45.6
Physical Penetration +10.7
`

const TRANSCRIPT_C = `
Nightfarer Greaves
Relaying · Tier 96
Power +44.6
Max Physical Attack +73.1
Combat Boost Against Boss
Units +3.0%
[Turn]Affinity Rate +4.1%
Power +46.4
Strategic Sword - Bleeding DMG
Boost +5.8%
`

describe("parseGearScreenshot", () => {
  it("reads transcript A into five words, a retuned fifth, and the attunement", () => {
    const { piece, error } = parseGearScreenshot(TRANSCRIPT_A, inputs, FALLBACK_SLOT)

    expect(error).toBeNull()
    expect(piece.label).toBe("Mirage Sentinel")
    expect(piece.level).toBe(96)
    expect(piece.relayed).toBe(true)
    expect(piece.words).toEqual([
      { word: "maxPhys", value: 73.1, retuned: false },
      { word: "momentum", value: 45.9, retuned: false },
      { word: "affinity", value: 0.041, retuned: false },
      { word: "power", value: 46.4, retuned: false },
      { word: "maxPhys", value: 73.1, retuned: true },
    ])
    expect(piece.attunement).toBe("physPen")
    expect(piece.attunementValue).toBe(0.107)
  })

  it("stores a percent row as a fraction, not a percent number", () => {
    const { piece } = parseGearScreenshot(TRANSCRIPT_A, inputs, FALLBACK_SLOT)

    expect(piece.words[2]).toEqual({ word: "affinity", value: 0.041, retuned: false })
  })

  it("stores a raw row exactly as written", () => {
    const { piece } = parseGearScreenshot(TRANSCRIPT_A, inputs, FALLBACK_SLOT)

    expect(piece.words[0]).toEqual({ word: "maxPhys", value: 73.1, retuned: false })
  })

  it("resolves the sixth row to the attunement, not a sixth word, even though the label also names a gear word", () => {
    const { piece } = parseGearScreenshot(TRANSCRIPT_A, inputs, FALLBACK_SLOT)

    expect(piece.attunement).toBe("physPen")
    expect(piece.words.some((word) => word.word === "physicalPenetration")).toBe(false)
  })

  it("scales the attunement's percent-point value into the option's range", () => {
    const { piece } = parseGearScreenshot(TRANSCRIPT_A, inputs, FALLBACK_SLOT)

    expect(piece.attunementValue).toBe(0.107)
  })

  it("sets retuned from a bracketed prefix without the bracket leaking into the matched name", () => {
    const { piece } = parseGearScreenshot(TRANSCRIPT_A, inputs, FALLBACK_SLOT)

    expect(piece.words[4]).toEqual({ word: "maxPhys", value: 73.1, retuned: true })
  })

  it("rejoins a wrapped stat name before matching", () => {
    const { piece } = parseGearScreenshot(TRANSCRIPT_C, inputs, FALLBACK_SLOT)

    expect(piece.words.some((word) => word.word === "damageVsBoss" && word.value === 0.03)).toBe(
      true,
    )
  })

  it("rejoins a wrapped attunement name too", () => {
    const { piece } = parseGearScreenshot(TRANSCRIPT_C, inputs, FALLBACK_SLOT)

    expect(piece.attunement).toBe("bleedingDamage")
    expect(piece.attunementValue).toBe(0.058)
  })

  it("reads the slot from the title where the title names one, and falls back otherwise", () => {
    const fromTitle = parseGearScreenshot(TRANSCRIPT_C, inputs, FALLBACK_SLOT)
    const fallbackA = parseGearScreenshot(TRANSCRIPT_A, inputs, FALLBACK_SLOT)
    const fallbackB = parseGearScreenshot(TRANSCRIPT_B, inputs, FALLBACK_SLOT)

    expect(fromTitle.piece.slot).toBe("greaves")
    expect(fromTitle.fields.slot).toBe("read")
    expect(fallbackA.piece.slot).toBe(FALLBACK_SLOT)
    expect(fallbackA.fields.slot).toBe("guessed")
    expect(fallbackB.piece.slot).toBe(FALLBACK_SLOT)
  })

  it("keeps duplicate words, each with its own value", () => {
    const { piece } = parseGearScreenshot(TRANSCRIPT_B, inputs, FALLBACK_SLOT)

    expect(piece.words[0]).toEqual({ word: "maxVoidAttack", value: 41.3, retuned: false })
    expect(piece.words[1]).toEqual({ word: "maxVoidAttack", value: 41.2, retuned: false })
  })

  it("leaves an unreadable stat name unresolved and names the row in the report, never resolving to the nearest label", () => {
    const transcript = `
Mystery Piece
Relaying · Tier 96
Zzqxxq Nonsense +12.3
Momentum +45.9
Affinity Rate +4.1%
Power +46.4
Power +46.4
Physical Penetration +10.7
`
    const { piece, fields } = parseGearScreenshot(transcript, inputs, FALLBACK_SLOT)

    expect(piece.words[0].word).toBe("")
    expect(fields.words[0]).toEqual({ confidence: "unresolved", rawText: "Zzqxxq Nonsense +12.3" })
  })

  it("clamps a value above the relayed ceiling to the relayed cap", () => {
    const transcript = `
Clamp Test
Relaying · Tier 96
Power +99.9
`
    const { piece } = parseGearScreenshot(transcript, inputs, FALLBACK_SLOT)

    expect(piece.words[0]).toEqual({
      word: "power",
      value: relayedCapValue(49.4, "raw"),
      retuned: false,
    })
  })

  it("falls back to level 96 for a tier the model does not have", () => {
    const transcript = `
Tier Test
Tier 80
Power +40.0
`
    const { piece, fields } = parseGearScreenshot(transcript, inputs, FALLBACK_SLOT)

    expect(piece.level).toBe(96)
    expect(fields.level).toBe("guessed")
  })

  it("reads relayed as false and clamps against the un-relayed cap when Relaying is absent", () => {
    const transcript = `
No Relay Test
Tier 96
Power +99.9
`
    const { piece } = parseGearScreenshot(transcript, inputs, FALLBACK_SLOT)

    expect(piece.relayed).toBe(false)
    expect(piece.words[0]).toEqual({ word: "power", value: 49.4, retuned: false })
  })

  it("returns an empty draft and an error for empty or garbage input, never throwing", () => {
    const empty = parseGearScreenshot("", inputs, FALLBACK_SLOT)
    const whitespace = parseGearScreenshot("   \n   \n", inputs, FALLBACK_SLOT)
    const garbage = parseGearScreenshot("asdkfjh alskdjf", inputs, FALLBACK_SLOT)

    for (const result of [empty, whitespace, garbage]) {
      expect(result.error).not.toBeNull()
      expect(result.piece.words.every((word) => word.word === "")).toBe(true)
      expect(result.piece.attunement).toBe("")
    }
  })
})
