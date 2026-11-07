import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import { V14__droneComboExtendMarkReach } from "../../src/migrations/customDebuffs/V14__droneComboExtendMarkReach"
import type { Debuff } from "../../src/engine/debuff"
import { DEBUFF } from "../../src/data/skills/silkbind-jade/ids"
import storeV13File from "./testCustomDebuffs/v13/store.json"

const STORE = storeV13File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

describe("custom-debuffs v13 fixture", () => {
  it("is v13 and stores the drone copies granting Lingering Bone alone", () => {
    expect(STORE.v).toBe(V14__droneComboExtendMarkReach.to - 1)
    expect(debuffIn(STORE, DEBUFF.umbdrone12Hit).triggersBuffs).toEqual(["lingeringBone"])
  })
})

describe("V14__droneComboExtendMarkReach — called directly", () => {
  it("gives an untouched drone copy the Extend Mark grant", () => {
    const after = V14__droneComboExtendMarkReach.migrate(clone(STORE))
    expect(after.v).toBe(14)
    expect(debuffIn(after, DEBUFF.umbdrone12Hit).triggersBuffs).toEqual([
      "lingeringBone",
      "comboExtendMark",
    ])
  })

  it("leaves an edited copy and every other debuff alone", () => {
    const after = V14__droneComboExtendMarkReach.migrate(clone(STORE))
    expect(debuffIn(after, DEBUFF.umbdrone16Hit)).toEqual(debuffIn(STORE, DEBUFF.umbdrone16Hit))
    for (const debuff of STORE.debuffs) {
      if (debuff.id === DEBUFF.umbdrone12Hit) continue
      expect(debuffIn(after, debuff.id), debuff.id).toEqual(debuff)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V14__droneComboExtendMarkReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V14__droneComboExtendMarkReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V14__droneComboExtendMarkReach — through the chain", () => {
  it("is registered and is exactly what the v13 → v14 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V14__droneComboExtendMarkReach)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 14 })!
    expect(result.applied).toEqual(["V14__droneComboExtendMarkReach"])
    expect(result.blob.v).toBe(14)
  })
})
