import { classDefinition, CLASS_DEFS, innerWayDefsOf } from "../../definitions/classes/registry"
import { GLOBAL_BUFF_DEFS, GROUP_BUFF_DEFS } from "../../data/skills/buffs"
import type { BuffModule } from "./buffModule"

export function specForClass(classId: string): string | undefined {
  return classDefinition(classId)?.spec
}

// Three blocks, in order: every slottable inner way's `buffDefs` (barrel
// order), then `GLOBAL_BUFF_DEFS` filtered against the owned-id set (an owned
// def beats a global of the same id), then the class's own `classBuffDefs`.
export function buffDefsForClass(classId: string): BuffModule[] {
  const definition = classDefinition(classId)
  if (!definition) return allBuffDefsDeduped()
  const innerWayOwned = innerWayDefsOf(definition).flatMap((def) => def.buffDefs ?? [])
  const ownedIds = new Set(
    [...innerWayOwned, ...definition.classBuffDefs].map((module) => module.id),
  )
  const globals = GLOBAL_BUFF_DEFS.filter((module) => !ownedIds.has(module.id))
  return [...innerWayOwned, ...globals, ...definition.classBuffDefs].map((module) => ({
    ...module,
  }))
}

export function groupBuffDefs(): BuffModule[] {
  return GROUP_BUFF_DEFS
}

export function allBuffDefsDeduped(): BuffModule[] {
  const byId = new Map<string, BuffModule>()
  const consider = (module: BuffModule) => {
    const existing = byId.get(module.id)
    if (!existing) {
      byId.set(module.id, { ...module })
      return
    }
    if (module.triggeredBy?.length) {
      const merged = new Set([...(existing.triggeredBy ?? []), ...module.triggeredBy])
      existing.triggeredBy = [...merged]
    }
  }
  for (const classDef of CLASS_DEFS()) {
    const definition = classDefinition(classDef.id)
    for (const module of definition?.buffModules ?? []) consider(module)
  }
  for (const module of GLOBAL_BUFF_DEFS) consider(module)
  return [...byId.values()]
}

export function catalogBuffDefs(classId?: string): BuffModule[] {
  return classId ? buffDefsForClass(classId) : allBuffDefsDeduped()
}
