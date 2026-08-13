import { afterEach, describe, expect, it, beforeEach } from "vitest"
import {
  saveInputs,
  loadInputs,
  clearSavedInputs,
  initialInputs,
  migrateSeededSkillIds,
  saveCustomSkill,
  loadCustomSkillsForClass,
  saveCustomRotation,
  loadCustomRotations,
  loadProfiles,
  loadCustomBuffs,
  loadCustomDebuffs,
  saveProfiles,
  exportProfile,
  importProfile,
} from "../src/storage"
import { defaultInputs } from "../src/engine/defaults"
import { builtinSkillsForClass } from "../src/engine/builtinLibrary"
import { seedSkillFromBuiltin } from "../src/engine/skill"
import { makeSkill } from "../src/engine/skill"
import { makeRotation, makeStep } from "../src/engine/rotation"
import { computeGearContribution } from "../src/engine/gearStats"
import {
  DERIVED_STAT_FIELDS,
  withDerivedStats,
  withZeroedDerivedStats,
} from "../src/engine/derivedInputs"
import { LATEST_PROFILES_VERSION } from "../src/migrations"
import { SET_ID } from "../src/data/sets/ids"
import { kvStore } from "../src/kvStore"
import { EMPTY_EQUIPPED } from "../src/engine/types"
import type { GearPiece, Inputs, StoredProfile } from "../src/engine/types"
import { CLASS_IDS } from "../src/definitions/classes/registry"
import { getDefaultTalentsForClass } from "../src/definitions/baseStats"
import { runEngine } from "../src/engine/dps"
import { applyArmorSet, applyBowSet } from "../src/engine/panel"

type StoredGearPiece = Omit<GearPiece, "words"> & {
  words: readonly { word: string; value: number; retuned: boolean }[]
}

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
  })

  it("loadInputs returns null when nothing is saved", () => {
    expect(loadInputs()).toBeNull()
  })

  it("saveInputs round-trips faithfully", () => {
    const next: Inputs = {
      ...defaultInputs,
      precision: 0.42,
      mindMethods: [
        { name: "insightfulStrike", stacks: "tier 6" },
        { name: "moraleChant", stacks: "tier 5" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ],
    }
    saveInputs(next)
    const loaded = loadInputs()
    expect(loaded).not.toBeNull()
    expect(loaded?.precision).toBe(0.42)
    expect(loaded?.mindMethods[1]).toEqual({ name: "moraleChant", stacks: "tier 5" })
  })

  it("clearSavedInputs removes the entry", () => {
    saveInputs(defaultInputs)
    expect(loadInputs()).not.toBeNull()
    clearSavedInputs()
    expect(loadInputs()).toBeNull()
  })

  it("initialInputs falls back to defaults when nothing is saved", () => {
    expect(initialInputs()).toEqual(defaultInputs)
  })

  it("initialInputs returns the saved blob when present", () => {
    const next: Inputs = { ...defaultInputs, set: SET_ID.swallowcall }
    saveInputs(next)
    expect(initialInputs().set).toBe(SET_ID.swallowcall)
  })

  it("loadInputs is null when the saved blob is malformed", () => {
    localStorage.setItem("wwm.inputs", "not-json")
    expect(loadInputs()).toBeNull()
  })

  it("loadInputs is null when the saved version doesn't match", () => {
    localStorage.setItem("wwm.inputs", JSON.stringify({ v: 999, inputs: defaultInputs }))
    expect(loadInputs()).toBeNull()
  })
})

