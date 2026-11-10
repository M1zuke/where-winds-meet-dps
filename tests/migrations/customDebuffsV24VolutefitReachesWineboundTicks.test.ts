import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V24__volutefitReachesWineboundTicks,
  healWineboundTickReceives,
} from "../../src/migrations/customDebuffs/V24__volutefitReachesWineboundTicks"
import { combustion, smolder } from "../../src/data/skills/mystic/debuffs"
import { BUFF } from "../../src/data/skills/buffs/ids"
import type { Debuff } from "../../src/engine/debuff"
import storeV23File from "./testCustomDebuffs/v23/store.json"

const STORE = storeV23File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }
const NEIGHBOUR_ID = "debuff-bellstrikeUmbra-bleed-tick"
const USER_AUTHORED_ID = "df-user-authored-gash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

describe("custom-debuffs v23 fixture", () => {
  it("is v23 and stores the Combustion and Smolder copies without the buff", () => {
    expect(STORE.v).toBe(V24__volutefitReachesWineboundTicks.to - 1)
    for (const id of [combustion.id, smolder.id])
      expect(debuffIn(STORE, id).receives, id).not.toContain(BUFF.volutefitWineboundDamage)
  })
})

describe("healWineboundTickReceives", () => {
  it("lands the untouched copies on the built-in's receives list", () => {
    for (const builtin of [combustion, smolder]) {
      const healed = healWineboundTickReceives(clone(debuffIn(STORE, builtin.id))) as Debuff
      expect(healed.receives, builtin.id).toEqual(builtin.receives)
    }
  })

  it("keeps a copy whose receives list was edited", () => {
    const edited = clone(debuffIn(STORE, smolder.id))
    edited.receives = [BUFF.soulShaken]
    expect(healWineboundTickReceives(clone(edited))).toEqual(edited)
  })

  it("leaves a neighbour and a user-authored debuff alone and is idempotent", () => {
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID]) {
      const seeded = debuffIn(STORE, id)
      expect(healWineboundTickReceives(clone(seeded)), id).toEqual(seeded)
    }
    const once = healWineboundTickReceives(clone(debuffIn(STORE, smolder.id)))
    expect(healWineboundTickReceives(clone(once))).toEqual(once)
  })
})

describe("V24__volutefitReachesWineboundTicks — called directly and through the chain", () => {
  it("heals the copies and keeps every other debuff", () => {
    const after = V24__volutefitReachesWineboundTicks.migrate(clone(STORE))
    expect(after.v).toBe(24)
    expect(debuffIn(after, smolder.id).receives).toEqual(smolder.receives)
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID])
      expect(debuffIn(after, id)).toEqual(debuffIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V24__volutefitReachesWineboundTicks.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v23 → v24 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V24__volutefitReachesWineboundTicks)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 24 })!
    expect(result.applied).toEqual(["V24__volutefitReachesWineboundTicks"])
    expect(result.blob.v).toBe(24)
  })
})
