import { beforeEach, describe, expect, it } from "vitest"
import {
  exportProfile,
  importProfile,
  loadCustomSkills,
  loadProfiles,
  saveProfiles,
} from "../src/storage"
import { LATEST_CUSTOM_SKILLS_VERSION } from "../src/migrations/customSkills"
import { builtinSkillsForClass } from "../src/engine/builtinLibrary"
import type { Skill } from "../src/engine/skill"
import type { StoredProfile } from "../src/engine/types"
import jadeFile from "./migrations/testProfiles/v34/silkbindJade.json"

const JADE = (jadeFile as unknown as { v: number; profile: StoredProfile }).profile
const APRICOT_ID = "silkbindJade-apricot-heaven-normal"

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

function withAttunements(profile: StoredProfile, attunements: string[]): StoredProfile {
  const inventory = profile.inputs.inventory.map((piece, index) =>
    index < attunements.length ? { ...piece, attunement: attunements[index] } : piece,
  )
  return { ...profile, inputs: { ...profile.inputs, inventory } }
}

const attunementsOf = (profile: StoredProfile): string[] =>
  profile.inputs.inventory.map((piece) => piece.attunement).slice(0, 3)

describe("a stored Vernal Umbrella attunement id is kept as stored", () => {
  beforeEach(() => localStorage.clear())

  it("survives a load of the saved profiles", () => {
    const profile = withAttunements(clone(JADE), [
      "umbCharged",
      "umbSpecial",
      "umbFrequentProjectile",
    ])
    saveProfiles({ profiles: [profile], activeId: profile.id })
    expect(attunementsOf(loadProfiles().profiles[0])).toEqual([
      "umbCharged",
      "umbSpecial",
      "umbFrequentProjectile",
    ])
  })

  it("survives a bare profile import", () => {
    const bare = withAttunements(clone(JADE), ["umbCharged", "umbSpecial"])
    expect(attunementsOf(importProfile(JSON.stringify(bare))).slice(0, 2)).toEqual([
      "umbCharged",
      "umbSpecial",
    ])
  })

  it("survives a wrapped current-version profile import", () => {
    const wrapped = exportProfile(withAttunements(clone(JADE), ["umbCharged", "umbSpecial"]))
    expect(attunementsOf(importProfile(wrapped)).slice(0, 2)).toEqual(["umbCharged", "umbSpecial"])
  })
})

describe("a stored Apricot Heaven copy keeps its Charged tag", () => {
  beforeEach(() => localStorage.clear())

  it("through loadCustomSkills", () => {
    const builtin = builtinSkillsForClass("silkbindJade").find((skill) => skill.id === APRICOT_ID)!
    const copy: Skill = { ...clone(builtin), tags: builtin.tags }
    localStorage.setItem(
      "wwm.customSkills",
      JSON.stringify({ v: LATEST_CUSTOM_SKILLS_VERSION, skills: [copy] }),
    )
    const loaded = loadCustomSkills().find((skill) => skill.id === APRICOT_ID)!
    const attuneTags = (loaded.tags ?? []).filter((tag) => tag.startsWith("attune:"))
    expect(attuneTags).toEqual(["attune:umbCharged"])
  })
})
