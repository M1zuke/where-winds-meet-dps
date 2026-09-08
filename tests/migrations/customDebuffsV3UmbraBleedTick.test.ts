// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { beforeEach, describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  LATEST_CUSTOM_DEBUFFS_VERSION,
  OLDEST_MIGRATABLE_CUSTOM_DEBUFFS_VERSION,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V3__umbraBleedTick,
  migrateUmbraBleedDot,
} from "../../src/migrations/customDebuffs/V3__umbraBleedTick"
import { builtinDebuffsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomDebuffs } from "../../src/storage"
import type { Debuff } from "../../src/engine/debuff"
import storeV2File from "./testCustomDebuffs/v2/store.json"

const CLASS = "bellstrikeUmbra"
const BLEED = "debuff-bellstrikeUmbra-bleed-tick"
const USER_AUTHORED = "db-user-authored-poison"
const DEBUFFS_KEY = "wwm.customDebuffs"
const STORE = storeV2File as unknown as { v: number; debuffs: Debuff[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: { debuffs: unknown[] }, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

const currentTick = () => builtinDebuffsForClass(CLASS).find((debuff) => debuff.id === BLEED)!.dot!

describe("custom-debuff migration registry", () => {
  it("is gap-free, ordered, named for its target and starts right after the floor", () => {
    const targets = CUSTOM_DEBUFF_MIGRATIONS.map((m) => m.to)
    expect(targets[0]).toBe(OLDEST_MIGRATABLE_CUSTOM_DEBUFFS_VERSION + 1)
    for (let index = 1; index < targets.length; index++)
      expect(targets[index]).toBe(targets[index - 1] + 1)
    for (const m of CUSTOM_DEBUFF_MIGRATIONS) expect(m.name.startsWith(`V${m.to}__`)).toBe(true)
    expect(LATEST_CUSTOM_DEBUFFS_VERSION).toBe(Math.max(...targets))
  })

  it("leaves a blob from a newer build untouched and refuses non-objects", () => {
    const newer = { ...clone(STORE), v: LATEST_CUSTOM_DEBUFFS_VERSION + 1 }
    expect(runCustomDebuffMigrations(newer)!.blob).toEqual(newer)
    expect(runCustomDebuffMigrations("garbage")).toBeNull()
  })
})

describe("custom-debuffs v2 fixture", () => {
  it("is v2 and still stores the superseded Bleeding tick the built-in no longer carries", () => {
    expect(STORE.v).toBe(V3__umbraBleedTick.to - 1)
    expect(debuffIn(STORE, BLEED).dot!.physMultiplier).toBe(0.06864)
    expect(currentTick().physMultiplier).not.toBe(0.06864)
  })
})

describe("migrateUmbraBleedDot", () => {
  it("rewrites the untouched tick to the built-in's current tick", () => {
    const healed = migrateUmbraBleedDot(BLEED, clone(debuffIn(STORE, BLEED).dot)) as Debuff["dot"]
    expect(healed!.physMultiplier).toBe(currentTick().physMultiplier)
    expect(healed!.attributeMultiplier).toBe(currentTick().attributeMultiplier)
  })

  it("leaves an edited tick, another debuff and a missing dot alone", () => {
    const edited = { ...clone(debuffIn(STORE, BLEED).dot), physMultiplier: 0.07 }
    expect(migrateUmbraBleedDot(BLEED, edited)).toEqual(edited)
    const other = clone(debuffIn(STORE, USER_AUTHORED).dot)
    expect(migrateUmbraBleedDot(USER_AUTHORED, other)).toEqual(other)
    expect(migrateUmbraBleedDot(BLEED, null)).toBeNull()
  })
})

describe("V3__umbraBleedTick — called directly", () => {
  it("rewrites the seeded Bleeding copy's tick and nothing else", () => {
    const after = V3__umbraBleedTick.migrate(clone(STORE))
    expect(after.v).toBe(3)
    const { dot: _dot, ...restBefore } = debuffIn(STORE, BLEED)
    const { dot, ...restAfter } = debuffIn(after, BLEED)
    void _dot
    expect(restAfter).toEqual(restBefore)
    expect(dot!.physMultiplier).toBe(currentTick().physMultiplier)
    expect({ ...dot, physMultiplier: 0, attributeMultiplier: 0 }).toEqual({
      ...debuffIn(STORE, BLEED).dot,
      physMultiplier: 0,
      attributeMultiplier: 0,
    })
    expect(debuffIn(after, USER_AUTHORED)).toEqual(debuffIn(STORE, USER_AUTHORED))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V3__umbraBleedTick.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V3__umbraBleedTick.migrate(clone(once))).toEqual(once)
  })
})

describe("V3__umbraBleedTick — through the chain", () => {
  beforeEach(() => localStorage.clear())

  it("is registered and is exactly what the v2 → v3 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V3__umbraBleedTick)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 3 })!
    expect(result.applied).toEqual(["V3__umbraBleedTick"])
    expect(result.blob.v).toBe(3)
  })

  it("loadCustomDebuffs walks the store once and persists it at the latest version", () => {
    localStorage.setItem(DEBUFFS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomDebuffs()
    expect(loaded.map((debuff) => debuff.id)).toEqual(STORE.debuffs.map((debuff) => debuff.id))
    expect(loaded.find((debuff) => debuff.id === BLEED)!.dot!.physMultiplier).toBe(
      currentTick().physMultiplier,
    )
    expect(loaded.find((debuff) => debuff.id === USER_AUTHORED)!.dot!.physMultiplier).toBe(0.06864)
    const persisted = JSON.parse(localStorage.getItem(DEBUFFS_KEY)!) as RawCustomDebuffsBlob
    expect(persisted.v).toBe(LATEST_CUSTOM_DEBUFFS_VERSION)
    const written = localStorage.getItem(DEBUFFS_KEY)
    expect(loadCustomDebuffs()).toEqual(loaded)
    expect(localStorage.getItem(DEBUFFS_KEY)).toBe(written)
  })

  it("drops a store older than the chain's floor", () => {
    localStorage.setItem(DEBUFFS_KEY, JSON.stringify({ ...clone(STORE), v: 1 }))
    expect(loadCustomDebuffs()).toEqual([])
  })
})
