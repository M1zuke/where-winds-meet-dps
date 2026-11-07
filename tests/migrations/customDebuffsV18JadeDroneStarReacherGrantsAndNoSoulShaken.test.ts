import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import { V18__jadeDroneStarReacherGrantsAndNoSoulShaken } from "../../src/migrations/customDebuffs/V18__jadeDroneStarReacherGrantsAndNoSoulShaken"
import { DEBUFFS } from "../../src/data/skills/silkbind-jade/debuffs"
import type { Debuff } from "../../src/engine/debuff"
import storeV17File from "./testCustomDebuffs/v17/store.json"

const STORE = storeV17File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }
const EDITED_DRONE_ID = "debuff-silkbindJade-umbdrone-16hit"
const BITTER_SEASON_TICK_ID = "debuff-silkbindJade-bitter-season-tick"
const HEALED_IDS = DEBUFFS.map((debuff) => debuff.id)

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

const builtinOf = (id: string): Debuff => DEBUFFS.find((debuff) => debuff.id === id)!

describe("custom-debuffs v17 fixture", () => {
  it("is v17 and stores the drone and the Bitter Season tick with the old lists", () => {
    expect(STORE.v).toBe(V18__jadeDroneStarReacherGrantsAndNoSoulShaken.to - 1)
    expect(debuffIn(STORE, "debuff-silkbindJade-umbdrone").triggersBuffs).toEqual(["lingeringBone"])
    expect(debuffIn(STORE, BITTER_SEASON_TICK_ID).receives).toEqual(["soulShaken"])
  })
})

describe("V18__jadeDroneStarReacherGrantsAndNoSoulShaken — called directly", () => {
  it("lands every untouched copy on the live debuff's lists", () => {
    const after = V18__jadeDroneStarReacherGrantsAndNoSoulShaken.migrate(clone(STORE))
    expect(after.v).toBe(18)
    for (const id of HEALED_IDS) {
      if (id === EDITED_DRONE_ID) continue
      expect(debuffIn(after, id).triggersBuffs, id).toEqual(builtinOf(id).triggersBuffs)
      expect(debuffIn(after, id).receives, id).toEqual(builtinOf(id).receives)
    }
  })

  it("keeps a list the copy was edited to and every other debuff", () => {
    const after = V18__jadeDroneStarReacherGrantsAndNoSoulShaken.migrate(clone(STORE))
    expect(debuffIn(after, EDITED_DRONE_ID).triggersBuffs).toEqual(
      debuffIn(STORE, EDITED_DRONE_ID).triggersBuffs,
    )
    expect(debuffIn(after, EDITED_DRONE_ID).receives).toEqual(builtinOf(EDITED_DRONE_ID).receives)
    for (const debuff of STORE.debuffs) {
      if (HEALED_IDS.includes(debuff.id)) continue
      expect(debuffIn(after, debuff.id), debuff.id).toEqual(debuff)
    }
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V18__jadeDroneStarReacherGrantsAndNoSoulShaken.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V18__jadeDroneStarReacherGrantsAndNoSoulShaken.migrate(clone(once))).toEqual(once)
  })
})

describe("V18__jadeDroneStarReacherGrantsAndNoSoulShaken — through the chain", () => {
  it("is registered and is exactly what the v17 → v18 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V18__jadeDroneStarReacherGrantsAndNoSoulShaken)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 18 })!
    expect(result.applied).toEqual(["V18__jadeDroneStarReacherGrantsAndNoSoulShaken"])
    expect(result.blob.v).toBe(18)
  })
})
