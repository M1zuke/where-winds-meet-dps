import { describe, expect, it } from "vitest"
import { runChain } from "../../src/migrations/chain"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
} from "../../src/migrations/customDebuffs"
import {
  V12__droneLingeringBoneDoubling,
  healDroneLingeringBoneDoubling,
} from "../../src/migrations/customDebuffs/V12__droneLingeringBoneDoubling"
import type { Debuff } from "../../src/engine/debuff"
import storeV11File from "./testCustomDebuffs/v11/store.json"

const DRONE_12HIT = "debuff-silkbindJade-umbdrone-12hit"
const DRONE_20HIT = "debuff-silkbindJade-umbdrone-20hit"
const DRONE_DEFAULT = "debuff-silkbindJade-umbdrone"
const HEALED_IDS = [DRONE_12HIT, DRONE_20HIT] as const
const EXPECTED_ADDITIONAL_TICKS = { offsetsFrames: [9], requiresBuff: "lingeringBone" }

const STORE = storeV11File as unknown as { v: number; debuffs: Debuff[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: { debuffs: unknown[] }, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

describe("the pre-V12 shape", () => {
  it("carries no additionalTicks yet on the fixed hit-count variants", () => {
    for (const id of HEALED_IDS)
      expect(debuffIn(STORE, id).dot!.additionalTicks, id).toBeUndefined()
  })
})

describe("healDroneLingeringBoneDoubling", () => {
  it("adds the extra-bullet rule to an untouched dot", () => {
    for (const id of HEALED_IDS) {
      const healed = healDroneLingeringBoneDoubling(clone(debuffIn(STORE, id))) as Debuff
      expect(healed.dot!.additionalTicks, id).toEqual(EXPECTED_ADDITIONAL_TICKS)
    }
  })

  it("does not double-heal a copy that already carries additionalTicks", () => {
    for (const id of HEALED_IDS) {
      const once = healDroneLingeringBoneDoubling(clone(debuffIn(STORE, id)))
      const twice = healDroneLingeringBoneDoubling(clone(once))
      expect(twice, id).toEqual(once)
    }
  })

  it("leaves a dot alone once its own coefficients no longer match the seeded shape", () => {
    const edited = debuffIn(STORE, DRONE_12HIT)
    const withEditedDot: Debuff = {
      ...edited,
      dot: { ...edited.dot!, physMultiplier: edited.dot!.physMultiplier + 1 },
    }
    const healed = healDroneLingeringBoneDoubling(clone(withEditedDot)) as Debuff
    expect(healed.dot!.additionalTicks).toBeUndefined()
  })

  it("leaves the resource-gated default drone alone, since it already has the rule", () => {
    const untouched = debuffIn(STORE, DRONE_DEFAULT)
    const healed = healDroneLingeringBoneDoubling(clone(untouched))
    expect(healed).toEqual(untouched)
  })

  it("leaves a debuff the migration does not target alone", () => {
    const untouched = debuffIn(STORE, DRONE_12HIT)
    const generic: Debuff = { ...untouched, id: "not-a-target-debuff" }
    expect(healDroneLingeringBoneDoubling(clone(generic))).toEqual(generic)
  })
})

describe("V12__droneLingeringBoneDoubling — called directly", () => {
  it("heals every targeted debuff and leaves every other debuff untouched", () => {
    const before = clone(STORE)
    const after = V12__droneLingeringBoneDoubling.migrate(before)
    expect(after.v).toBe(12)
    for (const id of HEALED_IDS) {
      expect(debuffIn(after, id).dot!.additionalTicks, id).toEqual(EXPECTED_ADDITIONAL_TICKS)
    }
    expect(debuffIn(after, DRONE_DEFAULT)).toEqual(debuffIn(before, DRONE_DEFAULT))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V12__droneLingeringBoneDoubling.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V12__droneLingeringBoneDoubling.migrate(clone(once))).toEqual(once)
  })
})

describe("V12__droneLingeringBoneDoubling — through the chain", () => {
  it("is registered and is exactly what the v11 → v12 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V12__droneLingeringBoneDoubling)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 12 })!
    expect(result.applied).toEqual(["V12__droneLingeringBoneDoubling"])
    expect(result.blob.v).toBe(12)
  })

  it("removing the step from the registry leaves the pre-migration shape untouched", () => {
    const withoutStep = CUSTOM_DEBUFF_MIGRATIONS.filter(
      (step) => step !== V12__droneLingeringBoneDoubling,
    )
    const result = runChain(withoutStep, 12, clone(STORE))!
    expect(result.applied).not.toContain("V12__droneLingeringBoneDoubling")
    expect(debuffIn(result.blob, DRONE_12HIT).dot!.additionalTicks).toBeUndefined()
  })
})

describe("every healed debuff survives the hydrator too, matching the live built-in's own rule", () => {
  it("lands each healed copy on exactly the live built-in's additionalTicks", async () => {
    const { builtinDebuffsForClass } = await import("../../src/engine/builtinLibrary")
    const result = runCustomDebuffMigrations(clone(STORE))!
    const builtins = builtinDebuffsForClass("silkbindJade")
    for (const id of HEALED_IDS) {
      const healed = debuffIn(result.blob, id)
      const builtin = builtins.find((candidate) => candidate.id === id)!
      expect(healed.dot!.additionalTicks, id).toEqual(builtin.dot!.additionalTicks)
    }
  })
})
