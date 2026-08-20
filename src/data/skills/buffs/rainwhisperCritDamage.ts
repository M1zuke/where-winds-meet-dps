import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { stat } from "../../../engine/effects/effect"
import { rainwhisper } from "../../sets/rainwhisper"

// "4 Pieces: Increases all Critical DMG and healing by 10%, and further
// increases them by 15% when you have an HP shield applied by yourself."
// (in-game set tooltip, 18 Aug 2026). Healing is outside what this app models.
export const rainwhisperCritDamage = defineBuff({
  id: BUFF.rainwhisperCritDamage,
  name: "Rainwhisper",
  requires: { set: rainwhisper.siteKey },
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary: "critDamage +10%, +25% while a self-applied HP shield is up",
  effects: (ctx) => [stat("critDamageBoost", ctx.status.isActive(BUFF.rainwhisperShield) ? 0.25 : 0.1)],
})
