// The guard for CLASSES.md § "Id schemes": a skill or debuff reaches or
// triggers a buff through an id it declares (`Skill.receives`,
// `Skill.triggersBuffs`, `Debuff.receives`, `Debuff.triggersBuffs`), and that id
// must actually name a registered buff module — never a typo that silently
// reaches or triggers nothing.
import { describe, expect, it } from "vitest"
import { builtinDebuffsForClass, builtinSkillsForClass } from "../../src/engine/builtinLibrary"
import { CLASS_IDS, CLASS_DEFS, classDefinition } from "../../src/definitions/classes/registry"
import { GLOBAL_BUFF_DEFS, GROUP_BUFF_DEFS } from "../../src/data/skills/buffs"

const DEFINED_MODULES = [
  ...CLASS_DEFS().flatMap((classDef) => classDefinition(classDef.id)?.buffModules ?? []),
  ...GLOBAL_BUFF_DEFS,
  ...GROUP_BUFF_DEFS,
]
const DEFINED_BUFF_IDS = new Set(DEFINED_MODULES.map((module) => module.id))

function receivedBuffIds(): Set<string> {
  const ids = new Set<string>()
  for (const classId of CLASS_IDS()) {
    for (const skill of builtinSkillsForClass(classId))
      for (const id of skill.receives ?? []) ids.add(id)
    for (const debuff of builtinDebuffsForClass(classId))
      for (const id of debuff.receives ?? []) ids.add(id)
  }
  return ids
}

// Pure state markers: no stat effects of their own, so nothing needs to
// `receive` them — `mirageBonus`/`resistanceResolve` read their windows via
// `requiresBuffActive`/`activeAfterBuffEnds` instead.
// `mountainsMightQiImbalance` carries no stat effect either: it exists so an
// inner way can gate which skills inflict a status the class also inflicts
// ungated, and its only effect applies that status.
const RECEIVES_NOTHING_BY_DESIGN = new Set([
  "mirage",
  "rainwhisperShield",
  "mountainsMightQiImbalance",
])

describe("a skill's/debuff's buff ids are addressed by id, never by display name", () => {
  it("every receives/triggersBuffs entry resolves to a registered buff module", () => {
    const orphans: string[] = []
    for (const classId of CLASS_IDS()) {
      for (const skill of builtinSkillsForClass(classId)) {
        for (const id of [...(skill.receives ?? []), ...(skill.triggersBuffs ?? [])])
          if (!DEFINED_BUFF_IDS.has(id)) orphans.push(`${classId}/${skill.id}: ${id}`)
      }
      for (const debuff of builtinDebuffsForClass(classId)) {
        for (const id of [...(debuff.receives ?? []), ...(debuff.triggersBuffs ?? [])])
          if (!DEFINED_BUFF_IDS.has(id)) orphans.push(`${classId}/${debuff.id}: ${id}`)
      }
    }
    expect(orphans).toEqual([])
  })

  it("covers a non-trivial number of pairs, so the check cannot pass vacuously", () => {
    let count = 0
    for (const classId of CLASS_IDS()) {
      for (const skill of builtinSkillsForClass(classId)) {
        count += (skill.receives?.length ?? 0) + (skill.triggersBuffs?.length ?? 0)
      }
      for (const debuff of builtinDebuffsForClass(classId)) {
        count += (debuff.receives?.length ?? 0) + (debuff.triggersBuffs?.length ?? 0)
      }
    }
    expect(count).toBeGreaterThanOrEqual(6)
  })
})

describe("no buff module a skill or debuff lists in receives may also claim affectsAll", () => {
  it("every module named in a receives array is scoped, not global", () => {
    const namedIds = receivedBuffIds()
    const offenders = DEFINED_MODULES.filter(
      (module) => namedIds.has(module.id) && module.affectsAll === true,
    ).map((module) => module.id)
    expect(offenders).toEqual([])
  })
})

describe("a scoped module a skill or debuff could list in receives isn't orphaned", () => {
  it("every non-affectsAll module is named by at least one skill or debuff, or is a listed exception", () => {
    const namedIds = receivedBuffIds()
    const orphans = DEFINED_MODULES.filter(
      (module) =>
        !module.affectsAll &&
        !namedIds.has(module.id) &&
        !RECEIVES_NOTHING_BY_DESIGN.has(module.id),
    ).map((module) => module.id)
    expect(orphans).toEqual([])
  })
})
