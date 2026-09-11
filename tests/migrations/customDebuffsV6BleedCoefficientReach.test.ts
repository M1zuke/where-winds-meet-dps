// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V6__bleedCoefficientReach,
  healBleedCoefficientReceives,
} from "../../src/migrations/customDebuffs/V6__bleedCoefficientReach"
import { builtinDebuffsForClass } from "../../src/engine/builtinLibrary"
import type { Debuff } from "../../src/engine/debuff"
import storeV5File from "./testCustomDebuffs/v5/store.json"

const CLASS = "bellstrikeUmbra"
const BLEED_TICK = `debuff-${CLASS}-bleed-tick`
const USER_AUTHORED = "db-user-authored-fire"
const COEFFICIENT_BUFF = "bellstrikeUmbraBleedCoefficient"
const STORE = storeV5File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

describe("custom-debuffs v5 fixture", () => {
  it("is v5 and its Bleeding copy still does not list the coefficient buff", () => {
    expect(STORE.v).toBe(V6__bleedCoefficientReach.to - 1)
    expect(debuffIn(STORE, BLEED_TICK).receives).not.toContain(COEFFICIENT_BUFF)
  })

  it("holds it on the built-in the copy was seeded from", () => {
    const built = builtinDebuffsForClass(CLASS).find((debuff) => debuff.id === BLEED_TICK)!
    expect(built.receives).toContain(COEFFICIENT_BUFF)
  })
})

describe("healBleedCoefficientReceives", () => {
  it("appends the coefficient buff, keeping the entries the copy already had", () => {
    const before = clone(debuffIn(STORE, BLEED_TICK))
    const healed = healBleedCoefficientReceives(before) as Debuff
    expect(healed.receives).toEqual([...(before.receives ?? []), COEFFICIENT_BUFF])
  })

  it("leaves an already-healed copy, and a debuff with another id, alone", () => {
    const healedOnce = healBleedCoefficientReceives(clone(debuffIn(STORE, BLEED_TICK)))
    expect(healBleedCoefficientReceives(clone(healedOnce))).toEqual(healedOnce)
    const other = clone(debuffIn(STORE, USER_AUTHORED))
    expect(healBleedCoefficientReceives(other)).toEqual(other)
  })
})

describe("V6__bleedCoefficientReach — called directly", () => {
  it("heals the Bleeding copy and nothing else", () => {
    const after = V6__bleedCoefficientReach.migrate(clone(STORE))
    expect(after.v).toBe(6)
    expect(debuffIn(after, BLEED_TICK).receives).toContain(COEFFICIENT_BUFF)
    for (const debuff of STORE.debuffs) {
      if (debuff.id === BLEED_TICK) continue
      expect(debuffIn(after, debuff.id)).toEqual(debuff)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V6__bleedCoefficientReach.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V6__bleedCoefficientReach.migrate(clone(once))).toEqual(once)
  })
})

describe("V6__bleedCoefficientReach — through the chain", () => {
  it("is registered and is exactly what the v5 → v6 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V6__bleedCoefficientReach)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 6 })!
    expect(result.applied).toEqual(["V6__bleedCoefficientReach"])
    expect(result.blob.v).toBe(6)
    expect(debuffIn(result.blob, BLEED_TICK).receives).toContain(COEFFICIENT_BUFF)
  })
})