describe("profiles carry selections only — derived stats are never persisted", () => {
  const PROFILES_KEY = "wwm.profiles"

  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  function makeProfile(id: string, inputs: Inputs): StoredProfile {
    return { id, name: "Test", inputs }
  }

  it("saveProfiles writes selections but none of the derived stat fields", () => {
    const profile = makeProfile("p1", withDerivedStats(defaultInputs))
    saveProfiles({ profiles: [profile], activeId: profile.id })

    const persisted = JSON.parse(localStorage.getItem(PROFILES_KEY)!)
    const persistedInputs = persisted.profiles[0].inputs as Record<string, unknown>
    for (const field of DERIVED_STAT_FIELDS) {
      expect(field in persistedInputs, `${field} leaked into the saved blob`).toBe(false)
    }
    expect(persistedInputs.classId).toBe(defaultInputs.classId)
    expect(persistedInputs.breakthrough).toBe(defaultInputs.breakthrough)
    expect(persistedInputs.arsenal).toBe(defaultInputs.arsenal)
    expect(persistedInputs.set).toBe(defaultInputs.set)
    expect(persistedInputs.bowSet).toBe(defaultInputs.bowSet)
    expect(persistedInputs.food).toBe(defaultInputs.food)
    expect(persistedInputs.mindMethods).toEqual(defaultInputs.mindMethods)
    expect(persistedInputs.inventory).toEqual(defaultInputs.inventory)
    expect(persistedInputs.equipped).toEqual(defaultInputs.equipped)
    expect(persistedInputs.martialArtsTalents).toEqual(defaultInputs.martialArtsTalents)
    expect(persistedInputs.oddities).toEqual(defaultInputs.oddities)
    expect(persistedInputs.combatSettings).toEqual(defaultInputs.combatSettings)
  })

  it("exportProfile output parses to a wrapper whose profile.inputs has none of the derived keys", () => {
    const profile = makeProfile("p1", withDerivedStats(defaultInputs))
    const exported = JSON.parse(exportProfile(profile))
    const exportedInputs = exported.profile.inputs as Record<string, unknown>
    for (const field of DERIVED_STAT_FIELDS) {
      expect(field in exportedInputs, `${field} leaked into the export`).toBe(false)
    }
  })

  it("importProfile walks a wrapper at the previous version through the chain and zeroes its stats", () => {
    const piece: GearPiece = {
      id: "gp-old-1",
      slot: "helm",
      level: 91,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 4614,
      physDef: 18,
      words: [
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "",
      attunementValue: 0,
      relayed: false,
    }
    const oldProfile: StoredProfile = {
      id: "pr-old",
      name: "OldProfile",
      inputs: {
        ...withDerivedStats(defaultInputs),
        inventory: [piece],
        equipped: { ...EMPTY_EQUIPPED, helm: piece.id },
      },
    }
    const wrapper = { v: LATEST_PROFILES_VERSION - 1, profile: oldProfile }

    const imported = importProfile(JSON.stringify(wrapper))

    expect(imported.name).toBe("OldProfile")
    expect(imported.inputs.critRate).toBe(0)
    expect(imported.inputs.phys).toEqual({ min: 0, max: 0, penetration: 0 })
    expect(imported.inputs.inventory).toHaveLength(1)
    const newPieceId = imported.inputs.inventory[0].id
    expect(newPieceId).not.toBe(piece.id)
    expect(imported.inputs.equipped.helm).toBe(newPieceId)
  })

  it("importProfile rejects a wrapper newer than this build", () => {
    const profile = makeProfile("p1", withDerivedStats(defaultInputs))
    const wrapper = { v: LATEST_PROFILES_VERSION + 1, profile }
    expect(() => importProfile(JSON.stringify(wrapper))).toThrow()
  })

  it("loadProfiles heals a stored v6 blob whose stat fields hold garbage", () => {
    const garbageInputs: Inputs = {
      ...defaultInputs,
      bamboocut: { min: -131, max: -226.8, penetration: 0 },
    }
    localStorage.setItem(
      PROFILES_KEY,
      JSON.stringify({
        v: LATEST_PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Garbage", inputs: garbageInputs }],
        activeId: "p1",
      }),
    )

    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.bamboocut).toEqual({ min: 0, max: 0, penetration: 0 })
  })

  it("the default build's derived output is unaffected by zeroing the derived fields first", () => {
    expect(withDerivedStats(defaultInputs)).toEqual(
      withDerivedStats(withZeroedDerivedStats(defaultInputs)),
    )
  })
})

