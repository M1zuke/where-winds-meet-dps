import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"
import { SWORD_MORPH_CONVERTED_AMOUNT_STATUS } from "../skills/bellstrike-splendor/buffs/vagrantSwordEndurance"

// "Unleashing multiple sword energy attacks consumes additional Endurance to
// increase damage by 1.5% per point consumed, up to 30%" (in-game English text,
// 2026-08-15). Reads the amount the release's own conversion trigger recorded
// it actually spent, not a live re-read of the meter itself.
export const swordMorphEnduranceBoost = defineBuff({
  id: BUFF.swordMorphEnduranceBoost,
  name: "Extra Endurance",
  requires: { param: PARAM.swordMorph },
  alwaysActive: true,
  duration: 9999,
  summary: "allDamageBoost +1.5%/Endurance spent, cap 30%",
  effects: (ctx) =>
    ctx.self.reachesEvent
      ? [
          stat(
            "allDamageBoost",
            0.015 * Math.floor(ctx.status.stacks(SWORD_MORPH_CONVERTED_AMOUNT_STATUS)),
          ),
        ]
      : [],
})
