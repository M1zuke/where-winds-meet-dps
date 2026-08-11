import { classDefinition, CLASS_DEFS } from "../../data/classes/registry"
import { GLOBAL_BUFF_DEFS, GROUP_BUFF_DEFS } from "../../data/skills/buffs"
import type { BuffModule } from "./buffModule"

export function specForClass(classId: string): string | undefined {
  return classDefinition(classId)?.spec
}

export function buffDefsForClass(classId: string): BuffModule[] {
  const definition = classDefinition(classId)
  if (!definition) return allBuffDefsDeduped()
  const byId = new Map<string, BuffModule>()
  for (const module of definition.classBuffDefs) byId.set(module.id, { ...module })
  for (const module of GLOBAL_BUFF_DEFS)
    if (!byId.has(module.id)) byId.set(module.id, { ...module })
  return [...byId.values()]
}

export function groupBuffDefs(): BuffModule[] {
  return GROUP_BUFF_DEFS
}

export function mechanicBuffDefs(): BuffModule[] {
  return CLASS_DEFS().flatMap((definition) => definition.mechanicBuffDefs)
}

export function mechanicBuffDefsForClass(classId: string): BuffModule[] {
  const definition = classDefinition(classId)
  return definition ? [...definition.mechanicBuffDefs] : mechanicBuffDefs()
}

export function dedupedMechanicBuffDefsForClass(classId: string): BuffModule[] {
  const byId = new Map<string, BuffModule>()
  for (const module of mechanicBuffDefsForClass(classId)) {
    const existing = byId.get(module.id)
    if (!existing) {
      byId.set(module.id, { ...module })
      continue
    }
    if (module.triggeredBy?.length)
      existing.triggeredBy = [...new Set([...(existing.triggeredBy ?? []), ...module.triggeredBy])]
  }
  return [...byId.values()]
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
  for (const definition of CLASS_DEFS())
    for (const module of definition.classBuffDefs) consider(module)
  for (const module of GLOBAL_BUFF_DEFS) consider(module)
  return [...byId.values()]
}

export function dedupedMechanicBuffDefs(): BuffModule[] {
  const byId = new Map<string, BuffModule>()
  for (const module of mechanicBuffDefs()) {
    const existing = byId.get(module.id)
    if (!existing) {
      byId.set(module.id, { ...module })
      continue
    }
    if (module.triggeredBy?.length)
      existing.triggeredBy = [...new Set([...(existing.triggeredBy ?? []), ...module.triggeredBy])]
  }
  return [...byId.values()]
}

export function catalogBuffDefs(classId?: string): BuffModule[] {
  const byId = new Map<string, BuffModule>()
  const base = classId ? buffDefsForClass(classId) : allBuffDefsDeduped()
  const mechanics = classId ? dedupedMechanicBuffDefsForClass(classId) : dedupedMechanicBuffDefs()
  for (const module of base) byId.set(module.id, module)
  for (const module of mechanics) {
    const existing = byId.get(module.id)
    if (!existing) {
      byId.set(module.id, module)
      continue
    }
    if (module.triggeredBy?.length)
      existing.triggeredBy = [...new Set([...(existing.triggeredBy ?? []), ...module.triggeredBy])]
  }
  return [...byId.values()]
}
