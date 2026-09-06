import { beforeEach, describe, expect, it } from "vitest"
import {
  CUSTOM_DEBUFF_MIGRATIONS,
  LATEST_CUSTOM_DEBUFFS_VERSION,
  runCustomDebuffMigrations,
  type RawCustomDebuffsBlob,
} from "../../src/migrations/customDebuffs"
import {
  V4__mysticArtIds,
  migrateMysticDebuffReferences,
} from "../../src/migrations/customDebuffs/V4__mysticArtIds"
import { loadCustomDebuffs, loadCustomDebuffsForClass } from "../../src/storage"
import { MYSTIC_ARTS_CLASS_ID } from "../../src/engine/skill"
import type { Debuff } from "../../src/engine/debuff"
import storeV3File from "./testCustomDebuffs/v3/store.json"

const DEBUFFS_KEY = "wwm.customDebuffs"
const UMBRA_COMBUSTION = "debuff-bellstrikeUmbra-combustion"
const UMBRA_DARK_FIRE = "debuff-bellstrikeUmbra-dark-fire"
const SPLENDOR_DARK_FIRE = "debuff-bellstrikeSplendor-dark-fire"
const BLEED = "debuff-bellstrikeUmbra-bleed-tick"
const USER_AUTHORED = "db-user-authored-ember"
const STORE = storeV3File as unknown as { v: number; debuffs: Debuff[] }

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const debuffIn = (blob: { debuffs: unknown[] }, id: string): Debuff =>
  (blob.debuffs as Debuff[]).find((debuff) => debuff.id === id)!

describe("custom-debuffs v3 fixture", () => {
  it("is v3 and still stores mystic-art debuffs under the class they were opened from", () => {
    expect(STORE.v).toBe(V4__mysticArtIds.to - 1)
    expect(debuffIn(STORE, UMBRA_COMBUSTION).classId).toBe("bellstrikeUmbra")
    expect(debuffIn(STORE, UMBRA_DARK_FIRE).classId).toBe("bellstrikeUmbra")
    expect(debuffIn(STORE, SPLENDOR_DARK_FIRE).classId).toBe("bellstrikeSplendor")
  })

  it("holds a user-authored debuff whose references name the class-prefixed ids", () => {
    const authored = debuffIn(STORE, USER_AUTHORED)
    expect(authored.dot?.sourceSkillId).toBe("bellstrikeUmbra-fire-breath-1-hit")
    expect(authored.detonation?.skillId).toBe("bellstrikeUmbra-dragon-head")
  })
})

describe("migrateMysticDebuffReferences", () => {
  it("moves the tick source and the detonation skill onto the shared ids", () => {
    const healed = migrateMysticDebuffReferences(clone(debuffIn(STORE, USER_AUTHORED))) as Debuff
    expect(healed.dot?.sourceSkillId).toBe("mystic-fire-breath-1-hit")
    expect(healed.detonation?.skillId).toBe("mystic-dragon-head")
  })

  it("leaves a debuff that references nothing mystic untouched", () => {
    const bleed = clone(debuffIn(STORE, BLEED))
    expect(migrateMysticDebuffReferences(bleed)).toEqual(bleed)
  })
})

describe("V4__mysticArtIds — called directly", () => {
  const after = V4__mysticArtIds.migrate(clone(STORE))

  it("lands the first copy of a mystic-art debuff on the shared id and class", () => {
    expect(after.v).toBe(4)
    expect(debuffIn(after, UMBRA_COMBUSTION)).toBeUndefined()
    expect(debuffIn(after, "debuff-mystic-combustion").classId).toBe(MYSTIC_ARTS_CLASS_ID)
    expect(debuffIn(after, "debuff-mystic-smolder").classId).toBe(MYSTIC_ARTS_CLASS_ID)
    expect(debuffIn(after, "debuff-mystic-smolder").name).toBe("Smolder")
  })

  it("keeps a second class copy of the same debuff as the class-bound entry it already was", () => {
    expect(debuffIn(after, SPLENDOR_DARK_FIRE)).toEqual(debuffIn(STORE, SPLENDOR_DARK_FIRE))
  })

  it("keeps a user-authored debuff's identity and moves only its references", () => {
    const authored = debuffIn(after, USER_AUTHORED)
    expect(authored.classId).toBe("bellstrikeUmbra")
    expect(authored.dot?.sourceSkillId).toBe("mystic-fire-breath-1-hit")
    expect(authored.detonation?.skillId).toBe("mystic-dragon-head")
  })

  it("leaves a class-owned copy untouched", () => {
    expect(debuffIn(after, BLEED)).toEqual(debuffIn(STORE, BLEED))
  })

  it("is idempotent and does not mutate its input", () => {
    const input = clone(STORE)
    const snapshot = clone(input)
    const once = V4__mysticArtIds.migrate(input)
    expect(input).toEqual(snapshot)
    expect(V4__mysticArtIds.migrate(clone(once))).toEqual(once)
  })
})

describe("V4__mysticArtIds — through the chain", () => {
  beforeEach(() => localStorage.clear())

  it("is registered and is exactly what the v3 → v4 hop applies", () => {
    expect(CUSTOM_DEBUFF_MIGRATIONS).toContain(V4__mysticArtIds)
    const result = runCustomDebuffMigrations(clone(STORE), { toVersion: 4 })!
    expect(result.applied).toEqual(["V4__mysticArtIds"])
    expect(result.blob.v).toBe(4)
  })

  it("loadCustomDebuffs persists the store at the latest version and every class sees the shared copy", () => {
    localStorage.setItem(DEBUFFS_KEY, JSON.stringify(STORE))
    const loaded = loadCustomDebuffs()
    expect(loaded.map((debuff) => debuff.id)).toContain("debuff-mystic-combustion")
    const persisted = JSON.parse(localStorage.getItem(DEBUFFS_KEY)!) as RawCustomDebuffsBlob
    expect(persisted.v).toBe(LATEST_CUSTOM_DEBUFFS_VERSION)
    for (const classId of ["silkbindJade", "bellstrikeUmbra"]) {
      expect(loadCustomDebuffsForClass(classId).map((debuff) => debuff.id)).toContain(
        "debuff-mystic-combustion",
      )
    }
    expect(loadCustomDebuffsForClass("silkbindJade").map((debuff) => debuff.id)).not.toContain(
      SPLENDOR_DARK_FIRE,
    )
  })
})
