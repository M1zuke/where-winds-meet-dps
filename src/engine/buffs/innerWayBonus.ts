// Port of `zo()` (`.tmp/site/deobfuscated.js` ~L7743-65):
// `buffBonus += Ss[key].allDamageBonus` for every selected inner way. The
// values live with the other inner-way channels in
// `src/data/classes/innerWays.ts`.
import { innerWayScalar, type SlottedInnerWay } from "../../data/classes/innerWays"

export function innerWayAllDamageBoost(mindMethods: readonly SlottedInnerWay[]): number {
  return innerWayScalar(mindMethods, "allDamageBonus")
}
