// Scoped to Bellstrike Umbra — see CLAUDE.md § "Implemented classes".
import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V7__dotTickCadence,
  healDotTickCadence,
} from "../../src/migrations/customDebuffs/V7__dotTickCadence"
import { builtinDebuffsForClass } from "../../src/engine/builtinLibrary"
import { DEBUFF as MYSTIC_DEBUFF } from "../../src/data/skills/mystic/ids"
import type { Debuff } from "../../src/engine/debuff"
import storeV6File from "./testCustomDebuffs/v6/store.json"

const CLASS = "bellstrikeUmbra"
const SMOLDER = `debuff-${CLASS}-dark-fire`
const BLEED = `debuff-${CLASS}-bleed-tick`
const FLUTE = `debuff-${CLASS}-flute-ripple`
const UNTOUCHED = `debuff-${CLASS}-toad-poison`
const STORE = storeV6File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

describe("custom-debuffs v6 fixture", () => {
  it("is v6 and none of its copies carries the cadence fields yet", () => {
    expect(STORE.v).toBe(V7__dotTickCadence.to - 1)
    for (const debuff of STORE.debuffs) {
      if (!debuff.dot) continue
      expect(debuff.dot.firstTickOffsetFrames).toBeUndefined()
      expect(debuff.dot.reschedulesPerTick).toBeUndefined()
    }
  })

  it("holds them on the built-ins the copies were seeded from", () => {
    const built = (id: string) => builtinDebuffsForClass(CLASS).find((d) => d.id === id)!
    expect(built(MYSTIC_DEBUFF.smolder).dot!.firstTickOffsetFrames).toBe(0)
    expect(built(MYSTIC_DEBUFF.smolder).dot!.reschedulesPerTick).toBe(true)
    expect(built(BLEED).dot!.firstTickOffsetFrames).toBe(30)
    expect(built(MYSTIC_DEBUFF.fluteRipple).dot!.reschedulesPerTick).toBe(false)
  })
})

describe("healDotTickCadence", () => {
  it("gives a stale Smolder copy the offset and the rescheduling flag", () => {
    const healed = healDotTickCadence(clone(debuffIn(STORE, SMOLDER))) as Debuff
    expect(healed.dot!.firstTickOffsetFrames).toBe(0)
    expect(healed.dot!.reschedulesPerTick).toBe(true)
  })

  it("gives a stale Bleeding copy its half-second first tick", () => {
    const healed = healDotTickCadence(clone(debuffIn(STORE, BLEED))) as Debuff
    expect(healed.dot!.firstTickOffsetFrames).toBe(30)
    expect(healed.dot!.reschedulesPerTick).toBe(true)
  })

  it("marks a stale Flute Ripple copy as not re-arming, and gives it no offset", () => {
    const healed = healDotTickCadence(clone(debuffIn(STORE, FLUTE))) as Debuff
    expect(healed.dot!.reschedulesPerTick).toBe(false)
    expect(healed.dot!.firstTickOffsetFrames).toBeUndefined()
  })

  it("leaves a debuff with no cadence of its own, and one whose interval was edited, alone", () => {
    const other = clone(debuffIn(STORE, UNTOUCHED))
    expect(healDotTickCadence(other)).toEqual(other)
    const edited = clone(debuffIn(STORE, SMOLDER))
    edited.dot!.tickIntervalFrames = 45
    expect(healDotTickCadence(edited)).toEqual(edited)
  })

  it("is idempotent, and never re-decides a copy that already states it", () => {
    const once = healDotTickCadence(clone(debuffIn(STORE, SMOLDER)))
    expect(healDotTickCadence(clone(once))).toEqual(once)
    const optedOut = clone(debuffIn(STORE, SMOLDER))
    optedOut.dot!.reschedulesPerTick = false
    expect(healDotTickCadence(optedOut)).toEqual(optedOut)
  })
})

describe("V7__dotTickCadence — through the chain", () => {
  it("is registered and is exactly what the v6 → v7 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V7__dotTickCadence)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 7 })!
    expect(result.applied).toEqual(["V7__dotTickCadence"])
    expect(result.blob.v).toBe(7)
    expect(debuffIn(result.blob, SMOLDER).dot!.reschedulesPerTick).toBe(true)
    expect(debuffIn(result.blob, UNTOUCHED)).toEqual(debuffIn(STORE, UNTOUCHED))
  })

  it("does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    V7__dotTickCadence.migrate(input)
    expect(input).toEqual(snapshot)
  })
})
