import type { SetDef } from "./setDef"
import { SET_DEFS } from "../../data/sets"
import { registerMechanic } from "../../engine/mechanics"

export { SET_DEFS }

for (const set of SET_DEFS) {
  for (const { mechanic, order } of set.mechanics ?? []) registerMechanic(mechanic, order)
}

export const SET_BY_ID: Readonly<Record<string, SetDef>> = Object.fromEntries(
  SET_DEFS.map((set) => [set.id, set]),
)

export function setDisplayNameForSiteKey(siteKey: string): string | undefined {
  return SET_DEFS.find((set) => set.siteKey === siteKey)?.name
}
