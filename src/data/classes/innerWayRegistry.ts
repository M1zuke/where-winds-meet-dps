// Every inner way, and the ONE place its display name lives.
//
// Everything else — `ClassDef.classMindGroup`/`allowedMindMethods`, the
// panel-stat table, the conditional-rule tables, the inner-way defs, the site
// param map, saved profiles — refers to the `id`. Renaming an inner way is a
// one-line change here; before this, a rename silently broke its stats, its
// buff param, its context scalars and its mechanic gate, with nothing to
// catch it.
//
// Ids are stable identifiers, NOT translation keys: the UI renders
// `innerWayName(id)` through i18n, so the display name stays the translated
// string it always was.

export interface InnerWay {
  id: string
  name: string
}

export const INNER_WAYS = [
  { id: "bitterSeason", name: "Bitter Season" },
  { id: "insightfulStrike", name: "Insightful Strike" },
  { id: "moraleChant", name: "Morale Chant" },
  { id: "swordHorizon", name: "Sword Horizon" },
  { id: "wolfchasersArt", name: "Wolfchaser's Art" },
] as const satisfies readonly InnerWay[]

export type InnerWayId = (typeof INNER_WAYS)[number]["id"]

const byId = new Map<string, InnerWay>(INNER_WAYS.map((way) => [way.id, way]))
const byName = new Map<string, InnerWay>(INNER_WAYS.map((way) => [way.name, way]))

export function innerWayName(id: string): string {
  return byId.get(id)?.name ?? id
}

export function innerWayIdForName(name: string): string | null {
  return byName.get(name)?.id ?? null
}

// Accepts either, so a saved slot healed to an id and one still carrying a name
// resolve the same way.
export function resolveInnerWayId(nameOrId: string): string {
  if (!nameOrId) return ""
  if (byId.has(nameOrId)) return nameOrId
  return byName.get(nameOrId)?.id ?? nameOrId
}
