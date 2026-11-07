import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import { V17__splendorBitterSeasonTickWithoutSoulShaken } from "../../src/migrations/customDebuffs/V17__splendorBitterSeasonTickWithoutSoulShaken"
import { DEBUFFS } from "../../src/data/skills/bellstrike-splendor/debuffs"
import type { Debuff } from "../../src/engine/debuff"
import storeV16File from "./testCustomDebuffs/v16/store.json"

const STORE = storeV16File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }
const SPLENDOR_TICK_ID = "debuff-bellstrikeSplendor-bitter-season-tick"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

describe("custom-debuffs v16 fixture", () => {
  it("is v16 and stores Splendor's Bitter Season tick receiving Soul-Shaken", () => {
    expect(STORE.v).toBe(V17__splendorBitterSeasonTickWithoutSoulShaken.to - 1)
    expect(debuffIn(STORE, SPLENDOR_TICK_ID).receives).toEqual(["soulShaken"])
  })
})

describe("V17__splendorBitterSeasonTickWithoutSoulShaken — called directly", () => {
  it("lands an untouched copy on the live debuff's receives", () => {
    const after = V17__splendorBitterSeasonTickWithoutSoulShaken.migrate(clone(STORE))
    expect(after.v).toBe(17)
    expect(debuffIn(after, SPLENDOR_TICK_ID).receives).toEqual(DEBUFFS[0]!.receives)
  })

  it("keeps a list the copy was edited to and every other debuff", () => {
    const edited = clone(STORE)
    debuffIn(edited, SPLENDOR_TICK_ID).receives = ["soulShaken", "namelessSwordAdditionalAttack"]
    const after = V17__splendorBitterSeasonTickWithoutSoulShaken.migrate(edited)
    expect(debuffIn(after, SPLENDOR_TICK_ID).receives).toEqual([
      "soulShaken",
      "namelessSwordAdditionalAttack",
    ])
    for (const debuff of STORE.debuffs) {
      if (debuff.id === SPLENDOR_TICK_ID) continue
      expect(debuffIn(after, debuff.id), debuff.id).toEqual(debuff)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V17__splendorBitterSeasonTickWithoutSoulShaken.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V17__splendorBitterSeasonTickWithoutSoulShaken.migrate(clone(once))).toEqual(once)
  })
})

describe("V17__splendorBitterSeasonTickWithoutSoulShaken — through the chain", () => {
  it("is registered and is exactly what the v16 → v17 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V17__splendorBitterSeasonTickWithoutSoulShaken)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 17 })!
    expect(result.applied).toEqual(["V17__splendorBitterSeasonTickWithoutSoulShaken"])
    expect(result.blob.v).toBe(17)
  })
})
