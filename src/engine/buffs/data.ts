import specMeta from "../../data/classes/specMeta.json"
import { SITE_BUFF_DEFS_BY_SPEC, GLOBAL_BUFF_DEFS, GROUP_BUFF_DEFS } from "../../data/skills/buffs"
import type { BuffDef } from "./buffDef"
import { MECHANIC_BUFF_DEFS } from "./mechanics"

interface SpecMetaFile {
  specIds: string[]
  defaultSpec: string
  onApplyHandlers: string[]
}

const BUFFS = {
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
  stonesplitStrength: "stonesplit_strength",
  bamboocutWindTwinblade: "bamboocut_dust",
  bamboocutDust: "bamboocut_dust",
}

export function specForClass(classId: string): string | undefined {
  return CLASS_SPEC[classId]
}

const UNIVERSAL_SPEC_BUFF_IDS = new Set<string>(["fluteBoost"])

export function buffDefsForSpec(spec: string): BuffDef[] {
  return [...(BUFFS.specs[spec] ?? []), ...(BUFFS.global ?? [])]
}

export function buffDefsForClass(classId: string): BuffDef[] {
  const spec = specForClass(classId)
  if (!spec) return allBuffDefsDeduped()
  const byId = new Map<string, BuffDef>()
  for (const d of BUFFS.specs[spec] ?? []) byId.set(d.id, { ...d })
  for (const d of BUFFS.global ?? []) if (!byId.has(d.id)) byId.set(d.id, { ...d })
  for (const s of SPEC_IDS) {
    if (s === spec) continue
    for (const d of BUFFS.specs[s] ?? []) {
      if (UNIVERSAL_SPEC_BUFF_IDS.has(d.id) && !byId.has(d.id)) byId.set(d.id, { ...d })
    }
  }
  return [...byId.values()]
}

export function groupBuffDefs(): BuffDef[] {
  return BUFFS.group ?? []
}

export function mechanicBuffDefs(): BuffDef[] {
  return MECHANIC_BUFF_DEFS
}

export function mechanicBuffDefsForClass(classId: string): BuffDef[] {
  const spec = specForClass(classId)
  if (!spec) return MECHANIC_BUFF_DEFS
  return MECHANIC_BUFF_DEFS.filter((d) => !d.spec || d.spec === spec)
}

export function dedupedMechanicBuffDefsForClass(classId: string): BuffDef[] {
  const byId = new Map<string, BuffDef>()
  for (const d of mechanicBuffDefsForClass(classId)) {
    const existing = byId.get(d.id)
    if (!existing) {
      byId.set(d.id, { ...d })
      continue
    }
    if (d.triggers?.length)
      existing.triggers = [...new Set([...(existing.triggers ?? []), ...d.triggers])]
  }
  return [...byId.values()]
}

export function allBuffDefsDeduped(): BuffDef[] {
  const byId = new Map<string, BuffDef>()
  const consider = (d: BuffDef) => {
    const existing = byId.get(d.id)
    if (!existing) {
      byId.set(d.id, { ...d })
      return
    }
    if (d.triggers?.length) {
      const merged = new Set([...(existing.triggers ?? []), ...d.triggers])
      existing.triggers = [...merged]
    }
  }
  for (const spec of SPEC_IDS) for (const d of BUFFS.specs[spec] ?? []) consider(d)
  for (const d of BUFFS.global ?? []) consider(d)
  return [...byId.values()]
}

export function hasBuffData(spec: string): boolean {
  return !!BUFFS.specs[spec] && BUFFS.specs[spec].length > 0
}

export function dedupedMechanicBuffDefs(): BuffDef[] {
  const byId = new Map<string, BuffDef>()
  for (const d of MECHANIC_BUFF_DEFS) {
    const existing = byId.get(d.id)
    if (!existing) {
      byId.set(d.id, { ...d })
      continue
    }
    if (d.triggers?.length)
      existing.triggers = [...new Set([...(existing.triggers ?? []), ...d.triggers])]
  }
  return [...byId.values()]
}

export function catalogBuffDefs(classId?: string): BuffDef[] {
  const byId = new Map<string, BuffDef>()
  const base = classId ? buffDefsForClass(classId) : allBuffDefsDeduped()
  const mechanics = classId ? dedupedMechanicBuffDefsForClass(classId) : dedupedMechanicBuffDefs()
  for (const d of base) byId.set(d.id, d)
  for (const d of mechanics) {
    const existing = byId.get(d.id)
    if (!existing) {
      byId.set(d.id, d)
      continue
    }
    if (d.triggers?.length)
      existing.triggers = [...new Set([...(existing.triggers ?? []), ...d.triggers])]
  }
  return [...byId.values()]
}
