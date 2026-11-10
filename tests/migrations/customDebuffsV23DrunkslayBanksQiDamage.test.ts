import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V23__drunkslayBanksQiDamage,
  healDrunkslayQiShare,
} from "../../src/migrations/customDebuffs/V23__drunkslayBanksQiDamage"
import { drunkslay } from "../../src/data/skills/bamboocut-draught/debuffs"
import type { Debuff } from "../../src/engine/debuff"
import storeV22File from "./testCustomDebuffs/v22/store.json"

const STORE = storeV22File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }
const NEIGHBOUR_ID = "debuff-mystic-combustion"
const USER_AUTHORED_ID = "df-user-authored-gash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

describe("custom-debuffs v22 fixture", () => {
  it("is v22 and stores Drunkslay's echo with a damage share only", () => {
    expect(STORE.v).toBe(V23__drunkslayBanksQiDamage.to - 1)
    expect(debuffIn(STORE, drunkslay.id).echo?.share).toBe(0.2)
    expect(debuffIn(STORE, drunkslay.id).echo?.qiShare).toBeUndefined()
  })
})

describe("healDrunkslayQiShare", () => {
  it("lands the untouched copy on the live echo", () => {
    const healed = healDrunkslayQiShare(clone(debuffIn(STORE, drunkslay.id))) as Debuff
    expect(healed.echo).toEqual(drunkslay.echo)
  })

  it("keeps a copy whose damage share was edited", () => {
    const edited = clone(debuffIn(STORE, drunkslay.id))
    edited.echo!.share = 0.5
    expect(healDrunkslayQiShare(clone(edited))).toEqual(edited)
  })

  it("leaves a neighbour and a user-authored debuff alone and is idempotent", () => {
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID]) {
      const seeded = debuffIn(STORE, id)
      expect(healDrunkslayQiShare(clone(seeded)), id).toEqual(seeded)
    }
    const once = healDrunkslayQiShare(clone(debuffIn(STORE, drunkslay.id)))
    expect(healDrunkslayQiShare(clone(once))).toEqual(once)
  })
})

describe("V23__drunkslayBanksQiDamage — called directly and through the chain", () => {
  it("heals the copy and keeps every other debuff", () => {
    const after = V23__drunkslayBanksQiDamage.migrate(clone(STORE))
    expect(after.v).toBe(23)
    expect(debuffIn(after, drunkslay.id).echo?.qiShare).toBe(0.12)
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID])
      expect(debuffIn(after, id)).toEqual(debuffIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V23__drunkslayBanksQiDamage.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v22 → v23 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V23__drunkslayBanksQiDamage)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 23 })!
    expect(result.applied).toEqual(["V23__drunkslayBanksQiDamage"])
    expect(result.blob.v).toBe(23)
  })
})
