import { beforeEach, describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  LATEST_CUSTOM_DEBUFFS_VERSION,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V5__mysticArtRankRepair,
  healMysticDotRank,
} from "../../src/migrations/customDebuffs/V5__mysticArtRankRepair"
import { loadCustomDebuffs } from "../../src/storage"
import type { Debuff } from "../../src/engine/debuff"
import storeV4File from "./testCustomDebuffs/v4/store.json"

const TOAD_POISON = "debuff-bellstrikeUmbra-toad-poison"
const FLUTE_RIPPLE = "debuff-stonesplitStrength-flute-ripple"
const SPLENDOR_DARK_FIRE = "debuff-bellstrikeSplendor-dark-fire"
const UMBRA_DARK_FIRE = "debuff-bellstrikeUmbra-dark-fire"
const USER_AUTHORED = "db-user-authored-fire"
const DEBUFFS_KEY = "wwm.customDebuffs"
const STORE = storeV4File as unknown as { v: number; debuffs: Debuff[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: { debuffs: unknown[] }, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

describe("custom-debuffs v4 fixture", () => {
  it("is v4 and still stores mystic-art DoTs at a rank below the current one", () => {
    expect(STORE.v).toBe(V5__mysticArtRankRepair.to - 1)
    expect(debuffIn(STORE, TOAD_POISON).dot!.physMultiplier).toBe(1.6216)
    expect(debuffIn(STORE, FLUTE_RIPPLE).dot!.physMultiplier).toBe(1.4696)
    expect(debuffIn(STORE, SPLENDOR_DARK_FIRE).dot!.physMultiplier).toBe(0.236)
  })

  it("already carries Bellstrike Umbra's Smolder tick at the current rank", () => {
    expect(debuffIn(STORE, UMBRA_DARK_FIRE).dot!.physMultiplier).toBe(0.24991)
  })
})

describe("healMysticDotRank", () => {
  it("rewrites an untouched Toad Poison tick to the current rank", () => {
    const healed = healMysticDotRank(TOAD_POISON, clone(debuffIn(STORE, TOAD_POISON).dot))
    expect(healed).toEqual({
      ...clone(debuffIn(STORE, TOAD_POISON).dot),
      physMultiplier: 1.62189,
      attributeMultiplier: 1.62189,
      physFixed: 243.7,
    })
  })

  it("rewrites Flute Ripple regardless of which stale rank a class copy started from", () => {
    const healed = healMysticDotRank(FLUTE_RIPPLE, clone(debuffIn(STORE, FLUTE_RIPPLE).dot))
    expect(healed).toEqual({
      ...clone(debuffIn(STORE, FLUTE_RIPPLE).dot),
      physMultiplier: 1.47645,
      attributeMultiplier: 2.214675,
      physFixed: 320.97,
    })
  })

  it("rewrites Bellstrike Splendor's stale Smolder tick", () => {
    const healed = healMysticDotRank(
      SPLENDOR_DARK_FIRE,
      clone(debuffIn(STORE, SPLENDOR_DARK_FIRE).dot),
    )
    expect(healed).toEqual({
      ...clone(debuffIn(STORE, SPLENDOR_DARK_FIRE).dot),
      physMultiplier: 0.24991,
      attributeMultiplier: 0.374865,
      physFixed: 37.74,
    })
  })

  it("leaves Bellstrike Umbra's already-current Smolder tick untouched", () => {
    const dot = clone(debuffIn(STORE, UMBRA_DARK_FIRE).dot)
    expect(healMysticDotRank(UMBRA_DARK_FIRE, dot)).toEqual(dot)
  })

  it("leaves an edited tick, another debuff and a missing dot alone", () => {
    const edited = { ...clone(debuffIn(STORE, TOAD_POISON).dot), physMultiplier: 0.3 }
    expect(healMysticDotRank(TOAD_POISON, edited)).toEqual(edited)
    const other = clone(debuffIn(STORE, USER_AUTHORED).dot)
    expect(healMysticDotRank(USER_AUTHORED, other)).toEqual(other)
    expect(healMysticDotRank(TOAD_POISON, null)).toBeNull()
  })
})

describe("V5__mysticArtRankRepair — called directly", () => {
  it("heals every stale row and nothing else", () => {
    const after = V5__mysticArtRankRepair.migrate(clone(STORE))
    expect(after.v).toBe(5)
    expect(debuffIn(after, TOAD_POISON).dot!.physMultiplier).toBeCloseTo(1.62189, 10)
    expect(debuffIn(after, FLUTE_RIPPLE).dot!.physMultiplier).toBeCloseTo(1.47645, 10)
    expect(debuffIn(after, SPLENDOR_DARK_FIRE).dot!.physMultiplier).toBeCloseTo(0.24991, 10)
    expect(debuffIn(after, UMBRA_DARK_FIRE).dot!.physMultiplier).toBeCloseTo(0.24991, 10)
    expect(debuffIn(after, USER_AUTHORED)).toEqual(debuffIn(STORE, USER_AUTHORED))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V5__mysticArtRankRepair.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V5__mysticArtRankRepair.migrate(clone(once))).toEqual(once)
  })
})

describe("V5__mysticArtRankRepair — through the chain", () => {
  beforeEach(() => localStorage.clear())

  it("is registered and is exactly what the v4 → v5 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V5__mysticArtRankRepair)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 5 })!
    expect(result.applied).toEqual(["V5__mysticArtRankRepair"])
    expect(result.blob.v).toBe(5)
  })

  it("loadCustomDebuffs walks the store once and persists it at the latest version", () => {
    localStorage.setItem(DEBUFFS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomDebuffs()
    expect(loaded.map((debuff) => debuff.id)).toEqual(STORE.debuffs.map((debuff) => debuff.id))
    expect(loaded.find((debuff) => debuff.id === TOAD_POISON)!.dot!.physMultiplier).toBeCloseTo(
      1.62189,
      10,
    )
    const persisted = JSON.parse(localStorage.getItem(DEBUFFS_KEY)!) as RawCustomDebuffsBlob
    expect(persisted.v).toBe(LATEST_CUSTOM_DEBUFFS_VERSION)
    const written = localStorage.getItem(DEBUFFS_KEY)
    expect(loadCustomDebuffs()).toEqual(loaded)
    expect(localStorage.getItem(DEBUFFS_KEY)).toBe(written)
  })
})
