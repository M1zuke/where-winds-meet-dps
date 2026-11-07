import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import { V16__droneStampsAndRecall } from "../../src/migrations/customDebuffs/V16__droneStampsAndRecall"
import { DEBUFFS } from "../../src/data/skills/silkbind-jade/debuffs"
import type { Debuff } from "../../src/engine/debuff"
import { DEBUFF } from "../../src/data/skills/silkbind-jade/ids"
import storeV15File from "./testCustomDebuffs/v15/store.json"

const STORE = storeV15File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }
const FIXED_COUNT_IDS: readonly string[] = [DEBUFF.umbdrone12Hit, DEBUFF.umbdrone16Hit]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

const builtin = (id: string): Debuff => DEBUFFS.find((debuff) => debuff.id === id)!

describe("custom-debuffs v15 fixture", () => {
  it("is v15 and stores the drone copies without either field", () => {
    expect(STORE.v).toBe(V16__droneStampsAndRecall.to - 1)
    for (const id of FIXED_COUNT_IDS) {
      expect(debuffIn(STORE, id).dot?.rearmsToAbsoluteDeadline).toBeUndefined()
      expect(debuffIn(STORE, id).recall).toBeUndefined()
    }
  })
})

describe("V16__droneStampsAndRecall — called directly", () => {
  it("lands an untouched fixed-count copy on the live debuff's flag and recall", () => {
    const after = V16__droneStampsAndRecall.migrate(clone(STORE))
    expect(after.v).toBe(16)
    for (const id of FIXED_COUNT_IDS) {
      expect(debuffIn(after, id).dot?.rearmsToAbsoluteDeadline).toBe(
        builtin(id).dot?.rearmsToAbsoluteDeadline,
      )
      expect(debuffIn(after, id).recall).toEqual(builtin(id).recall)
    }
  })

  it("keeps a recall the copy already carries and every other debuff", () => {
    const edited = clone(STORE)
    debuffIn(edited, DEBUFF.umbdrone12Hit).recall = { tag: "weapon:Fan" }
    const after = V16__droneStampsAndRecall.migrate(edited)
    expect(debuffIn(after, DEBUFF.umbdrone12Hit).recall).toEqual({ tag: "weapon:Fan" })
    for (const debuff of STORE.debuffs) {
      if (FIXED_COUNT_IDS.includes(debuff.id)) continue
      expect(debuffIn(after, debuff.id), debuff.id).toEqual(debuff)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V16__droneStampsAndRecall.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V16__droneStampsAndRecall.migrate(clone(once))).toEqual(once)
  })
})

describe("V16__droneStampsAndRecall — through the chain", () => {
  it("is registered and is exactly what the v15 → v16 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V16__droneStampsAndRecall)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 16 })!
    expect(result.applied).toEqual(["V16__droneStampsAndRecall"])
    expect(result.blob.v).toBe(16)
  })
})
