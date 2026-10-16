import { describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
} from "../../src/migrations/customDebuffs"
import {
  V12__bitterSeasonCadence,
  healBitterSeasonCadence,
} from "../../src/migrations/customDebuffs/V12__bitterSeasonCadence"
import { builtinDebuffsForClass } from "../../src/engine/builtinLibrary"
import type { Debuff } from "../../src/engine/debuff"
import storeV11File from "./testCustomDebuffs/v11/store.json"

const BITTER_SEASON = "debuff-bellstrikeUmbra-bitter-season-tick"
const BLEED_TICK = "debuff-bellstrikeUmbra-bleed-tick"

const STORE = storeV11File as unknown as { v: number; debuffs: Debuff[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: { debuffs: unknown[] }, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

describe("the pre-V12 shape", () => {
  it("carries a Bitter Season copy with no rescheduling flag yet", () => {
    expect(STORE.v).toBe(V12__bitterSeasonCadence.to - 1)
    expect(debuffIn(STORE, BITTER_SEASON).dot!.reschedulesPerTick).toBeUndefined()
  })
})

describe("healBitterSeasonCadence", () => {
  it("marks a stale Bitter Season copy as re-arming its own timer", () => {
    const healed = healBitterSeasonCadence(clone(debuffIn(STORE, BITTER_SEASON))) as Debuff
    expect(healed.dot!.reschedulesPerTick).toBe(true)
  })

  it("heals every class's Bitter Season copy, not only one", () => {
    for (const classId of ["bellstrikeSplendor", "stonesplitStrength", "bamboocutDraught"]) {
      const copy = {
        ...clone(debuffIn(STORE, BITTER_SEASON)),
        id: `debuff-${classId}-bitter-season-tick`,
      }
      expect((healBitterSeasonCadence(copy) as Debuff).dot!.reschedulesPerTick, classId).toBe(true)
    }
  })

  it("leaves a copy whose interval was edited alone", () => {
    const edited = clone(debuffIn(STORE, BITTER_SEASON))
    edited.dot!.tickIntervalFrames = 45
    expect(healBitterSeasonCadence(clone(edited))).toEqual(edited)
  })

  it("is idempotent, and never re-decides a copy that already states it", () => {
    const once = healBitterSeasonCadence(clone(debuffIn(STORE, BITTER_SEASON)))
    expect(healBitterSeasonCadence(clone(once))).toEqual(once)
    const optedOut = clone(debuffIn(STORE, BITTER_SEASON))
    optedOut.dot!.reschedulesPerTick = false
    expect(healBitterSeasonCadence(clone(optedOut))).toEqual(optedOut)
  })

  it("leaves a debuff the migration does not target alone", () => {
    const other = clone(debuffIn(STORE, BLEED_TICK))
    expect(healBitterSeasonCadence(clone(other))).toEqual(other)
  })
})

describe("V12__bitterSeasonCadence — called directly", () => {
  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V12__bitterSeasonCadence.migrate(input)
    expect(input).toEqual(snapshot)
    expect(once.v).toBe(12)
    expect(V12__bitterSeasonCadence.migrate(clone(once))).toEqual(once)
  })
})

describe("V12__bitterSeasonCadence — through the chain", () => {
  it("is registered and is exactly what the v11 → v12 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V12__bitterSeasonCadence)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 12 })!
    expect(result.applied).toEqual(["V12__bitterSeasonCadence"])
    expect(result.blob.v).toBe(12)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_DEBUFF_MIGRATIONS.filter((step) => step !== V12__bitterSeasonCadence)
    const result = runChain(withoutStep, 12, clone(STORE))!
    expect(result.applied).not.toContain("V12__bitterSeasonCadence")
    expect(debuffIn(result.blob, BITTER_SEASON).dot!.reschedulesPerTick).toBeUndefined()
  })

  it("lands the healed copy on the live built-in's own cadence", () => {
    const result = runCustomDebuffMigrations(clone(STORE))!
    const builtin = builtinDebuffsForClass("bellstrikeUmbra").find((d) => d.id === BITTER_SEASON)!
    expect(debuffIn(result.blob, BITTER_SEASON).dot!.reschedulesPerTick).toBe(true)
    expect(builtin.dot!.reschedulesPerTick).toBe(true)
  })
})