describe("migrateSeededSkillIds — repairs pre-fix seeded-copy ids", () => {
  const CLASS = "bellstrikeUmbra"
  const builtin = builtinSkillsForClass(CLASS)[0]

  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    localStorage.clear()
  })

  it("remaps a stored skill's stale id to the built-in's id on an unambiguous name match, and rewrites rotation steps", () => {
    const stale = makeSkill(CLASS, {
      name: builtin.name,
      skillType: builtin.skillType,
      hits: [{ ...builtin.hits[0], physMultiplier: builtin.hits[0].physMultiplier + 5 }],
    })
    saveCustomSkill(stale)

    const rotation = makeRotation(CLASS, {
      name: "Custom",
      steps: [makeStep({ skillId: stale.id, hitCount: 1 })],
    })
    saveCustomRotation(rotation)

    migrateSeededSkillIds()

    const skills = loadCustomSkillsForClass(CLASS)
    expect(skills).toHaveLength(1)
    expect(skills[0].id).toBe(builtin.id)
    expect(skills[0].hits[0].physMultiplier).toBe(builtin.hits[0].physMultiplier + 5)

    const rotations = loadCustomRotations()
    const savedRotation = rotations.find((candidate) => candidate.id === rotation.id)!
    expect(savedRotation.steps[0].skillId).toBe(builtin.id)

    migrateSeededSkillIds()
    const skillsAgain = loadCustomSkillsForClass(CLASS)
    expect(skillsAgain[0].id).toBe(builtin.id)
    const rotationsAgain = loadCustomRotations()
    expect(rotationsAgain.find((candidate) => candidate.id === rotation.id)!.steps[0].skillId).toBe(
      builtin.id,
    )
  })

  it("leaves an ambiguous or genuinely custom skill untouched", () => {
    const custom = makeSkill(CLASS, { name: "Totally Custom Skill Name" })
    saveCustomSkill(custom)
    migrateSeededSkillIds()
    const skills = loadCustomSkillsForClass(CLASS)
    expect(skills).toHaveLength(1)
    expect(skills[0].id).toBe(custom.id)
  })

  it("does not remap when a stored skill already claims the built-in's id (would create a duplicate override)", () => {
    const alreadyCorrect = makeSkill(CLASS, { id: builtin.id, name: builtin.name })
    saveCustomSkill(alreadyCorrect)
    const stale = makeSkill(CLASS, { name: builtin.name })
    saveCustomSkill(stale)

    migrateSeededSkillIds()

    const skills = loadCustomSkillsForClass(CLASS)
    expect(skills.find((skill) => skill.id === stale.id)).toBeTruthy()
    expect(skills.filter((skill) => skill.id === builtin.id)).toHaveLength(1)
  })
})

