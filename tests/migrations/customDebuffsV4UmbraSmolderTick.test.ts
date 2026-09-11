// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { beforeEach, describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  LATEST_CUSTOM_DEBUFFS_VERSION,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V4__umbraSmolderTick,
  migrateUmbraSmolderDot,
} from "../../src/migrations/customDebuffs/V4__umbraSmolderTick"
import { builtinDebuffsForClass } from "../../src/engine/builtinLibrary"
import { loadCustomDebuffs } from "../../src/storage"
import type { Debuff } from "../../src/engine/debuff"
import storeV3File from "./testCustomDebuffs/v3/store.json"

const CLASS = "bellstrikeUmbra"
const SMOLDER = "debuff-bellstrikeUmbra-dark-fire"
const WALKED_SMOLDER = "debuff-mystic-smolder"
const USER_AUTHORED = "db-user-authored-fire"
const DEBUFFS_KEY = "wwm.customDebuffs"
const STORE = storeV3File as unknown as { v: number; debuffs: Debuff[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: { debuffs: unknown[] }, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

const currentTick = () =>
  builtinDebuffsForClass(CLASS).find((debuff) => debuff.id === WALKED_SMOLDER)!.dot!

describe("custom-debuffs v3 fixture", () => {
  it("is v3 and still stores the superseded Smolder tick the built-in no longer carries", () => {
    expect(STORE.v).toBe(V4__umbraSmolderTick.to - 1)
    expect(debuffIn(STORE, SMOLDER).dot!.physMultiplier).toBe(0.236)
    expect(currentTick().physMultiplier).not.toBe(0.236)
  })
})

describe("migrateUmbraSmolderDot", () => {
  it("rewrites the untouched tick to the built-in's current tick", () => {
    const healed = migrateUmbraSmolderDot(
      SMOLDER,
      clone(debuffIn(STORE, SMOLDER).dot),
    ) as Debuff["dot"]
    expect(healed!.physMultiplier).toBe(currentTick().physMultiplier)
    expect(healed!.physFixed).toBe(currentTick().physFixed)
    expect(healed!.attributeMultiplier).toBe(currentTick().attributeMultiplier)
  })

  it("leaves an edited tick, another debuff and a missing dot alone", () => {
    const edited = { ...clone(debuffIn(STORE, SMOLDER).dot), physMultiplier: 0.3 }
    expect(migrateUmbraSmolderDot(SMOLDER, edited)).toEqual(edited)
    const other = clone(debuffIn(STORE, USER_AUTHORED).dot)
    expect(migrateUmbraSmolderDot(USER_AUTHORED, other)).toEqual(other)
    expect(migrateUmbraSmolderDot(SMOLDER, null)).toBeNull()
  })
})

describe("V4__umbraSmolderTick — called directly", () => {
  it("rewrites the seeded Smolder copy's tick and nothing else", () => {
    const after = V4__umbraSmolderTick.migrate(clone(STORE))
    expect(after.v).toBe(4)
    const { dot: _dot, ...restBefore } = debuffIn(STORE, SMOLDER)
    const { dot, ...restAfter } = debuffIn(after, SMOLDER)
    void _dot
    expect(restAfter).toEqual(restBefore)
    expect(dot!.physMultiplier).toBe(currentTick().physMultiplier)
    expect(debuffIn(after, USER_AUTHORED)).toEqual(debuffIn(STORE, USER_AUTHORED))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V4__umbraSmolderTick.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V4__umbraSmolderTick.migrate(clone(once))).toEqual(once)
  })
})

describe("V4__umbraSmolderTick — through the chain", () => {
  beforeEach(() => localStorage.clear())

  it("is registered and is exactly what the v3 → v4 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V4__umbraSmolderTick)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 4 })!
    expect(result.applied).toEqual(["V4__umbraSmolderTick"])
    expect(result.blob.v).toBe(4)
  })

  it("loadCustomDebuffs walks the store once and persists it at the latest version", () => {
    localStorage.setItem(DEBUFFS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomDebuffs()
    expect(loaded.map((debuff) => debuff.id)).toEqual([WALKED_SMOLDER, USER_AUTHORED])
    expect(loaded.find((debuff) => debuff.id === WALKED_SMOLDER)!.dot!.physMultiplier).toBe(
      currentTick().physMultiplier,
    )
    expect(loaded.find((debuff) => debuff.id === USER_AUTHORED)!.dot!.physMultiplier).toBe(0.236)
    const persisted = JSON.parse(localStorage.getItem(DEBUFFS_KEY)!) as RawCustomDebuffsBlob
    expect(persisted.v).toBe(LATEST_CUSTOM_DEBUFFS_VERSION)
    const written = localStorage.getItem(DEBUFFS_KEY)
    expect(loadCustomDebuffs()).toEqual(loaded)
    expect(localStorage.getItem(DEBUFFS_KEY)).toBe(written)
  })
})
