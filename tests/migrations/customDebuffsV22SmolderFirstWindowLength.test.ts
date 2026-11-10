import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V22__smolderFirstWindowLength,
  healSmolderWindowLength,
} from "../../src/migrations/customDebuffs/V22__smolderFirstWindowLength"
import { smolder } from "../../src/data/skills/mystic/debuffs"
import type { Debuff } from "../../src/engine/debuff"
import storeV21File from "./testCustomDebuffs/v21/store.json"

const STORE = storeV21File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }
const SMOLDER_ID = smolder.id
const NEIGHBOUR_ID = "debuff-mystic-combustion"
const USER_AUTHORED_ID = "df-user-authored-gash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

describe("custom-debuffs v21 fixture", () => {
  it("is v21 and still stores Smolder's 240 frame window", () => {
    expect(STORE.v).toBe(V22__smolderFirstWindowLength.to - 1)
    expect(debuffIn(STORE, SMOLDER_ID).durationFrames).toBe(240)
  })
})

describe("healSmolderWindowLength", () => {
  it("lands the untouched copy on the live window", () => {
    const healed = healSmolderWindowLength(clone(debuffIn(STORE, SMOLDER_ID))) as Debuff
    expect(healed.durationFrames).toBe(smolder.durationFrames)
  })

  it("keeps a copy whose window was edited", () => {
    const edited = clone(debuffIn(STORE, SMOLDER_ID))
    edited.durationFrames = 300
    expect(healSmolderWindowLength(clone(edited))).toEqual(edited)
  })

  it("leaves a neighbour and a user-authored debuff alone and is idempotent", () => {
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID]) {
      const seeded = debuffIn(STORE, id)
      expect(healSmolderWindowLength(clone(seeded)), id).toEqual(seeded)
    }
    const once = healSmolderWindowLength(clone(debuffIn(STORE, SMOLDER_ID)))
    expect(healSmolderWindowLength(clone(once))).toEqual(once)
  })
})

describe("V22__smolderFirstWindowLength — called directly and through the chain", () => {
  it("heals the copy and keeps every other debuff", () => {
    const after = V22__smolderFirstWindowLength.migrate(clone(STORE))
    expect(after.v).toBe(22)
    expect(debuffIn(after, SMOLDER_ID).durationFrames).toBe(234)
    for (const id of [NEIGHBOUR_ID, USER_AUTHORED_ID])
      expect(debuffIn(after, id)).toEqual(debuffIn(STORE, id))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V22__smolderFirstWindowLength.migrate(input)
    expect(input).toEqual(snapshot)
  })

  it("is registered and is exactly what the v21 → v22 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V22__smolderFirstWindowLength)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 22 })!
    expect(result.applied).toEqual(["V22__smolderFirstWindowLength"])
    expect(result.blob.v).toBe(22)
  })
})