// Additive, no version bump — see CLAUDE.md → "localStorage migrations".
describe("mystic-boost merges (field/gear-word/buff-stat-key, no version bump)", () => {
  const PROFILES_KEY = "wwm.profiles"
  const PROFILES_VERSION = 4
  const CUSTOM_BUFFS_KEY = "wwm.customBuffs"
  const CUSTOM_BUFFS_VERSION = 3
  const CUSTOM_DEBUFFS_KEY = "wwm.customDebuffs"
  const CUSTOM_DEBUFFS_VERSION = 2

  function clearStores(): void {
    for (const key of [PROFILES_KEY, CUSTOM_BUFFS_KEY, CUSTOM_DEBUFFS_KEY]) {
      try {
        kvStore.remove(key)
      } catch {}
    }
  }

  beforeEach(clearStores)
  afterEach(clearStores)

  it("drops the legacy singleBurstBoost/singleControlBoost keys and recomputes singleMysticBoost from gear", () => {
    const legacyInputs = {
      ...defaultInputs,
      singleBurstBoost: 0.07,
      singleControlBoost: 0.03,
    } as Inputs & { singleBurstBoost?: number; singleControlBoost?: number }
    delete (legacyInputs as { singleMysticBoost?: number }).singleMysticBoost
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Legacy", inputs: legacyInputs }],
        activeId: "p1",
      }),
    )

    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.singleMysticBoost).toBe(0)
    expect(
      (profiles[0].inputs as unknown as Record<string, unknown>).singleBurstBoost,
    ).toBeUndefined()
    expect(
      (profiles[0].inputs as unknown as Record<string, unknown>).singleControlBoost,
    ).toBeUndefined()
  })

  it("renames a stored gear piece's legacy word to the official name and preserves its contribution", () => {
    const burstPiece: StoredGearPiece = {
      id: "test-burst-piece",
      slot: "helm",
      level: 91,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 0,
      physDef: 0,
      words: [
        { word: "Single Burst", value: 0.07, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "",
      attunementValue: 0,
      relayed: false,
    }
    const controlPiece: StoredGearPiece = {
      ...burstPiece,
      id: "test-control-piece",
      words: [
        { word: "Single Control", value: 0.07, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
    }
    const legacyInputs = { ...defaultInputs, inventory: [burstPiece, controlPiece] }
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Legacy", inputs: legacyInputs }],
        activeId: "p1",
      }),
    )

    const { profiles } = loadProfiles()
    const hydratedInputs = profiles[0].inputs
    for (const piece of hydratedInputs.inventory) {
      expect(piece.words[0].word).toBe("singleTargetMysticBoost")
      expect(piece.words[0].value).toBe(0.07)
      const contribution = computeGearContribution(piece, hydratedInputs)
      const entry = contribution.find((row) => row.path === "singleMysticBoost")
      expect(entry?.amount).toBeCloseTo(0.07, 10)
    }
  })

  it("renames a stored piece's Formless words to Void Attack and keeps the primary-attribute contribution", () => {
    const voidPiece: StoredGearPiece = {
      id: "test-void-piece",
      slot: "helm",
      level: 91,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 0,
      physDef: 0,
      words: [
        { word: "Max Formless", value: 44.2, retuned: false },
        { word: "Min Formless", value: 22.1, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "",
      attunementValue: 0,
      relayed: false,
    }
    const legacyInputs = { ...defaultInputs, classId: "bellstrikeUmbra", inventory: [voidPiece] }
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Legacy", inputs: legacyInputs }],
        activeId: "p1",
      }),
    )

    const { profiles } = loadProfiles()
    const hydratedInputs = profiles[0].inputs
    const piece = hydratedInputs.inventory[0]
    expect(piece.words[0].word).toBe("maxVoidAttack")
    expect(piece.words[1].word).toBe("minVoidAttack")
    const contribution = computeGearContribution(piece, hydratedInputs)
    expect(contribution.find((row) => row.path === "bellstrike.max")?.amount).toBeCloseTo(44.2, 10)
    expect(contribution.find((row) => row.path === "bellstrike.min")?.amount).toBeCloseTo(22.1, 10)
  })

  it("renames both stored area words onto the merged one and preserves their contribution", () => {
    const areaPiece = (id: string, word: string): StoredGearPiece => ({
      id,
      slot: "helm",
      level: 91,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 0,
      physDef: 0,
      words: [
        { word, value: 0.05, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "",
      attunementValue: 0,
      relayed: false,
    })
    const legacyInputs = {
      ...defaultInputs,
      inventory: [
        areaPiece("test-area-debuff-piece", "Area Debuff Mystic Skill DMG Boost"),
        areaPiece("test-area-damage-piece", "Area DMG Mystic Skill DMG Boost"),
        areaPiece("test-aoe-anomaly-piece", "AoE Anomaly"),
        areaPiece("test-aoe-damage-piece", "AoE Damage"),
      ],
    }
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Legacy", inputs: legacyInputs }],
        activeId: "p1",
      }),
    )

    const { profiles } = loadProfiles()
    const hydratedInputs = profiles[0].inputs
    for (const piece of hydratedInputs.inventory) {
      expect(piece.words[0].word).toBe("areaMysticBoost")
      expect(piece.words[0].value).toBe(0.05)
      const contribution = computeGearContribution(piece, hydratedInputs)
      const entry = contribution.find((row) => row.path === "areaMysticBoost")
      expect(entry?.amount).toBeCloseTo(0.05, 10)
    }
  })

  it("clears a stored word the catalogue no longer offers and leaves its neighbours alone", () => {
    const strandedPiece: StoredGearPiece = {
      id: "test-stranded-piece",
      slot: "helm",
      level: 91,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 0,
      physDef: 0,
      words: [
        { word: "Retired Word", value: 0.09, retuned: false },
        { word: "Crit", value: 0.09, retuned: true },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "",
      attunementValue: 0,
      relayed: false,
    }
    const legacyInputs = { ...defaultInputs, inventory: [strandedPiece] }
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Legacy", inputs: legacyInputs }],
        activeId: "p1",
      }),
    )

    const { profiles } = loadProfiles()
    const piece = profiles[0].inputs.inventory[0]
    expect(piece.words[0]).toEqual({ word: "", value: 0, retuned: false })
    expect(piece.words[1]).toEqual({ word: "crit", value: 0.09, retuned: true })
  })

  it("renames a legacy word rather than clearing it as unknown", () => {
    const renamedPiece: StoredGearPiece = {
      id: "test-renamed-piece",
      slot: "helm",
      level: 91,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 0,
      physDef: 0,
      words: [
        { word: "AoE Damage", value: 0.05, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "",
      attunementValue: 0,
      relayed: false,
    }
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: PROFILES_VERSION,
        profiles: [
          { id: "p1", name: "Legacy", inputs: { ...defaultInputs, inventory: [renamedPiece] } },
        ],
        activeId: "p1",
      }),
    )

    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.inventory[0].words[0]).toEqual({
      word: "areaMysticBoost",
      value: 0.05,
      retuned: false,
    })
  })

  it("drops the legacy groupAnomalyBoost/groupDamageBoost keys off a stored profile", () => {
    const legacyInputs = {
      ...defaultInputs,
      groupAnomalyBoost: 0.07,
      groupDamageBoost: 0.07,
    } as Inputs & { groupAnomalyBoost?: number; groupDamageBoost?: number }
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Legacy", inputs: legacyInputs }],
        activeId: "p1",
      }),
    )

    const { profiles } = loadProfiles()
    const hydratedInputs = profiles[0].inputs as unknown as Record<string, unknown>
    expect(hydratedInputs.groupAnomalyBoost).toBeUndefined()
    expect(hydratedInputs.groupDamageBoost).toBeUndefined()
    expect(profiles[0].inputs.areaMysticBoost).toBe(0)
  })

  it("remaps a stored custom buff's legacy statKey to singleMysticBoost", () => {
    const legacyBuff = {
      id: "bf-legacy-1",
      classId: "bellstrikeUmbra",
      name: "Legacy Single Burst Buff",
      scope: "player",
      activation: "permanent",
      durationFrames: 600,
      effects: [{ statKey: "singleBurstBoost", amount: 0.05 }],
      maxStacks: 1,
      stackScaling: "flat",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }
    kvStore.set(CUSTOM_BUFFS_KEY, JSON.stringify({ v: CUSTOM_BUFFS_VERSION, buffs: [legacyBuff] }))

    const buffs = loadCustomBuffs()
    expect(buffs).toHaveLength(1)
    expect(buffs[0].effects[0].statKey).toBe("singleMysticBoost")
    expect(buffs[0].effects[0].amount).toBe(0.05)
  })

  it("remaps a stored custom debuff's area statKey too — debuff effects go through the same map", () => {
    const legacyDebuff = {
      id: "df-legacy-1",
      classId: "bellstrikeUmbra",
      name: "Legacy Area Debuff",
      activation: "triggered",
      durationFrames: 600,
      effects: [{ statKey: "groupAnomalyBoost", amount: 0.04 }],
      dot: null,
      maxStacks: 1,
      stackScaling: "flat",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }
    kvStore.set(
      CUSTOM_DEBUFFS_KEY,
      JSON.stringify({ v: CUSTOM_DEBUFFS_VERSION, debuffs: [legacyDebuff] }),
    )

    const debuffs = loadCustomDebuffs()
    expect(debuffs).toHaveLength(1)
    expect(debuffs[0].effects[0].statKey).toBe("areaMysticBoost")
    expect(debuffs[0].effects[0].amount).toBe(0.04)
  })

  it("remaps a stored custom buff's two area statKeys to areaMysticBoost", () => {
    const legacyBuff = {
      id: "bf-legacy-2",
      classId: "bellstrikeUmbra",
      name: "Legacy Area Buff",
      scope: "player",
      activation: "permanent",
      durationFrames: 600,
      effects: [
        { statKey: "groupAnomalyBoost", amount: 0.05 },
        { statKey: "groupDamageBoost", amount: 0.03 },
      ],
      maxStacks: 1,
      stackScaling: "flat",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }
    kvStore.set(CUSTOM_BUFFS_KEY, JSON.stringify({ v: CUSTOM_BUFFS_VERSION, buffs: [legacyBuff] }))

    const buffs = loadCustomBuffs()
    expect(buffs).toHaveLength(1)
    expect(buffs[0].effects.map((effect) => effect.statKey)).toEqual([
      "areaMysticBoost",
      "areaMysticBoost",
    ])
    expect(buffs[0].effects.map((effect) => effect.amount)).toEqual([0.05, 0.03])
  })
})

