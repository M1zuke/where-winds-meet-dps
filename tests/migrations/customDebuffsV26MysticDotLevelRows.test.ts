import { describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V26__mysticDotLevelRows,
  healDot,
} from "../../src/migrations/customDebuffs/V26__mysticDotLevelRows"
import { MYSTIC_DEBUFFS } from "../../src/data/skills/mystic"
import { isLevelRows } from "../../src/engine/skill"
import type { Debuff } from "../../src/engine/debuff"
import storeV25File from "./testCustomDebuffs/v25/store.json"

const STORE = storeV25File as unknown as RawCustomDebuffsBlob & { debuffs: Debuff[] }
const SEEDED_IDS = [
  "debuff-mystic-toad-poison",
  "debuff-mystic-toad-poison-fury",
  "debuff-mystic-combustion",
]
const EDITED_ID = "debuff-mystic-smolder"
const USER_AUTHORED_ID = "df-user-authored-gash"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const debuffIn = (blob: RawCustomDebuffsBlob, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!
const builtinOf = (id: string): Debuff => MYSTIC_DEBUFFS.find((debuff) => debuff.id === id)!

describe("custom-debuffs v25 fixture", () => {
  it("is v25 and stores seeded mystic copies with no level rows", () => {
    expect(STORE.v).toBe(V26__mysticDotLevelRows.to - 1)
    for (const id of [...SEEDED_IDS, EDITED_ID]) {
      expect(debuffIn(STORE, id).dot!.levelRows, id).toBeUndefined()
    }
  })
})

describe("healDot", () => {
  it.each(SEEDED_IDS)("gives the untouched %s copy the built-in's own level rows", (id) => {
    const healed = healDot(clone(debuffIn(STORE, id))) as Debuff
    expect(healed.dot!.levelRows).toEqual(builtinOf(id).dot!.levelRows)
    expect(isLevelRows(healed.dot!.levelRows)).toBe(true)
  })

  it("puts the branch form's tick on tier 6 only", () => {
    const healed = healDot(clone(debuffIn(STORE, "debuff-mystic-toad-poison-fury"))) as Debuff
    expect(Object.keys(healed.dot!.levelRows!.rows)).toEqual(["6"])
  })

  it("keeps a copy whose tick row was edited", () => {
    const edited = debuffIn(STORE, EDITED_ID)
    expect(healDot(clone(edited))).toEqual(edited)
  })

  it("leaves a user-authored debuff alone and is idempotent", () => {
    const authored = debuffIn(STORE, USER_AUTHORED_ID)
    expect(healDot(clone(authored))).toEqual(authored)
    for (const id of SEEDED_IDS) {
      const once = healDot(clone(debuffIn(STORE, id)))
      expect(healDot(clone(once)), id).toEqual(once)
    }
  })
})

describe("V26__mysticDotLevelRows — through the chain", () => {
  it("is registered and is exactly what the v25 → v26 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V26__mysticDotLevelRows)
    const hopped = runCustomDebuffMigrations(clone(STORE), { toVersion: 26 })!.blob
    expect(hopped.v).toBe(26)
    expect(hopped).toEqual(V26__mysticDotLevelRows.migrate(clone(STORE)))
  })
})
