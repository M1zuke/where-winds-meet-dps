import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import { V15__droneComboExtendMarkPerHit } from "../../src/migrations/customDebuffs/V15__droneComboExtendMarkPerHit"
import type { Debuff } from "../../src/engine/debuff"
import { DEBUFF } from "../../src/data/skills/silkbind-jade/ids"
import storeV14File from "./testCustomDebuffs/v14/store.json"

const STORE = storeV14File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

describe("custom-debuffs v14 fixture", () => {
  it("is v14 and stores the drone copy granting Extend Mark without receiving it", () => {
    expect(STORE.v).toBe(V15__droneComboExtendMarkPerHit.to - 1)
    const copy = debuffIn(STORE, DEBUFF.umbdrone12Hit)
    expect(copy.triggersBuffs).toEqual(["lingeringBone", "comboExtendMark"])
    expect(copy.receives).toEqual(["soulShaken", "lingeringBone"])
  })
})

describe("V15__droneComboExtendMarkPerHit — called directly", () => {
  it("moves Extend Mark from an untouched drone copy's grants to its receives", () => {
    const after = V15__droneComboExtendMarkPerHit.migrate(clone(STORE))
    const healed = debuffIn(after, DEBUFF.umbdrone12Hit)
    expect(after.v).toBe(15)
    expect(healed.triggersBuffs).toEqual(["lingeringBone"])
    expect(healed.receives).toEqual(["soulShaken", "lingeringBone", "comboExtendMark"])
  })

  it("keeps an edited grant list while still healing the receives", () => {
    const after = V15__droneComboExtendMarkPerHit.migrate(clone(STORE))
    const healed = debuffIn(after, DEBUFF.umbdrone16Hit)
    expect(healed.triggersBuffs).toEqual(debuffIn(STORE, DEBUFF.umbdrone16Hit).triggersBuffs)
    expect(healed.receives).toEqual(["soulShaken", "lingeringBone", "comboExtendMark"])
  })

  it("keeps edited receives", () => {
    const store = clone(STORE)
    debuffIn(store, DEBUFF.umbdrone12Hit).receives = ["soulShaken"]
    const after = V15__droneComboExtendMarkPerHit.migrate(store)
    expect(debuffIn(after, DEBUFF.umbdrone12Hit).receives).toEqual(["soulShaken"])
  })

  it("leaves every other debuff alone", () => {
    const after = V15__droneComboExtendMarkPerHit.migrate(clone(STORE))
    for (const debuff of STORE.debuffs) {
      if (debuff.id === DEBUFF.umbdrone12Hit || debuff.id === DEBUFF.umbdrone16Hit) continue
      expect(debuffIn(after, debuff.id), debuff.id).toEqual(debuff)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V15__droneComboExtendMarkPerHit.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V15__droneComboExtendMarkPerHit.migrate(clone(once))).toEqual(once)
  })
})

describe("V15__droneComboExtendMarkPerHit — through the chain", () => {
  it("is registered and is exactly what the v14 → v15 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V15__droneComboExtendMarkPerHit)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 15 })!
    expect(result.applied).toEqual(["V15__droneComboExtendMarkPerHit"])
    expect(result.blob.v).toBe(15)
  })
})