// Additive, no version bump — see CLAUDE.md → "localStorage migrations".
describe("GearPiece.isNew hydration (additive, no version bump)", () => {
  const PROFILES_KEY = "wwm.profiles"
  const PROFILES_VERSION = 4

  beforeEach(() => {
    try {
      kvStore.remove(PROFILES_KEY)
    } catch {}
  })
  afterEach(() => {
    try {
      kvStore.remove(PROFILES_KEY)
    } catch {}
  })

  function makePiece(id: string, extra: Record<string, unknown> = {}): GearPiece {
    return {
      id,
      slot: "helm",
      level: 91,
      rarity: "legendary",
      minPhys: 0,
      maxPhys: 0,
      hp: 0,
      physDef: 0,
      words: [
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
        { word: "", value: 0, retuned: false },
      ],
      attunement: "",
      attunementValue: 0,
      relayed: false,
      ...extra,
    } as GearPiece
  }

  it("round-trips a stored isNew: true piece as isNew === true", () => {
    const inventory = [makePiece("new-piece", { isNew: true })]
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Profile", inputs: { ...defaultInputs, inventory } }],
        activeId: "p1",
      }),
    )

    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.inventory[0].isNew).toBe(true)
  })

  it("drops isNew: false to an absent key", () => {
    const inventory = [makePiece("old-piece", { isNew: false })]
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Profile", inputs: { ...defaultInputs, inventory } }],
        activeId: "p1",
      }),
    )

    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.inventory[0].isNew).toBeUndefined()
    expect("isNew" in profiles[0].inputs.inventory[0]).toBe(false)
  })

  it("leaves an absent isNew key absent", () => {
    const inventory = [makePiece("plain-piece")]
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Profile", inputs: { ...defaultInputs, inventory } }],
        activeId: "p1",
      }),
    )

    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.inventory[0].isNew).toBeUndefined()
  })

  it("is idempotent across repeated hydration", () => {
    const inventory = [makePiece("new-piece", { isNew: true })]
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Profile", inputs: { ...defaultInputs, inventory } }],
        activeId: "p1",
      }),
    )

    const first = loadProfiles()
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: PROFILES_VERSION,
        profiles: first.profiles,
        activeId: first.activeId,
      }),
    )
    const second = loadProfiles()
    expect(second.profiles[0].inputs.inventory[0].isNew).toBe(true)
  })
})

