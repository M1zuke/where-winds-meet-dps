import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
} from "../../src/migrations/customDebuffs"
import {
  V9__sharedDotRecalibration,
  recalibrateSharedDot,
} from "../../src/migrations/customDebuffs/V9__sharedDotRecalibration"
import type { Debuff } from "../../src/engine/debuff"
import storeV8File from "./testCustomDebuffs/v8/store.json"

const COMBUSTION = "debuff-mystic-combustion"
const SMOLDER = "debuff-mystic-smolder"
const TOAD_POISON = "debuff-mystic-toad-poison"
const FLUTE_RIPPLE = "debuff-mystic-flute-ripple"
const BITTER_SEASON_TICK = "debuff-bellstrikeUmbra-bitter-season-tick"
const EDITED_SMOLDER = "db-user-edited-smolder"
const USER_AUTHORED = "db-user-authored-fire"
const STORE = storeV8File as unknown as { v: number; debuffs: Debuff[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: { debuffs: unknown[] }, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

// This hop's own targets — not the live built-in, which a later hop could
// move past (docs/MIGRATIONS.md § "Migration tests" rule 4: a step's test
// never asserts the latest shape).
const v9Targets: Record<
  string,
  { physMultiplier: number; attributeMultiplier: number; physFixed: number }
> = {
  [COMBUSTION]: { physMultiplier: 0.29545, attributeMultiplier: 0.443175, physFixed: 44.62 },
  [SMOLDER]: { physMultiplier: 0.23578, attributeMultiplier: 0.35367, physFixed: 35.95 },
  [TOAD_POISON]: { physMultiplier: 1.62189, attributeMultiplier: 2.432835, physFixed: 243.7 },
  [BITTER_SEASON_TICK]: { physMultiplier: 0.02, attributeMultiplier: 0, physFixed: 0 },
}

describe("custom-debuffs v8 fixture", () => {
  it("is v8 and still stores the superseded coefficients and hit types the built-ins no longer carry", () => {
    expect(STORE.v).toBe(V9__sharedDotRecalibration.to - 1)
    expect(debuffIn(STORE, COMBUSTION).dot!.attributeMultiplier).toBe(0.29545)
    expect(debuffIn(STORE, SMOLDER).dot!.physMultiplier).toBe(0.24991)
    expect(debuffIn(STORE, TOAD_POISON).dot!.attributeMultiplier).toBe(1.62189)
    expect(debuffIn(STORE, FLUTE_RIPPLE).dot!.skillType).toBe("sustain")
    expect(debuffIn(STORE, BITTER_SEASON_TICK).dot!.physMultiplier).toBe(0.15)
  })
})

describe("recalibrateSharedDot", () => {
  it("rewrites an untouched Combustion, Smolder, Toad Poison and Bitter Season tick to this hop's own target", () => {
    for (const id of [COMBUSTION, SMOLDER, TOAD_POISON, BITTER_SEASON_TICK]) {
      const healed = recalibrateSharedDot(id, clone(debuffIn(STORE, id).dot)) as Debuff["dot"]
      const target = v9Targets[id]
      expect(healed!.physMultiplier, id).toBe(target.physMultiplier)
      expect(healed!.attributeMultiplier, id).toBe(target.attributeMultiplier)
      expect(healed!.physFixed, id).toBe(target.physFixed)
    }
  })

  it("leaves an edited tick, another debuff and a missing dot alone", () => {
    const edited = clone(debuffIn(STORE, EDITED_SMOLDER).dot)
    expect(recalibrateSharedDot(SMOLDER, edited)).toEqual(edited)
    const other = clone(debuffIn(STORE, USER_AUTHORED).dot)
    expect(recalibrateSharedDot(USER_AUTHORED, other)).toEqual(other)
    expect(recalibrateSharedDot(SMOLDER, null)).toBeNull()
  })
})

describe("V9__sharedDotRecalibration — called directly", () => {
  it("converts Toad Poison and Flute Ripple to direct hits and clears their receives", () => {
    const after = V9__sharedDotRecalibration.migrate(clone(STORE))
    for (const id of [TOAD_POISON, FLUTE_RIPPLE]) {
      const healed = debuffIn(after, id)
      expect(healed.dot!.skillType, id).toBe("mystic")
      expect((healed.dot as unknown as { directHit?: boolean }).directHit, id).toBe(true)
      expect(healed.receives, id).toEqual([])
    }
  })

  it("rewrites every seeded copy's coefficients and nothing else", () => {
    const after = V9__sharedDotRecalibration.migrate(clone(STORE))
    expect(after.v).toBe(9)
    for (const id of [COMBUSTION, SMOLDER, TOAD_POISON, BITTER_SEASON_TICK]) {
      const { dot: _beforeDot, receives: _beforeReceives, ...restBefore } = debuffIn(STORE, id)
      const { dot, receives: _afterReceives, ...restAfter } = debuffIn(after, id)
      void _beforeDot
      void _beforeReceives
      void _afterReceives
      expect(restAfter).toEqual(restBefore)
      expect(dot).not.toEqual(debuffIn(STORE, id).dot)
    }
    expect(debuffIn(after, EDITED_SMOLDER)).toEqual(debuffIn(STORE, EDITED_SMOLDER))
    expect(debuffIn(after, USER_AUTHORED)).toEqual(debuffIn(STORE, USER_AUTHORED))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V9__sharedDotRecalibration.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V9__sharedDotRecalibration.migrate(clone(once))).toEqual(once)
  })
})

describe("V9__sharedDotRecalibration — through the chain", () => {
  it("is registered and is exactly what the v8 → v9 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V9__sharedDotRecalibration)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 9 })!
    expect(result.applied).toEqual(["V9__sharedDotRecalibration"])
    expect(result.blob.v).toBe(9)
  })
})
