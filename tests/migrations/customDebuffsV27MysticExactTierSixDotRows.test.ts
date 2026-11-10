import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V27__mysticExactTierSixDotRows,
  healDot,
} from "../../src/migrations/customDebuffs/V27__mysticExactTierSixDotRows"
import { MYSTIC_DEBUFFS } from "../../src/data/skills/mystic"
import { debuffWithoutLevelRows } from "../helpers/withoutLevelRows"
import type { Debuff } from "../../src/engine/debuff"
import storeV26File from "./testCustomDebuffs/v26/store.json"

const STORE = storeV26File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }
const SEEDED_IDS = [
  "debuff-mystic-toad-poison",
  "debuff-mystic-toad-poison-fury",
  "debuff-mystic-combustion",
]
const EDITED_ID = "debuff-mystic-smolder"
const USER_AUTHORED_ID = "df-user-authored-gash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!
const builtinOf = (id: string): Debuff => MYSTIC_DEBUFFS.find((debuff) => debuff.id === id)!

describe("custom-debuffs v26 fixture", () => {
  it("is v26 and stores seeded mystic copies on the rounded tier-6 row with level rows", () => {
    expect(STORE.v).toBe(V27__mysticExactTierSixDotRows.to - 1)
    for (const id of SEEDED_IDS) {
      expect(debuffIn(STORE, id).dot!.levelRows, id).toBeDefined()
      expect(debuffIn(STORE, id).dot, id).toMatchObject({
        physMultiplier: debuffWithoutLevelRows(builtinOf(id)).dot!.physMultiplier,
      })
    }
  })

  it("stores a rounded row the built-in no longer carries", () => {
    expect(debuffIn(STORE, "debuff-mystic-toad-poison").dot!.physMultiplier).toBe(1.622006)
    expect(builtinOf("debuff-mystic-toad-poison").dot!.physMultiplier).toBe(1.62200568)
  })
})

describe("healDot", () => {
  it.each(SEEDED_IDS)("gives the untouched %s copy the built-in's exact rows", (id) => {
    const healed = healDot(clone(debuffIn(STORE, id))) as Debuff
    expect(healed.dot).toMatchObject({
      physMultiplier: builtinOf(id).dot!.physMultiplier,
      attributeMultiplier: builtinOf(id).dot!.attributeMultiplier,
      physFixed: builtinOf(id).dot!.physFixed,
      attributeFixed: builtinOf(id).dot!.attributeFixed,
      levelRows: builtinOf(id).dot!.levelRows,
    })
  })

  it("keeps a copy whose tick row was edited", () => {
    const edited = debuffIn(STORE, EDITED_ID)
    expect(healDot(clone(edited))).toEqual(edited)
  })

  it("leaves a user-authored debuff alone", () => {
    const authored = debuffIn(STORE, USER_AUTHORED_ID)
    expect(healDot(clone(authored))).toEqual(authored)
  })

  it("is idempotent", () => {
    for (const id of SEEDED_IDS) {
      const once = healDot(clone(debuffIn(STORE, id)))
      expect(healDot(clone(once)), id).toEqual(once)
    }
  })
})

describe("V27__mysticExactTierSixDotRows — through the chain", () => {
  it("is registered and is exactly what the v26 → v27 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V27__mysticExactTierSixDotRows)
    const hopped = runCustomDebuffMigrations(clone(STORE), { toVersion: 27 })!.blob
    expect(hopped.v).toBe(27)
    expect(hopped).toEqual(V27__mysticExactTierSixDotRows.migrate(clone(STORE)))
  })
})
