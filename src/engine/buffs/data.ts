import specMeta from "../../data/classes/specMeta.json"
import { SITE_BUFF_DEFS_BY_SPEC, GLOBAL_BUFF_DEFS, GROUP_BUFF_DEFS } from "../../data/skills/buffs"
import type { BuffModule } from "./buffModule"
import { MECHANIC_BUFF_DEFS } from "./mechanics"

interface SpecMetaFile {
  specIds: string[]
  defaultSpec: string
  onApplyHandlers: string[]
}

// The barrel already compiles every JSON-authored def to a `BuffModule` (via
// `legacyBuffModule`) and exports converted ones as native modules directly,
// so these three are `BuffModule[]` as-is — no wrapping left to do here.
const BUFFS: { specs: Record<string, BuffModule[]>; global: BuffModule[]; group: BuffModule[] } = {
  specs: SITE_BUFF_DEFS_BY_SPEC,
  global: GLOBAL_BUFF_DEFS,
  group: GROUP_BUFF_DEFS,
}
const META = specMeta as unknown as SpecMetaFile

export const SPEC_IDS: readonly string[] = META.specIds ?? []
export const DEFAULT_SPEC = META.defaultSpec

export const CLASS_SPEC: Record<string, string> = {
  bellstrikeUmbra: "bellstrike_umbra",
  bellstrikeRainbow: "bellstrike_splendor",
  silkbindJade: "silkbind_jade",
  stonesplitPower: "stonesplit_might",
  stonesplitBalancePureTang: "stonesplit_strength",
  bamboocutWindTwinblade: "bamboocut_dust",
  bamboocutDust: "bamboocut_dust",
  stonesplitBalanceDualCut: "bamboocut_dust",
}

export function specForClass(classId: string): string | undefined {
  return CLASS_SPEC[classId]
}

const UNIVERSAL_SPEC_BUFF_IDS = new Set<string>(["fluteBoost"])

export function buffDefsForSpec(spec: string): BuffModule[] {
  return [...(BUFFS.specs[spec] ?? []), ...(BUFFS.global ?? [])]
}

export function buffDefsForClass(classId: string): BuffModule[] {
  const spec = specForClass(classId)
  if (!spec) return allBuffDefsDeduped()
  const byId = new Map<string, BuffModule>()
  for (const module of BUFFS.specs[spec] ?? []) byId.set(module.id, { ...module })
  for (const module of BUFFS.global ?? [])
    if (!byId.has(module.id)) byId.set(module.id, { ...module })
  for (const otherSpec of SPEC_IDS) {
    if (otherSpec === spec) continue
    for (const module of BUFFS.specs[otherSpec] ?? []) {
      if (UNIVERSAL_SPEC_BUFF_IDS.has(module.id) && !byId.has(module.id))
        byId.set(module.id, { ...module })
    }
  }
  return [...byId.values()]
}

export function groupBuffDefs(): BuffModule[] {
  return BUFFS.group ?? []
}

export function mechanicBuffDefs(): BuffModule[] {
  return MECHANIC_BUFF_DEFS
}

export function mechanicBuffDefsForClass(classId: string): BuffModule[] {
  const spec = specForClass(classId)
  if (!spec) return MECHANIC_BUFF_DEFS
  return MECHANIC_BUFF_DEFS.filter((module) => !module.specs || module.specs.includes(spec))
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
  for (const spec of SPEC_IDS) for (const module of BUFFS.specs[spec] ?? []) consider(module)
  for (const module of BUFFS.global ?? []) consider(module)
  return [...byId.values()]
}

export function hasBuffData(spec: string): boolean {
  return !!BUFFS.specs[spec] && BUFFS.specs[spec].length > 0
}

export function dedupedMechanicBuffDefs(): BuffModule[] {
  const byId = new Map<string, BuffModule>()
  for (const module of MECHANIC_BUFF_DEFS) {
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
