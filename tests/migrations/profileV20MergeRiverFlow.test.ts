import { describe, expect, it } from "vitest"
import { makeRotation } from "../../src/engine/rotation"
import { makeSkill, makeHit } from "../../src/engine/skill"
import type { StoredProfile } from "../../src/engine/types"
import { runProfileMigrations, type RawProfilesBlob } from "../../src/migrations"
import {
  V20__mergeRiverFlowIntoWolfchasersArt,
  migrateRiverFlowBuffId,
} from "../../src/migrations/V20__mergeRiverFlowIntoWolfchasersArt"
import { loadCustomSkills } from "../../src/storage"
import legacyProfileFile from "./testProfiles/v19/bellstrikeUmbra.json"

type LegacyFile = { v: number; profile: StoredProfile }
const LEGACY = legacyProfileFile as unknown as LegacyFile
const LEGACY_BUFF_ID = "buff-bellstrikeUmbra-river-flow"
const RIVER_FLOW_BUFF_ID = "potentRiverFlow"
const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const CUSTOM_SKILLS_VERSION = 3

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function blobOf(profile: StoredProfile): RawProfilesBlob {
  return { v: LEGACY.v, profiles: [profile], activeId: profile.id }
}

function profileOf(blob: RawProfilesBlob): StoredProfile {
  return blob.profiles[0] as StoredProfile
}

function gatedSkill() {
  return makeSkill("bellstrikeUmbra", {
    name: "Cloned Spear Special",
    hits: [
      makeHit({
        frame: 0,
        triggers: [
          {
            kind: "applyBuff" as const,
            targetId: LEGACY_BUFF_ID,
            stacks: 1,
            condition: { buffId: LEGACY_BUFF_ID, op: "gte" as const, stacks: 1 },
            conditions: [{ buffId: LEGACY_BUFF_ID, op: "gte" as const, stacks: 1 }],
          },
        ],
        variants: [
          {
            id: "hv-cloned-river-flow",
            label: "River Flow",
            conditions: [{ buffId: LEGACY_BUFF_ID, op: "gte" as const, stacks: 1 }],
            physMultiplier: 1,
            attributeMultiplier: 1,
            physFixed: 0,
            attributeFixed: 0,
          },
        ],
      }),
    ],
  })
}

describe("the captured profile is genuinely pre-change", () => {
  it("stores the version this step reads", () => {
    expect(LEGACY.v).toBe(V20__mergeRiverFlowIntoWolfchasersArt.to - 1)
  })
})

describe("V20__mergeRiverFlowIntoWolfchasersArt — called directly", () => {
  it("renames the retired gate id wherever a custom skill conditions on it", () => {
    const profile = clone(LEGACY.profile)
    profile.inputs.customSkills = [gatedSkill()]
    const hit = profileOf(V20__mergeRiverFlowIntoWolfchasersArt.migrate(blobOf(profile))).inputs
      .customSkills![0].hits[0]
    expect(hit.triggers[0].targetId).toBe(RIVER_FLOW_BUFF_ID)
    expect(hit.triggers[0].condition!.buffId).toBe(RIVER_FLOW_BUFF_ID)
    expect(hit.triggers[0].conditions![0].buffId).toBe(RIVER_FLOW_BUFF_ID)
    expect(hit.variants![0].conditions[0].buffId).toBe(RIVER_FLOW_BUFF_ID)
  })

  it("renames it on a saved rotation's permanent buffs and opening stacks", () => {
    const profile = clone(LEGACY.profile)
    profile.inputs.activeCustomRotation = makeRotation(profile.inputs.classId, {
      permanentBuffIds: [LEGACY_BUFF_ID],
      openingStacks: { [LEGACY_BUFF_ID]: 1 },
    })
    const rotation = profileOf(V20__mergeRiverFlowIntoWolfchasersArt.migrate(blobOf(profile)))
      .inputs.activeCustomRotation!
    expect(rotation.permanentBuffIds).toEqual([RIVER_FLOW_BUFF_ID])
    expect(rotation.openingStacks).toEqual({ [RIVER_FLOW_BUFF_ID]: 1 })
  })

  it("touches nothing else in the profile", () => {
    const migrated = profileOf(
      V20__mergeRiverFlowIntoWolfchasersArt.migrate(blobOf(clone(LEGACY.profile))),
    )
    expect(migrated).toEqual(LEGACY.profile)
  })

  it("runs twice to the same result", () => {
    const profile = clone(LEGACY.profile)
    profile.inputs.customSkills = [gatedSkill()]
    const once = V20__mergeRiverFlowIntoWolfchasersArt.migrate(blobOf(profile))
    const twice = V20__mergeRiverFlowIntoWolfchasersArt.migrate(clone(once))
    expect(twice).toEqual(once)
  })

  it("leaves current, unrelated and missing values unchanged", () => {
    expect(migrateRiverFlowBuffId(RIVER_FLOW_BUFF_ID)).toBe(RIVER_FLOW_BUFF_ID)
    expect(migrateRiverFlowBuffId("soulShaken")).toBe("soulShaken")
    expect(migrateRiverFlowBuffId("buff-bellstrikeUmbra-spear-special-cooldown")).toBe(
      "buff-bellstrikeUmbra-spear-special-cooldown",
    )
  })
})

describe("through the chain and the hydrator", () => {
  it("walks a stored profile up to the latest version with the id renamed", () => {
    const profile = clone(LEGACY.profile)
    profile.inputs.activeCustomRotation = makeRotation(profile.inputs.classId, {
      permanentBuffIds: [LEGACY_BUFF_ID],
    })
    const run = runProfileMigrations(blobOf(profile))!
    expect(run.applied).toContain("V20__mergeRiverFlowIntoWolfchasersArt")
    expect(profileOf(run.blob).inputs.activeCustomRotation?.permanentBuffIds).toEqual([
      RIVER_FLOW_BUFF_ID,
    ])
  })

  it("heals a stored custom skill, whose store the chain never walks", () => {
    localStorage.setItem(
      CUSTOM_SKILLS_KEY,
      JSON.stringify({ v: CUSTOM_SKILLS_VERSION, skills: [gatedSkill()] }),
    )
    const hit = loadCustomSkills()[0].hits[0]
    expect(hit.triggers[0].targetId).toBe(RIVER_FLOW_BUFF_ID)
    expect(hit.triggers[0].condition!.buffId).toBe(RIVER_FLOW_BUFF_ID)
    expect(hit.triggers[0].conditions![0].buffId).toBe(RIVER_FLOW_BUFF_ID)
    expect(hit.variants![0].conditions[0].buffId).toBe(RIVER_FLOW_BUFF_ID)
  })
})