// Additive, no version bump — see CLAUDE.md → "localStorage migrations".
describe("seeded-skill tag heal (role:/cast: addressing, no version bump)", () => {
  const CLASS_ID = "bellstrikeUmbra"
  const builtinDetonation = builtinSkillsForClass(CLASS_ID).find(
    (skill) => skill.id === `${CLASS_ID}-bleed-detonation`,
  )!

  it("restores the built-in's tags on a copy seeded before they existed", () => {
    const stale = {
      ...seedSkillFromBuiltin(CLASS_ID, builtinDetonation),
      tags: ["weapon:Sword", "attune:bleed"],
    }
    saveCustomSkill(stale)

    const healed = loadCustomSkillsForClass(CLASS_ID).find((skill) => skill.id === stale.id)!
    expect(healed.tags).toEqual(expect.arrayContaining(builtinDetonation.tags!))
    expect(healed.tags).toContain("role:bleedDetonation")
  })

  it("round-trips an already-correct copy unchanged, and leaves a genuinely custom skill alone", () => {
    const current = seedSkillFromBuiltin(CLASS_ID, builtinDetonation)
    saveCustomSkill(current)
    const reloaded = loadCustomSkillsForClass(CLASS_ID).find((skill) => skill.id === current.id)!
    expect(reloaded.tags).toEqual(current.tags)

    const ownSkill = makeSkill(CLASS_ID, { name: "Blood Burst", tags: ["weapon:Sword"] })
    saveCustomSkill(ownSkill)
    const ownReloaded = loadCustomSkillsForClass(CLASS_ID).find(
      (skill) => skill.id === ownSkill.id,
    )!
    expect(ownReloaded.tags).toEqual(["weapon:Sword"])
  })
})

