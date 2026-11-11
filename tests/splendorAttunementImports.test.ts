import { beforeEach, describe, expect, it } from "vitest"
import { exportProfile, importCustomSkill, importProfile, loadProfiles } from "../src/storage"
import { makeSkill } from "../src/engine/skill"
import type { StoredProfile } from "../src/engine/types"
import splendorFile from "./migrations/testProfiles/v34/bellstrikeSplendor.json"

const SPLENDOR = (splendorFile as unknown as { v: number; profile: StoredProfile }).profile

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

function withFirstAttunement(profile: StoredProfile, attunement: string): StoredProfile {
  const inventory = profile.inputs.inventory.map((piece, index) =>
    index === 0 ? { ...piece, attunement } : piece,
  )
  return { ...profile, inputs: { ...profile.inputs, inventory } }
}

describe("importing a profile that holds a shared weapon-art attunement id", () => {
  beforeEach(() => localStorage.clear())

  it("renames it for a bare Splendor profile", () => {
    const imported = importProfile(JSON.stringify(withFirstAttunement(clone(SPLENDOR), "swordQ")))
    expect(imported.inputs.inventory[0].attunement).toBe("namelessSwordQ")
  })

  it("renames it for a wrapped v34 Splendor profile, through the chain", () => {
    const text = JSON.stringify({ v: 34, profile: withFirstAttunement(clone(SPLENDOR), "swordQ") })
    expect(importProfile(text).inputs.inventory[0].attunement).toBe("namelessSwordQ")
  })

  it("keeps it for a wrapped current-version Splendor profile", () => {
    const current = exportProfile(withFirstAttunement(clone(SPLENDOR), "swordQ"))
    expect(importProfile(current).inputs.inventory[0].attunement).toBe("swordQ")
  })

  it("keeps an Umbra id on a bare Umbra profile", () => {
    const umbra = {
      ...withFirstAttunement(clone(SPLENDOR), "swordQ"),
      inputs: { ...SPLENDOR.inputs, classId: "bellstrikeUmbra" },
    }
    const imported = importProfile(
      JSON.stringify({
        ...umbra,
        inputs: {
          ...umbra.inputs,
          inventory: withFirstAttunement(SPLENDOR, "swordQ").inputs.inventory,
        },
      }),
    )
    expect(imported.inputs.inventory[0].attunement).toBe("swordQ")
  })

  it("renames it on the legacy blob a first load migrates", () => {
    const legacyInputs = {
      ...SPLENDOR.inputs,
      inventory: withFirstAttunement(SPLENDOR, "spearCharged").inputs.inventory,
    }
    localStorage.setItem("wwm.inputs", JSON.stringify({ v: 5, inputs: legacyInputs }))
    const loaded = loadProfiles().profiles[0]
    expect(loaded.inputs.inventory[0].attunement).toBe("namelessSpearCharged")
  })
})

describe("importing a Skill Editor skill tagged with a shared attunement", () => {
  function exported(): string {
    const skill = makeSkill("bellstrikeUmbra", { name: "Probe" })
    return JSON.stringify({ ...skill, tags: ["weapon:sword", "attune:swordQ"] })
  }

  it("retags it when the target is Splendor", () => {
    const imported = importCustomSkill(exported(), "bellstrikeSplendor")
    expect(imported.tags).toContain("attune:namelessSwordQ")
    expect(imported.tags).not.toContain("attune:swordQ")
  })

  it("keeps the tag when the target is Umbra", () => {
    expect(importCustomSkill(exported(), "bellstrikeUmbra").tags).toContain("attune:swordQ")
  })
})
