// Additive field, no version bump — see CLAUDE.md → "localStorage migrations".
import { beforeEach, describe, expect, it } from "vitest"
import { kvStore } from "../../src/kvStore"
import { loadCustomSkills } from "../../src/storage"
import type { Skill } from "../../src/engine/skill"
import { builtinSkill } from "../builtins"
import { SKILL } from "../../src/data/skills/bellstrike-umbra/ids"
import { SKILL as UNIVERSAL_SKILL } from "../../src/data/skills/universal/ids"

const CUSTOM_SKILLS_KEY = "wwm.customSkills"
const CUSTOM_SKILLS_VERSION = 3
const TAG = "prop:hasQiBreakDoubleDamage"

function writeStoredSkills(skills: Skill[]): void {
  kvStore.set(CUSTOM_SKILLS_KEY, JSON.stringify({ v: CUSTOM_SKILLS_VERSION, skills }))
}

function builtin(skillId: string): Skill {
  return builtinSkill("bellstrikeUmbra", skillId)
}

function withoutTag(skill: Skill): Skill {
  return { ...skill, tags: (skill.tags ?? []).filter((t) => t !== TAG) }
}

describe("Dragon Head - Plus qi-break tag on Skill Editor copies", () => {
  beforeEach(() => {
    try {
      kvStore.remove(CUSTOM_SKILLS_KEY)
    } catch {}
  })

  it("adds the tag to a copy saved before it existed", () => {
    const stale = withoutTag(builtin(UNIVERSAL_SKILL.dragonHeadPlus))
    expect(stale.tags).not.toContain(TAG)
    writeStoredSkills([stale])

    const healed = loadCustomSkills().find((s) => s.id === stale.id)!
    expect(healed.tags).toContain(TAG)
  })

  it("preserves the user's other tags and edits while healing", () => {
    const stale = withoutTag(builtin(UNIVERSAL_SKILL.dragonHeadPlus))
    stale.tags = [...(stale.tags ?? []), "user:favourite"]
    stale.hits[0].physMultiplier = 99
    writeStoredSkills([stale])

    const healed = loadCustomSkills().find((s) => s.id === stale.id)!
    expect(healed.tags).toContain("user:favourite")
    expect(healed.tags).toContain("mystic:burst")
    expect(healed.hits[0].physMultiplier).toBe(99)
  })

  it("is idempotent — a copy that already has the tag keeps exactly one", () => {
    writeStoredSkills([builtin(UNIVERSAL_SKILL.dragonHeadPlus)])
    const healed = loadCustomSkills().find(
      (s) => s.id === builtin(UNIVERSAL_SKILL.dragonHeadPlus).id,
    )!
    expect((healed.tags ?? []).filter((t) => t === TAG)).toHaveLength(1)
  })

  it("leaves the base version and unrelated skills alone", () => {
    writeStoredSkills([builtin(UNIVERSAL_SKILL.dragonHead), builtin(SKILL.swordq)])
    for (const skill of loadCustomSkills()) expect(skill.tags).not.toContain(TAG)
  })
})
