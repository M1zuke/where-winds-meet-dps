import { describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
} from "../../src/migrations/customDebuffs"
import {
  V13__mysticArtLevelCap,
  healMysticDotLevelCap,
} from "../../src/migrations/customDebuffs/V13__mysticArtLevelCap"
import { builtinDebuffsForClass } from "../../src/engine/builtinLibrary"
import type { Debuff } from "../../src/engine/debuff"
import storeV12File from "./testCustomDebuffs/v12/store.json"

const MYSTIC_DEBUFFS = [
  "debuff-mystic-combustion",
  "debuff-mystic-smolder",
  "debuff-mystic-toad-poison",
  "debuff-mystic-toad-poison-fury",
  "debuff-mystic-flute-ripple",
]
const BLEED_TICK = "debuff-bellstrikeUmbra-bleed-tick"

const STORE = storeV12File as unknown as { v: number; debuffs: Debuff[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: { debuffs: unknown[] }, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

const builtinOf = (id: string): Debuff =>
  builtinDebuffsForClass("bellstrikeUmbra").find((debuff) => debuff.id === id)!

describe("the pre-V13 shape", () => {
  it("carries all five mystic debuffs at the level-71 / 171 rows", () => {
    expect(STORE.v).toBe(V13__mysticArtLevelCap.to - 1)
    for (const id of MYSTIC_DEBUFFS) expect(debuffIn(STORE, id), id).toBeDefined()
    expect(debuffIn(STORE, "debuff-mystic-toad-poison-fury").dot!.physMultiplier).toBe(1.530103)
    expect(builtinOf("debuff-mystic-toad-poison-fury").dot!.physMultiplier).toBe(1.530217)
  })
})

describe("healMysticDotLevelCap", () => {
  it("rewrites each untouched mystic debuff onto the built-in's own row", () => {
    for (const id of MYSTIC_DEBUFFS) {
      const healed = healMysticDotLevelCap(id, clone(debuffIn(STORE, id).dot)) as Debuff["dot"]
      const builtin = builtinOf(id).dot!
      expect(healed!.physMultiplier, id).toBe(builtin.physMultiplier)
      expect(healed!.attributeMultiplier, id).toBe(builtin.attributeMultiplier)
      expect(healed!.physFixed, id).toBe(builtin.physFixed)
    }
  })

  it("leaves a copy whose coefficient was edited alone", () => {
    const edited = clone(debuffIn(STORE, "debuff-mystic-combustion").dot)!
    edited.physMultiplier = 0.5
    expect(healMysticDotLevelCap("debuff-mystic-combustion", clone(edited))).toEqual(edited)
  })

  it("leaves a debuff the migration does not target alone", () => {
    const other = clone(debuffIn(STORE, BLEED_TICK).dot)
    expect(healMysticDotLevelCap(BLEED_TICK, clone(other))).toEqual(other)
  })

  it("keeps the toad poison and its fury form apart", () => {
    const fury = clone(debuffIn(STORE, "debuff-mystic-toad-poison-fury").dot)
    const healed = healMysticDotLevelCap("debuff-mystic-toad-poison-fury", fury) as Debuff["dot"]
    expect(healed!.physMultiplier).toBe(1.530217)
  })
})

describe("V13__mysticArtLevelCap — called directly", () => {
  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V13__mysticArtLevelCap.migrate(input)
    expect(input).toEqual(snapshot)
    expect(once.v).toBe(13)
    expect(V13__mysticArtLevelCap.migrate(clone(once))).toEqual(once)
  })
})

describe("V13__mysticArtLevelCap — through the chain", () => {
  it("is registered and is exactly what the v12 → v13 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V13__mysticArtLevelCap)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 13 })!
    expect(result.applied).toEqual(["V13__mysticArtLevelCap"])
    expect(result.blob.v).toBe(13)
    for (const id of MYSTIC_DEBUFFS) {
      expect(debuffIn(result.blob, id).dot, id).toMatchObject({
        physMultiplier: builtinOf(id).dot!.physMultiplier,
        physFixed: builtinOf(id).dot!.physFixed,
      })
    }
  })

  it("removing the step from the registry leaves the pre-migration rows untouched", () => {
    const withoutStep = CUSTOM_DEBUFF_MIGRATIONS.filter((step) => step !== V13__mysticArtLevelCap)
    const result = runChain(withoutStep, 13, clone(STORE))!
    expect(debuffIn(result.blob, "debuff-mystic-combustion").dot!.physFixed).toBe(44.62)
  })
})
