import type { ParamSourceKind } from "../skill"
import { innerWayForBuffParam } from "../../definitions/innerWays/registry"
import { setForBuffParam } from "../../definitions/sets/registry"
import { SCRIPT_IDS } from "../../data/skills/buffs/scriptOptions"
import { GLOBAL_BUFF_DEFS } from "../../data/skills/buffs"

export interface ParamSource {
  kind: ParamSourceKind
  id: string
  name: string
}

function scriptSourceOf(param: string): ParamSource | undefined {
  if (!(SCRIPT_IDS as readonly string[]).includes(param)) return undefined
  const name = GLOBAL_BUFF_DEFS.find((module) => module.id === param)?.name ?? param
  return { kind: "script", id: param, name }
}

// docs/TIMELINE.md § "Cast legality": a `castConditions` param condition's
// build mechanism, read off the registries that actually produce
// `BuffParams` entries — never a per-param lookup table.
export function paramSourceOf(param: string): ParamSource | undefined {
  const innerWay = innerWayForBuffParam(param)
  if (innerWay) return { kind: "innerWay", id: innerWay.id, name: innerWay.name }
  const set = setForBuffParam(param)
  if (set) return { kind: "set", id: set.id, name: set.name }
  return scriptSourceOf(param)
}
