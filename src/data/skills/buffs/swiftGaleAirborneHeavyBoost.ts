import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { swiftGale } from "../../sets/swiftGale"

// "Increases Airborne Heavy Attack by 10% and knocks the target." (in-game
// set tooltip, 2026-09-24.) The knock-down carries no damage row. No skill
// this app models is an airborne heavy attack, so no `receives` names this
// id — authored for the set it belongs to, never reachable on a dummy.
export const swiftGaleAirborneHeavyBoost = defineBuff({
  id: BUFF.swiftGaleAirborneHeavyBoost,
  name: "Swift Gale",
  requires: { set: swiftGale.siteKey },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +10% (airborne Heavy Attack hits only)",
  effects: [stat("allDamageBoost", 0.1)],
})
