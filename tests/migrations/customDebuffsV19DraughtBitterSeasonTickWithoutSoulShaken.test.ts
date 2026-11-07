import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import { V19__draughtBitterSeasonTickWithoutSoulShaken } from "../../src/migrations/customDebuffs/V19__draughtBitterSeasonTickWithoutSoulShaken"
import { DEBUFFS } from "../../src/data/skills/bamboocut-draught/debuffs"
import type { Debuff } from "../../src/engine/debuff"
import storeV18File from "./testCustomDebuffs/v18/store.json"

const STORE = storeV18File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }
const DRAUGHT_TICK_ID = "debuff-bamboocutDraught-bitter-season-tick"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

const builtinTick = DEBUFFS.find((debuff) => debuff.id === DRAUGHT_TICK_ID)!

describe("custom-debuffs v18 fixture", () => {
  it("is v18 and stores Draught's Bitter Season tick receiving Soul-Shaken", () => {
    expect(STORE.v).toBe(V19__draughtBitterSeasonTickWithoutSoulShaken.to - 1)
    expect(debuffIn(STORE, DRAUGHT_TICK_ID).receives).toEqual(["soulShaken"])
  })
})

describe("V19__draughtBitterSeasonTickWithoutSoulShaken — called directly", () => {
  it("lands an untouched copy on the live debuff's receives", () => {
    const after = V19__draughtBitterSeasonTickWithoutSoulShaken.migrate(clone(STORE))
    expect(after.v).toBe(19)
    expect(debuffIn(after, DRAUGHT_TICK_ID).receives).toEqual(builtinTick.receives)
  })

  it("keeps a list the copy was edited to and every other debuff", () => {
    const edited = clone(STORE)
    debuffIn(edited, DRAUGHT_TICK_ID).receives = ["soulShaken", "namelessSwordAdditionalAttack"]
    const after = V19__draughtBitterSeasonTickWithoutSoulShaken.migrate(edited)
    expect(debuffIn(after, DRAUGHT_TICK_ID).receives).toEqual([
      "soulShaken",
      "namelessSwordAdditionalAttack",
    ])
    for (const debuff of STORE.debuffs) {
      if (debuff.id === DRAUGHT_TICK_ID) continue
      expect(debuffIn(after, debuff.id), debuff.id).toEqual(debuff)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V19__draughtBitterSeasonTickWithoutSoulShaken.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V19__draughtBitterSeasonTickWithoutSoulShaken.migrate(clone(once))).toEqual(once)
  })
})

describe("V19__draughtBitterSeasonTickWithoutSoulShaken — through the chain", () => {
  it("is registered and is exactly what the v18 → v19 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V19__draughtBitterSeasonTickWithoutSoulShaken)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 19 })!
    expect(result.applied).toEqual(["V19__draughtBitterSeasonTickWithoutSoulShaken"])
    expect(result.blob.v).toBe(19)
  })
})
