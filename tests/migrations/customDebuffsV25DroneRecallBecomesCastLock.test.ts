import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V25__droneRecallBecomesCastLock,
  healDroneRecall,
} from "../../src/migrations/customDebuffs/V25__droneRecallBecomesCastLock"
import { umbdrone12Hit, umbdrone20Hit } from "../../src/data/skills/silkbind-jade/debuffs"
import type { Debuff } from "../../src/engine/debuff"
import storeV24File from "./testCustomDebuffs/v24/store.json"

const STORE = storeV24File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }
const EDITED_ID = "debuff-silkbindJade-umbdrone-26hit"
const NEIGHBOUR_ID = "debuff-silkbindJade-umbdrone"
const USER_AUTHORED_ID = "df-user-authored-gash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

describe("custom-debuffs v24 fixture", () => {
  it("is v24 and stores the fixed-count copies with the old recall spec", () => {
    expect(STORE.v).toBe(V25__droneRecallBecomesCastLock.to - 1)
    for (const id of [umbdrone12Hit.id, umbdrone20Hit.id]) {
      expect(debuffIn(STORE, id).recall, id).toBeDefined()
      expect(debuffIn(STORE, id).castLock, id).toBeUndefined()
    }
  })
})

describe("healDroneRecall", () => {
  it("replaces the seeded recall with the built-in's cast lock", () => {
    for (const builtin of [umbdrone12Hit, umbdrone20Hit]) {
      const healed = healDroneRecall(clone(debuffIn(STORE, builtin.id))) as Debuff
      expect(healed.castLock, builtin.id).toEqual(builtin.castLock)
      expect(healed.recall, builtin.id).toBeUndefined()
    }
  })

  it("keeps a copy whose recall was edited", () => {
    const edited = debuffIn(STORE, EDITED_ID)
    expect(healDroneRecall(clone(edited))).toEqual(edited)
  })

  it("leaves the Blossoms-gated drone and a user-authored debuff alone and is idempotent", () => {
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID]) {
      const seeded = debuffIn(STORE, id)
      expect(healDroneRecall(clone(seeded)), id).toEqual(seeded)
    }
    const once = healDroneRecall(clone(debuffIn(STORE, umbdrone20Hit.id)))
    expect(healDroneRecall(clone(once))).toEqual(once)
  })
})

describe("V25__droneRecallBecomesCastLock — called directly and through the chain", () => {
  it("heals the seeded copies and keeps every other debuff", () => {
    const after = V25__droneRecallBecomesCastLock.migrate(clone(STORE))
    expect(after.v).toBe(25)
    expect(debuffIn(after, umbdrone20Hit.id).castLock).toEqual(umbdrone20Hit.castLock)
    for (const id of [EDITED_ID, NEIGHBOUR_ID, USER_AUTHORED_ID])
      expect(debuffIn(after, id)).toEqual(debuffIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V25__droneRecallBecomesCastLock.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v24 → v25 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V25__droneRecallBecomesCastLock)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 25 })!
    expect(result.applied).toEqual(["V25__droneRecallBecomesCastLock"])
    expect(result.blob.v).toBe(25)
  })
})
