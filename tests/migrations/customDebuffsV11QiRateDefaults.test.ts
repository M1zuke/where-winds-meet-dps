import { describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
} from "../../src/migrations/customDebuffs"
import {
  V11__qiRateDefaults,
  healQiRateDefault,
} from "../../src/migrations/customDebuffs/V11__qiRateDefaults"
import type { Debuff } from "../../src/engine/debuff"
import storeV10File from "./testCustomDebuffs/v10/store.json"

const BLEED_TICK = "debuff-bellstrikeUmbra-bleed-tick"
const COMBUSTION = "debuff-mystic-combustion"
const SMOLDER = "debuff-mystic-smolder"

const STORE = storeV10File as unknown as { v: number; debuffs: Debuff[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: { debuffs: unknown[] }, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

const HEALED_IDS_AND_RATES: readonly [string, number][] = [
  [BLEED_TICK, 0.2],
  [COMBUSTION, 0.6],
  [SMOLDER, 0.6],
]

describe("the pre-V11 shape", () => {
  it("carries no qiRate yet", () => {
    for (const [id] of HEALED_IDS_AND_RATES)
      expect(debuffIn(STORE, id).dot!.qiRate, id).toBeUndefined()
  })
})

describe("healQiRateDefault", () => {
  it("adds the in-game rate to an untouched dot", () => {
    for (const [id, rate] of HEALED_IDS_AND_RATES) {
      const healed = healQiRateDefault(clone(debuffIn(STORE, id))) as Debuff
      expect(healed.dot!.qiRate, id).toBe(rate)
    }
  })

  it("does not double-heal a copy that already carries a qiRate", () => {
    for (const [id] of HEALED_IDS_AND_RATES) {
      const once = healQiRateDefault(clone(debuffIn(STORE, id)))
      const twice = healQiRateDefault(clone(once))
      expect(twice, id).toEqual(once)
    }
  })

  it("leaves a dot alone once its own coefficients no longer match the seeded shape", () => {
    const edited = debuffIn(STORE, BLEED_TICK)
    const withEditedDot: Debuff = {
      ...edited,
      dot: { ...edited.dot!, physMultiplier: edited.dot!.physMultiplier + 1 },
    }
    const healed = healQiRateDefault(clone(withEditedDot)) as Debuff
    expect(healed.dot!.qiRate).toBeUndefined()
  })

  it("leaves a debuff the migration does not target alone", () => {
    const untouched = debuffIn(STORE, BLEED_TICK)
    const generic: Debuff = { ...untouched, id: "not-a-target-debuff" }
    expect(healQiRateDefault(clone(generic))).toEqual(generic)
  })
})

describe("V11__qiRateDefaults — called directly", () => {
  it("heals every targeted debuff and leaves every other debuff untouched", () => {
    const before = clone(STORE)
    const after = V11__qiRateDefaults.migrate(before)
    expect(after.v).toBe(11)
    for (const [id, rate] of HEALED_IDS_AND_RATES) {
      expect(debuffIn(after, id).dot!.qiRate, id).toBe(rate)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V11__qiRateDefaults.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V11__qiRateDefaults.migrate(clone(once))).toEqual(once)
  })
})

describe("V11__qiRateDefaults — through the chain", () => {
  it("is registered and is exactly what the v10 → v11 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V11__qiRateDefaults)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 11 })!
    expect(result.applied).toEqual(["V11__qiRateDefaults"])
    expect(result.blob.v).toBe(11)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_DEBUFF_MIGRATIONS.filter((step) => step !== V11__qiRateDefaults)
    const result = runChain(withoutStep, 11, clone(STORE))!
    expect(result.applied).not.toContain("V11__qiRateDefaults")
    expect(debuffIn(result.blob, BLEED_TICK).dot!.qiRate).toBeUndefined()
  })
})

describe("every healed debuff survives the hydrator too, matching the live built-in's own rate", () => {
  it("lands each healed copy on exactly the live built-in's rate", async () => {
    const { builtinDebuffsForClass } = await import("../../src/engine/builtinLibrary")
    const result = runCustomDebuffMigrations(clone(STORE))!
    // bellstrikeUmbra's own debuff list also carries the shared mystic ones.
    const builtins = builtinDebuffsForClass("bellstrikeUmbra")
    for (const [id, rate] of HEALED_IDS_AND_RATES) {
      const healed = debuffIn(result.blob, id)
      const builtin = builtins.find((candidate) => candidate.id === id)!
      expect(healed.dot!.qiRate, id).toBe(rate)
      expect(builtin.dot!.qiRate, id).toBe(rate)
    }
  })
})
