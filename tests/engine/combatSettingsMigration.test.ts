// Additive field, no version bump — see CLAUDE.md → "localStorage migrations".
// Also covers folding legacy `fireOil`/`vulnerability` into `tianGongElement`/
// `shareEasyHurt` and dropping the inert `formbendSet`.
import { beforeEach, describe, expect, it } from "vitest"
import { kvStore } from "../../src/kvStore"
import { loadProfiles, saveProfiles } from "../../src/storage"
import { defaultInputs } from "../../src/engine/defaults"
import { defaultCombatSettings } from "../../src/engine/types"
import type { Inputs } from "../../src/engine/types"

const PROFILES_KEY = "wwm.profiles"
const PROFILES_VERSION = 4

function writeProfilesBlob(inputsOverrides: Partial<Inputs>): void {
  const inputs: Omit<Inputs, "combatSettings"> & { combatSettings?: unknown } = {
    ...defaultInputs,
    ...inputsOverrides,
  }
  if (!("combatSettings" in inputsOverrides)) delete inputs.combatSettings
  kvStore.set(
    PROFILES_KEY,
    JSON.stringify({
      v: PROFILES_VERSION,
      profiles: [{ id: "p1", name: "Legacy", inputs }],
      activeId: "p1",
    }),
  )
}

describe("combatSettings migration (additive field, no version bump)", () => {
  beforeEach(() => {
    try {
      kvStore.remove(PROFILES_KEY)
    } catch {}
  })

  it("seeds the defaults when the stored blob has no `combatSettings` key", () => {
    writeProfilesBlob({})
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.combatSettings).toEqual(defaultCombatSettings())
  })

  it("has the Qi Break window ON by default", () => {
    expect(defaultCombatSettings().qiBreak).toEqual({
      enabled: true,
      startSec: 25,
      durationSec: 10,
      lowQiLeadSec: 5,
    })
    writeProfilesBlob({})
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.combatSettings!.qiBreak.enabled).toBe(true)
  })

  it("preserves a custom `combatSettings` object already on the blob (idempotent)", () => {
    const custom = {
      qiBreak: { enabled: false, startSec: 30, durationSec: 12, lowQiLeadSec: 3 },
      dragonsBreath: false,
      healerBuff: true,
      breakExtension: false,
      revelryScript: false,
      dragonHeadFullStacks: false,
      dragonHeadLowHpMaxBonus: false,
    }
    writeProfilesBlob({ combatSettings: custom })
    const first = loadProfiles()
    expect(first.profiles[0].inputs.combatSettings).toEqual(custom)

    saveProfiles({ profiles: first.profiles, activeId: first.activeId })
    const second = loadProfiles()
    expect(second.profiles[0].inputs.combatSettings).toEqual(custom)
  })

  it("heals a partial `combatSettings` object field-by-field", () => {
    writeProfilesBlob({
      combatSettings: { revelryScript: true } as unknown as Inputs["combatSettings"],
    })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.combatSettings).toEqual({
      ...defaultCombatSettings(),
      revelryScript: true,
    })
  })

  it("backfills the low-Qi lead onto a `qiBreak` saved before it existed", () => {
    writeProfilesBlob({
      combatSettings: {
        ...defaultCombatSettings(),
        qiBreak: { enabled: true, startSec: 30, durationSec: 12 },
      } as unknown as Inputs["combatSettings"],
    })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.combatSettings!.qiBreak).toEqual({
      enabled: true,
      startSec: 30,
      durationSec: 12,
      lowQiLeadSec: 5,
    })
  })

  it("heals a malformed `combatSettings` value back to the default", () => {
    writeProfilesBlob({ combatSettings: "not-an-object" as unknown as Inputs["combatSettings"] })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.combatSettings).toEqual(defaultCombatSettings())
  })

  it("folds a legacy `fireOil: true` into Divinecraft fire and drops the sub-field", () => {
    writeProfilesBlob({
      tianGongElement: null,
      combatSettings: { fireOil: true } as unknown as Inputs["combatSettings"],
    })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.tianGongElement).toBe("fire")
    expect(profiles[0].inputs.combatSettings).toEqual(defaultCombatSettings())
    expect("fireOil" in profiles[0].inputs.combatSettings!).toBe(false)
  })

  it("leaves an explicit Divinecraft choice alone when folding legacy `fireOil`", () => {
    writeProfilesBlob({
      tianGongElement: "poison",
      combatSettings: { fireOil: true } as unknown as Inputs["combatSettings"],
    })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.tianGongElement).toBe("poison")
  })

  it("folds a legacy `vulnerability: true` into the Tank Spear Debuff flag", () => {
    writeProfilesBlob({
      shareEasyHurt: false,
      combatSettings: { vulnerability: true } as unknown as Inputs["combatSettings"],
    })
    const { profiles } = loadProfiles()
    expect(profiles[0].inputs.shareEasyHurt).toBe(true)
    expect("vulnerability" in profiles[0].inputs.combatSettings!).toBe(false)
  })

  it("drops the inert `formbendSet` sub-field and the removed `shareDebuff5JingShen` input", () => {
    writeProfilesBlob({
      combatSettings: { formbendSet: true } as unknown as Inputs["combatSettings"],
      shareDebuff5JingShen: true,
    } as unknown as Partial<Inputs>)
    const { profiles } = loadProfiles()
    expect("formbendSet" in profiles[0].inputs.combatSettings!).toBe(false)
    expect("shareDebuff5JingShen" in profiles[0].inputs).toBe(false)
  })
})
