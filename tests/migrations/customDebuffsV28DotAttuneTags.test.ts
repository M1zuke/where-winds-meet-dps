import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import { V28__dotAttuneTags } from "../../src/migrations/customDebuffs/V28__dotAttuneTags"
import storeV19File from "./testCustomDebuffs/v19/store.json"
import storeV27File from "./testCustomDebuffs/v27/store.json"

type StoredDebuff = { id: string; dot?: Record<string, unknown> }
type Blob = RawCustomDebuffsBlob

const STORE = storeV27File as unknown as Blob
const DRONE_STORE_AT_V27 = runCustomDebuffMigrations(JSON.parse(JSON.stringify(storeV19File)), {
  toVersion: 27,
})!.blob as Blob
const DRONE_TAGS = ["attune:umbFrequentProjectile", "attune:umbSpecial"]

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const debuffsOf = (blob: Blob): StoredDebuff[] => blob.debuffs as StoredDebuff[]
const debuffIn = (blob: Blob, id: string): StoredDebuff =>
  debuffsOf(blob).find((debuff) => debuff.id === id)!
const withTag = (id: string, attuneTag: unknown): Blob => ({
  v: 27,
  debuffs: [{ id, dot: { skillType: "sustain", attuneTag } }],
})

describe("custom-debuffs v27 fixture", () => {
  it("is v27 and holds no dot with a single attuneTag string", () => {
    expect(STORE.v).toBe(V28__dotAttuneTags.to - 1)
    expect(debuffsOf(STORE).length).toBeGreaterThan(0)
  })

  it("has a walked drone capture that still stores the single tag", () => {
    const drones = debuffsOf(DRONE_STORE_AT_V27).filter((debuff) =>
      debuff.id.startsWith("debuff-silkbindJade-umbdrone"),
    )
    expect(drones).toHaveLength(6)
    for (const drone of drones) expect(drone.dot?.attuneTag).toBe("attune:umbFrequentProjectile")
  })
})

describe("V28__dotAttuneTags — called directly", () => {
  it("gives every seeded drone copy both tags and drops the single one", () => {
    const migrated = V28__dotAttuneTags.migrate(clone(DRONE_STORE_AT_V27)) as Blob
    expect(migrated.v).toBe(28)
    for (const drone of debuffsOf(migrated).filter((debuff) =>
      debuff.id.startsWith("debuff-silkbindJade-umbdrone"),
    )) {
      expect(drone.dot?.attuneTags, drone.id).toEqual(DRONE_TAGS)
      expect("attuneTag" in (drone.dot ?? {}), drone.id).toBe(false)
    }
  })

  it("moves any other single tag into a one-entry list", () => {
    const migrated = V28__dotAttuneTags.migrate(withTag("df-user", "attune:bleed")) as Blob
    expect(debuffIn(migrated, "df-user").dot).toEqual({
      skillType: "sustain",
      attuneTags: ["attune:bleed"],
    })
  })

  it("moves a deliberately different tag on a drone copy as it is", () => {
    const migrated = V28__dotAttuneTags.migrate(
      withTag("debuff-silkbindJade-umbdrone-20hit", "attune:fanQ"),
    ) as Blob
    expect(debuffIn(migrated, "debuff-silkbindJade-umbdrone-20hit").dot?.attuneTags).toEqual([
      "attune:fanQ",
    ])
  })

  it("drops a null or empty tag without adding a list", () => {
    for (const empty of [null, ""]) {
      const migrated = V28__dotAttuneTags.migrate(withTag("df-user", empty)) as Blob
      expect(debuffIn(migrated, "df-user").dot).toEqual({ skillType: "sustain" })
    }
  })

  it("leaves a debuff without the field untouched", () => {
    const migrated = V28__dotAttuneTags.migrate(clone(STORE)) as Blob
    expect(debuffsOf(migrated)).toEqual(debuffsOf(STORE))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(DRONE_STORE_AT_V27)
    const snapshot = clone(input)
    const once = V28__dotAttuneTags.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V28__dotAttuneTags.migrate(clone(once))).toEqual(once)
  })
})

describe("V28__dotAttuneTags — through the chain", () => {
  it("is registered and is exactly what the v27 → v28 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V28__dotAttuneTags)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 28 })!
    expect(result.applied).toEqual(["V28__dotAttuneTags"])
    expect(result.blob.v).toBe(28)
  })
})
