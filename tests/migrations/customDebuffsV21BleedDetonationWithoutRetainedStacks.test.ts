import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V21__bleedDetonationWithoutRetainedStacks,
  healBleedDetonationRetention,
} from "../../src/migrations/customDebuffs/V21__bleedDetonationWithoutRetainedStacks"
import { DEBUFFS } from "../../src/data/skills/bellstrike-umbra/debuffs"
import type { Debuff } from "../../src/engine/debuff"
import storeV20File from "./testCustomDebuffs/v20/store.json"

const STORE = storeV20File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }
const BLEED_ID = "debuff-bellstrikeUmbra-bleed-tick"
const UNTOUCHED_ID = "debuff-bellstrikeUmbra-bitter-season-tick"
const USER_AUTHORED_ID = "df-user-authored-gash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

const builtinOf = (id: string): Debuff => DEBUFFS.find((debuff) => debuff.id === id)!

describe("custom-debuffs v20 fixture", () => {
  it("is v20 and stores Bleeding's tier-gated retained stacks", () => {
    expect(STORE.v).toBe(V21__bleedDetonationWithoutRetainedStacks.to - 1)
    expect(debuffIn(STORE, BLEED_ID).detonation).toMatchObject({
      retainParam: "swordHorizon",
      retainMinTier: 6,
      retainParamStacks: 2,
    })
  })
})

describe("healBleedDetonationRetention", () => {
  it("lands the untouched Bleeding copy's detonation on the live debuff", () => {
    const healed = healBleedDetonationRetention(clone(debuffIn(STORE, BLEED_ID))) as Debuff
    expect(healed.detonation).toEqual(builtinOf(BLEED_ID).detonation)
  })

  it("leaves a retained amount the copy was edited away from alone", () => {
    const edited = clone(debuffIn(STORE, BLEED_ID))
    Object.assign(edited.detonation!, { retainParamStacks: 3 })
    expect(healBleedDetonationRetention(clone(edited))).toEqual(edited)
  })

  it("leaves an untouched neighbour and a user-authored debuff alone and is idempotent", () => {
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID]) {
      const seeded = debuffIn(STORE, id)
      expect(healBleedDetonationRetention(clone(seeded)), id).toEqual(seeded)
    }
    const once = healBleedDetonationRetention(clone(debuffIn(STORE, BLEED_ID)))
    expect(healBleedDetonationRetention(clone(once))).toEqual(once)
  })
})

describe("V21__bleedDetonationWithoutRetainedStacks — called directly", () => {
  it("heals Bleeding and keeps every other debuff", () => {
    const after = V21__bleedDetonationWithoutRetainedStacks.migrate(clone(STORE))
    expect(after.v).toBe(21)
    expect(debuffIn(after, BLEED_ID).detonation).toEqual(builtinOf(BLEED_ID).detonation)
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID]) {
      expect(debuffIn(after, id)).toEqual(debuffIn(STORE, id))
    }
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V21__bleedDetonationWithoutRetainedStacks.migrate(input)
    expect(input).toEqual(snapshot)
  })
})

describe("V21__bleedDetonationWithoutRetainedStacks — through the chain", () => {
  it("is registered and is exactly what the v20 → v21 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V21__bleedDetonationWithoutRetainedStacks)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 21 })!
    expect(result.applied).toEqual(["V21__bleedDetonationWithoutRetainedStacks"])
    expect(result.blob.v).toBe(21)
  })
})
