import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V20__jadeDroneDirectHitFlight,
  healJadeDroneDot,
} from "../../src/migrations/customDebuffs/V20__jadeDroneDirectHitFlight"
import { DEBUFFS } from "../../src/data/skills/silkbind-jade/debuffs"
import type { Debuff } from "../../src/engine/debuff"
import storeV19File from "./testCustomDebuffs/v19/store.json"

const STORE = storeV19File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }
const DRONE_IDS = DEBUFFS.filter((debuff) => /umbdrone/.test(debuff.id)).map((debuff) => debuff.id)
const UNTOUCHED_ID = "debuff-silkbindJade-bitter-season-tick"
const USER_AUTHORED_ID = "df-user-authored-gust"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

const builtinOf = (id: string): Debuff => DEBUFFS.find((debuff) => debuff.id === id)!

describe("custom-debuffs v19 fixture", () => {
  it("is v19 and types every drone copy as a sustain tick with the Qi override", () => {
    expect(STORE.v).toBe(V20__jadeDroneDirectHitFlight.to - 1)
    for (const id of DRONE_IDS)
      expect(debuffIn(STORE, id).dot, id).toMatchObject({
        skillType: "sustain",
        qiHitKind: "direct",
      })
  })
})

describe("V20__jadeDroneDirectHitFlight — called directly", () => {
  it("lands every untouched drone copy's dot on the live debuff", () => {
    const after = V20__jadeDroneDirectHitFlight.migrate(clone(STORE))
    expect(after.v).toBe(20)
    for (const id of DRONE_IDS) {
      const healed = debuffIn(after, id).dot!
      const builtin = builtinOf(id).dot!
      expect(healed.skillType, id).toBe(builtin.skillType)
      expect(healed.directHit, id).toBe(builtin.directHit)
      expect(healed.projectile, id).toEqual(builtin.projectile)
      expect(healed.qiHitKind, id).toBeUndefined()
    }
  })

  it("keeps a dot the copy was edited to and every other debuff", () => {
    const edited = clone(STORE)
    debuffIn(edited, DRONE_IDS[1]!).dot!.skillType = "mystic"
    const after = V20__jadeDroneDirectHitFlight.migrate(edited)
    expect(debuffIn(after, DRONE_IDS[1]!).dot).toEqual(debuffIn(edited, DRONE_IDS[1]!).dot)
    for (const id of [UNTOUCHED_ID, USER_AUTHORED_ID])
      expect(debuffIn(after, id), id).toEqual(debuffIn(STORE, id))
  })

  it("leaves a copy that already carries a projectile alone", () => {
    const seeded = debuffIn(STORE, DRONE_IDS[0]!)
    const carrying = {
      ...seeded,
      dot: { ...seeded.dot, projectile: { speedMetersPerSecond: 10, maxTravelFrames: 5 } },
    }
    expect(healJadeDroneDot(clone(carrying))).toEqual(carrying)
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V20__jadeDroneDirectHitFlight.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V20__jadeDroneDirectHitFlight.migrate(clone(once))).toEqual(once)
  })
})

describe("V20__jadeDroneDirectHitFlight — through the chain", () => {
  it("is registered and is exactly what the v19 → v20 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V20__jadeDroneDirectHitFlight)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 20 })!
    expect(result.applied).toEqual(["V20__jadeDroneDirectHitFlight"])
    expect(result.blob.v).toBe(20)
  })
})