// Additive, no version bump — see CLAUDE.md → "localStorage migrations". The
// legacy `wwm.inputs` blob has no version chain of its own (V8 in
// `src/migrations/` covers `wwm.profiles`), so `set` is healed here instead —
// `loadProfiles()` rolls it into a profile via `hydrateInputs` on first load.
describe("armor-set display name heal (wwm.inputs blob, no version bump)", () => {
  beforeEach(() => {
    try {
      kvStore.remove("wwm.inputs")
      kvStore.remove("wwm.profiles")
    } catch {}
  })
  afterEach(() => {
    try {
      kvStore.remove("wwm.inputs")
      kvStore.remove("wwm.profiles")
    } catch {}
  })

  it("a legacy wwm.inputs blob naming its set by display name rolls into a profile with the id", () => {
    saveInputs({ ...defaultInputs, set: "Hawking" })
    const { profiles } = loadProfiles()
    expect(profiles).toHaveLength(1)
    expect(profiles[0].inputs.set).toBe("hawking")
  })

  it("degrades an unrecognised legacy set to no set instead of leaving it dangling", () => {
    saveInputs({ ...defaultInputs, set: "A Removed Set" })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.set).toBeNull()
  })

  it("round-trips an already-migrated id unchanged", () => {
    saveInputs({ ...defaultInputs, set: "jadeware" })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.set).toBe("jadeware")
  })
})

