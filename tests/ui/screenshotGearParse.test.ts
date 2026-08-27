import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { GearSlot, Inputs } from "../../src/engine/types"
import { ATTUNEMENT_OPTIONS } from "../../src/engine/attunements"
import { parseGearScreenshot } from "../../src/ui/features/gear/screenshot-ocr/ocrGearPiece"

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

  it('reads a plural gear-slot title word ("Bracers") against the singular slot id', () => {
    const transcript = `
Nightfarer Bracers
Relaying · Tier 96
Power +46.4
`
    const { piece, fields } = parseGearScreenshot(transcript, inputs, FALLBACK_SLOT)

    expect(piece.slot).toBe("bracer")
    expect(fields.slot).toBe("read")
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

  it("keeps a value above the relayed ceiling instead of clamping it, and flags the row", () => {
    const transcript = `
Clamp Test
Relaying · Tier 96
Power +99.9
`
    const { piece, fields } = parseGearScreenshot(transcript, inputs, FALLBACK_SLOT)

    expect(piece.words[0]).toEqual({ word: "power", value: 99.9, retuned: false })
    expect(fields.words[0].confidence).toBe("guessed")
  })

  it("keeps a value above the relayed ceiling instead of clamping it, deducing the piece is not relayed", () => {
    const transcript = `
Deduction Test
Relaying · Tier 96
Max Physical Attack +77.7
`
    const { piece, fields } = parseGearScreenshot(transcript, inputs, FALLBACK_SLOT)

    expect(piece.relayed).toBe(false)
    expect(fields.relayed).toBe("read")
    expect(piece.words[0]).toEqual({ word: "maxPhys", value: 77.7, retuned: false })
    expect(fields.words[0].confidence).toBe("read")
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

  it("reads relayed as false when Relaying is absent, and still keeps an out-of-cap value unclamped", () => {
    const transcript = `
No Relay Test
Tier 96
Power +99.9
`
    const { piece, fields } = parseGearScreenshot(transcript, inputs, FALLBACK_SLOT)

    expect(piece.relayed).toBe(false)
    expect(piece.words[0]).toEqual({ word: "power", value: 99.9, retuned: false })
    expect(fields.words[0].confidence).toBe("guessed")
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

  it("treats a bracketed prefix as the retune flag even when the bracket shape is misread", () => {
    const variants = [
      "[Turn]Max Physical Attack +73.1",
      "(Turn)Max Physical Attack +73.1",
      "{Turn}Max Physical Attack +73.1",
      "i [Turn]Max Physical Attack +73.1",
      "[Turn Max Physical Attack +73.1",
    ]

    for (const statLine of variants) {
      const transcript = `
Mirage Sentinel
Relaying · Tier 96
${statLine}
`
      const { piece } = parseGearScreenshot(transcript, inputs, FALLBACK_SLOT)

      expect(piece.words[0]).toEqual({ word: "maxPhys", value: 73.1, retuned: true })
    }
  })

  it("does not mistake an opening bracket ahead of the real stat name for a retune tag", () => {
    const transcript = `
Mirage Veilbright
Relaying · Tier 96
[ Max Formless Attack +41.3
`
    const { piece } = parseGearScreenshot(transcript, inputs, FALLBACK_SLOT)

    expect(piece.words[0]).toEqual({ word: "maxVoidAttack", value: 41.3, retuned: false })
  })

  it("treats an attunement row with no numeric value as an unrolled attunement, not a failure", () => {
    const transcript = `
Mirage Veilbright
Relaying · Tier 96
Max Physical Attack +59.8
Affinity Rate +4.4%
Critical Rate +8.4%
Power +46.9
Randomly unlocks one Universal Attuning Affix.
`
    const { piece, fields } = parseGearScreenshot(transcript, inputs, FALLBACK_SLOT)

    expect(piece.attunement).toBe("")
    expect(piece.attunementValue).toBe(0)
    expect(fields.attunement.confidence).toBe("read")
    expect(fields.attunement.rawText).toContain("Randomly unlocks")
  })
})

describe("parseGearScreenshot against real OCR transcripts", () => {
  const REAL_MIRAGE_SENTINEL = `
l Mirage Sentinel
I Relaying - Tier
Max Physical Attack +7 3.1
Momentum +45.9
Affinity Rate +4.1% -
Power +46.4 oo
[Turn]Max Physical Attack +7 3.1 om
Physical Penetration +170.7
`

  const REAL_MIRAGE_VEILBRIGHT = `
l Mirage Veilbright
[
Max Formless Attack +417.3
Max Formless Attack +417.2
Art of Sword DMC Boost +5.8%
[Turn]Max Physical Attack +7 3.1
Momentum +45.6
Physical Penetration +10.7
`

  const REAL_MIRAGE_VEILBRIGHT_UNATTUNED = `
Mirage Veilbright
VJ Max Physical Attack +59.8
&
Affinity Rate +4.4%
&
fp Max Physical Attack +77.7
4]
fu] Critical Rate +8.4%
&
0 Power +46.9 or
Randomly unlocks one Universal pt Be a SET
he Attuning Affix.
`

  const REAL_NIGHTFARER_GREAVES = `
l Nightfarer Greaves
Relaying - Tier
Power +44.6
Max Physical Attack +7 3.1
Combat Boost Against Boss
Units +3.0%
[Turn]Affinity Rate +4.1%
Power +46.4
Strategic Sword - Bleeding DMG
Boost +5.8%
`

  const REAL_NIGHTFARER_BRACERS = `
l Nightfarer Bracers
I Relaying - Tier
Power +46.4
Critical Rate +8.2%
Max Physical Attack +7 3.1
[Turn]Momentum +46.4
Power +46.4
Strategic Sword - Bleeding DMG
Boost +5.8% epic
`

  it("reads the title, four clean word rows, and the retuned fifth from mirageSentinel.png", () => {
    const { piece, error } = parseGearScreenshot(REAL_MIRAGE_SENTINEL, inputs, FALLBACK_SLOT)

    expect(error).toBeNull()
    expect(piece.words[0]).toEqual({ word: "maxPhys", value: 73.1, retuned: false })
    expect(piece.words[1]).toEqual({ word: "momentum", value: 45.9, retuned: false })
    expect(piece.words[2]).toEqual({ word: "affinity", value: 0.041, retuned: false })
    expect(piece.words[3]).toEqual({ word: "power", value: 46.4, retuned: false })
    expect(piece.words[4]).toEqual({ word: "maxPhys", value: 73.1, retuned: true })
  })

  it("flags a misread attunement value above its cap instead of clamping it, on mirageSentinel.png", () => {
    const { piece, fields } = parseGearScreenshot(REAL_MIRAGE_SENTINEL, inputs, FALLBACK_SLOT)

    expect(piece.attunement).toBe("physPen")
    expect(piece.attunementValue).toBe(170.7)
    expect(fields.attunement.confidence).toBe("guessed")
  })

  it("resolves the attunement even when the slot guess is wrong", () => {
    const wrongSlot = parseGearScreenshot(REAL_MIRAGE_SENTINEL, inputs, "helm")
    const rightSlot = parseGearScreenshot(REAL_MIRAGE_SENTINEL, inputs, FALLBACK_SLOT)

    expect(wrongSlot.piece.attunement).toBe("physPen")
    expect(wrongSlot.piece.attunementValue).toBe(rightSlot.piece.attunementValue)
    expect(wrongSlot.fields.attunement.confidence).toBe(rightSlot.fields.attunement.confidence)
  })

  it("takes the slot family from the attunement when the title names no slot", () => {
    const { piece, fields } = parseGearScreenshot(REAL_MIRAGE_SENTINEL, inputs, "helm")

    const physPen = ATTUNEMENT_OPTIONS.find((option) => option.id === "physPen")!
    expect(physPen.slots).toContain(piece.slot)
    expect(fields.slot).toBe("read")
  })

  it("keeps the title's named slot over the attunement's slot family, on nightfarerGreaves.png", () => {
    const { piece } = parseGearScreenshot(REAL_NIGHTFARER_GREAVES, inputs, FALLBACK_SLOT)

    expect(piece.slot).toBe("greaves")
  })

  it("reports an attunement that belongs to another class instead of dropping it", () => {
    const otherClassInputs: Inputs = { ...defaultInputs, classId: "silkbindJade" }
    const { piece, fields, diagnostics } = parseGearScreenshot(
      REAL_NIGHTFARER_GREAVES,
      otherClassInputs,
      FALLBACK_SLOT,
    )

    expect(piece.attunement).toBe("")
    expect(piece.attunementValue).toBe(0)
    expect(fields.attunement.confidence).not.toBe("read")
    const attunementDiagnostic = diagnostics.rows.find((row) => row.slot === "attunement")!
    expect(attunementDiagnostic.resolvedTo).toBe("bleedingDamage")
    expect(attunementDiagnostic.legalForClass).toBe(false)
  })

  it("flags two misread values above their word's cap instead of clamping them, on mirageVeilbright.png", () => {
    const { piece, fields } = parseGearScreenshot(REAL_MIRAGE_VEILBRIGHT, inputs, FALLBACK_SLOT)

    expect(piece.words[0]).toEqual({ word: "maxVoidAttack", value: 417.3, retuned: false })
    expect(piece.words[1]).toEqual({ word: "maxVoidAttack", value: 417.2, retuned: false })
    expect(fields.words[0].confidence).toBe("guessed")
    expect(fields.words[1].confidence).toBe("guessed")
  })

  it("resolves the sword boost word, the retuned fifth, and the attunement from mirageVeilbright.png", () => {
    const { piece, fields } = parseGearScreenshot(REAL_MIRAGE_VEILBRIGHT, inputs, FALLBACK_SLOT)

    expect(piece.words[2]).toEqual({ word: "swordBoost", value: 0.058, retuned: false })
    expect(piece.words[3]).toEqual({ word: "maxPhys", value: 73.1, retuned: true })
    expect(piece.attunement).toBe("physPen")
    expect(piece.attunementValue).toBe(0.107)
    expect(fields.attunement.confidence).toBe("read")
  })

  it("reads every legal, un-relayed word without flagging any of them, on mirageVeilbrightUnattuned.png", () => {
    const { piece } = parseGearScreenshot(REAL_MIRAGE_VEILBRIGHT_UNATTUNED, inputs, FALLBACK_SLOT)

    expect(piece.words).toEqual([
      { word: "maxPhys", value: 59.8, retuned: false },
      { word: "affinity", value: 0.044, retuned: false },
      { word: "maxPhys", value: 77.7, retuned: false },
      { word: "crit", value: 0.084, retuned: false },
      { word: "power", value: 46.9, retuned: false },
    ])
  })

  it("reports the unattuned piece's attunement as unrolled, not unresolved, on mirageVeilbrightUnattuned.png", () => {
    const { piece, fields } = parseGearScreenshot(
      REAL_MIRAGE_VEILBRIGHT_UNATTUNED,
      inputs,
      FALLBACK_SLOT,
    )

    expect(piece.attunement).toBe("")
    expect(fields.attunement.confidence).toBe("read")
  })

  it("resolves the slot, both wrapped rows, and the attunement from nightfarerGreaves.png", () => {
    const { piece } = parseGearScreenshot(REAL_NIGHTFARER_GREAVES, inputs, FALLBACK_SLOT)

    expect(piece.slot).toBe("greaves")
    expect(piece.words).toEqual([
      { word: "power", value: 44.6, retuned: false },
      { word: "maxPhys", value: 73.1, retuned: false },
      { word: "damageVsBoss", value: 0.03, retuned: false },
      { word: "affinity", value: 0.041, retuned: true },
      { word: "power", value: 46.4, retuned: false },
    ])
    expect(piece.attunement).toBe("bleedingDamage")
    expect(piece.attunementValue).toBe(0.058)
  })

  it("reads all six rows and the plural-title slot from nightfarerBracers.png, the sample that used to lose half its rows", () => {
    const { piece, fields } = parseGearScreenshot(REAL_NIGHTFARER_BRACERS, inputs, FALLBACK_SLOT)

    expect(piece.slot).toBe("bracer")
    expect(piece.words).toEqual([
      { word: "power", value: 46.4, retuned: false },
      { word: "crit", value: 0.082, retuned: false },
      { word: "maxPhys", value: 73.1, retuned: false },
      { word: "momentum", value: 46.4, retuned: true },
      { word: "power", value: 46.4, retuned: false },
    ])
    expect(fields.words.every((word) => word.confidence === "read")).toBe(true)
  })

  it("never throws on any of the five real transcripts", () => {
    for (const transcript of [
      REAL_MIRAGE_SENTINEL,
      REAL_MIRAGE_VEILBRIGHT,
      REAL_MIRAGE_VEILBRIGHT_UNATTUNED,
      REAL_NIGHTFARER_GREAVES,
      REAL_NIGHTFARER_BRACERS,
    ]) {
      expect(() => parseGearScreenshot(transcript, inputs, FALLBACK_SLOT)).not.toThrow()
    }
  })

  it("fills only the rows it read and leaves the rest of the five editable, when only three real rows survive", () => {
    const partial = `
l Nightfarer Bracers
I Relaying - Tier
Power +46.4
Critical Rate +8.2%
Max Physical Attack +7 3.1
`
    const { piece, fields } = parseGearScreenshot(partial, inputs, FALLBACK_SLOT)

    expect(piece.words).toHaveLength(5)
    expect(fields.words).toHaveLength(5)
    expect(piece.words[0]!.word).toBe("power")
    expect(piece.words[1]!.word).toBe("crit")
    expect(piece.words[2]!.word).toBe("maxPhys")
    expect(piece.words[3]).toEqual({ word: "", value: 0, retuned: false })
    expect(piece.words[4]).toEqual({ word: "", value: 0, retuned: false })
    expect(fields.words[3].confidence).toBe("unresolved")
    expect(fields.words[4].confidence).toBe("unresolved")
  })

  it("keeps five word slots when no row is recognised", () => {
    const { piece, fields } = parseGearScreenshot("asdkfjh alskdjf", inputs, FALLBACK_SLOT)

    expect(piece.words).toHaveLength(5)
    expect(fields.words).toHaveLength(5)
    expect(piece.words.every((word) => word.word === "")).toBe(true)
  })
})
