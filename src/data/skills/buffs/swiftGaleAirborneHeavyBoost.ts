import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { swiftGale } from "../../sets/swiftGale"

// Airborne Heavy Attack skills deal 10% more damage (in-game values as of
// 2026-11-11); the knock-down carries no damage row.
export const swiftGaleAirborneHeavyBoost = defineBuff({
  id: BUFF.swiftGaleAirborneHeavyBoost,
  name: "Swift Gale",
  requires: { set: swiftGale.siteKey },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +10% (airborne Heavy Attack hits only)",
  effects: [stat("allDamageBoost", 0.1)],
})