// Additive, no version bump — see CLAUDE.md → "localStorage migrations".
// `getSchool()` throws on a `classId` outside `CLASS_IDS`, and `deriveStats` /
// `withDerivedStats` call it unconditionally on every render.
describe("class id degrade (an unrecognised classId falls back to the default build's class)", () => {
  const PROFILES_KEY = "wwm.profiles"

  beforeEach(() => {
    try {
      kvStore.remove(PROFILES_KEY)
      kvStore.remove("wwm.inputs")
    } catch {}
  })
  afterEach(() => {
    try {
      kvStore.remove(PROFILES_KEY)
      kvStore.remove("wwm.inputs")
    } catch {}
  })

  function writeProfileWithClassId(classId: unknown): void {
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: LATEST_PROFILES_VERSION,
        profiles: [{ id: "p1", name: "Legacy", inputs: { ...defaultInputs, classId } }],
        activeId: "p1",
      }),
    )
  }

  it("degrades a classId naming a class that no longer exists, and the result doesn't throw when deriving stats", () => {
    writeProfileWithClassId("silkbindJade")
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.classId).toBe(defaultInputs.classId)
    expect(() => withDerivedStats(profiles[0].inputs)).not.toThrow()
  })

  it("degrades an empty string and a wrong-typed classId without throwing", () => {
    writeProfileWithClassId("")
    expect(loadProfiles().profiles[0].inputs.classId).toBe(defaultInputs.classId)

    kvStore.remove(PROFILES_KEY)
    writeProfileWithClassId(123)
    expect(loadProfiles().profiles[0].inputs.classId).toBe(defaultInputs.classId)
  })

  it("leaves a valid classId alone, and is a fixpoint across repeated hydration", () => {
    writeProfileWithClassId("bellstrikeUmbra")
    const first = loadProfiles()
    expect(first.profiles[0].inputs.classId).toBe("bellstrikeUmbra")

    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: LATEST_PROFILES_VERSION,
        profiles: first.profiles,
        activeId: first.activeId,
      }),
    )
    const second = loadProfiles()
    expect(second.profiles[0].inputs).toEqual(first.profiles[0].inputs)
  })

  it("composes with the pinyin migration: a legacy id resolving to a live class survives, one resolving to a removed class degrades", () => {
    writeProfileWithClassId("mingJinYing")
    expect(loadProfiles().profiles[0].inputs.classId).toBe("bellstrikeUmbra")

    kvStore.remove(PROFILES_KEY)
    writeProfileWithClassId("qianSiYu")
    expect(loadProfiles().profiles[0].inputs.classId).toBe(defaultInputs.classId)
  })

  it("the default build's own class id is a member of CLASS_IDS, so the degrade is a no-op on it", () => {
    expect(CLASS_IDS().includes(defaultInputs.classId)).toBe(true)
    localStorage.clear()
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.classId).toBe(defaultInputs.classId)
    expect(profiles[0].inputs.arsenal).toBe(defaultInputs.arsenal)
    expect(profiles[0].inputs.mindMethods).toEqual(defaultInputs.mindMethods)
    expect(profiles[0].inputs.martialArtsTalents).toEqual(
      getDefaultTalentsForClass(defaultInputs.classId),
    )
  })

  it("a removed class's selected rotation falls through to the degraded class's default rotation, with no error/exception warning", () => {
    kvStore.set(
      PROFILES_KEY,
      JSON.stringify({
        v: LATEST_PROFILES_VERSION,
        profiles: [
          {
            id: "p1",
            name: "Legacy",
            inputs: {
              ...defaultInputs,
              classId: "silkbindJade",
              selectedBuiltinRotationId: "builtin-silkbindJade-t5",
            },
          },
        ],
        activeId: "p1",
      }),
    )
    const { profiles } = loadProfiles()
    const inputs = profiles[0].inputs
    expect(inputs.classId).toBe(defaultInputs.classId)

    const result = runEngine(applyBowSet(applyArmorSet(withDerivedStats(inputs))))
    expect(result.dps).toBeGreaterThan(0)
    expect(result.warnings.some((warning) => /error|exception/i.test(warning))).toBe(false)
  })
})
