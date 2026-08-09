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
import { kvStore } from "../src/kvStore"
import { EMPTY_EQUIPPED } from "../src/engine/types"
import type { GearPiece, Inputs, StoredProfile } from "../src/engine/types"

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
        { name: "Forgotten River Echo", stacks: "tier 6" },
        { name: "Mud-Fish Heart", stacks: "tier 5" },
        { name: "", stacks: "" },
        { name: "", stacks: "" },
      ],
    }
    saveInputs(next)
    const loaded = loadInputs()
    expect(loaded).not.toBeNull()
    expect(loaded?.precision).toBe(0.42)
    expect(loaded?.mindMethods[1]).toEqual({ name: "Mud-Fish Heart", stacks: "tier 5" })
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
    const next: Inputs = { ...defaultInputs, set: "Swallowcall" }
    saveInputs(next)
    expect(initialInputs().set).toBe("Swallowcall")
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
    const savedRotation = rotations.find((r) => r.id === rotation.id)!
    expect(savedRotation.steps[0].skillId).toBe(builtin.id)

    migrateSeededSkillIds()
    const skillsAgain = loadCustomSkillsForClass(CLASS)
    expect(skillsAgain[0].id).toBe(builtin.id)
    const rotationsAgain = loadCustomRotations()
    expect(rotationsAgain.find((r) => r.id === rotation.id)!.steps[0].skillId).toBe(builtin.id)
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
    expect(skills.find((s) => s.id === stale.id)).toBeTruthy()
    expect(skills.filter((s) => s.id === builtin.id)).toHaveLength(1)
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
    const burstPiece: GearPiece = {
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
    const controlPiece: GearPiece = {
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
      expect(piece.words[0].word).toBe("Single-Target Mystic Skill DMG Boost")
      expect(piece.words[0].value).toBe(0.07)
      const contribution = computeGearContribution(piece, hydratedInputs)
      const entry = contribution.find((c) => c.path === "singleMysticBoost")
      expect(entry?.amount).toBeCloseTo(0.07, 10)
    }
  })

  it("renames a stored piece's Formless words to Void Attack and keeps the primary-attribute contribution", () => {
    const voidPiece: GearPiece = {
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
    expect(piece.words[0].word).toBe("Max Void Attack")
    expect(piece.words[1].word).toBe("Min Void Attack")
    const contribution = computeGearContribution(piece, hydratedInputs)
    expect(contribution.find((c) => c.path === "bellstrike.max")?.amount).toBeCloseTo(44.2, 10)
    expect(contribution.find((c) => c.path === "bellstrike.min")?.amount).toBeCloseTo(22.1, 10)
  })

  it("renames both stored area words onto the merged one and preserves their contribution", () => {
    const areaPiece = (id: string, word: string): GearPiece => ({
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
      expect(piece.words[0].word).toBe("Area Mystic Skill DMG Boost")
      expect(piece.words[0].value).toBe(0.05)
      const contribution = computeGearContribution(piece, hydratedInputs)
      const entry = contribution.find((c) => c.path === "areaMysticBoost")
      expect(entry?.amount).toBeCloseTo(0.05, 10)
    }
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

    const ownSkill = makeSkill(CLASS_ID, { name: "Bleed Detonation", tags: ["weapon:Sword"] })
    saveCustomSkill(ownSkill)
    const ownReloaded = loadCustomSkillsForClass(CLASS_ID).find(
      (skill) => skill.id === ownSkill.id,
    )!
    expect(ownReloaded.tags).toEqual(["weapon:Sword"])
  })
})
