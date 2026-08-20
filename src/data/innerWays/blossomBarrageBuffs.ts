import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../skills/buffs/ids"
import { stat } from "../../engine/effects/effect"
import { requireInnerWayNodeTier } from "../../definitions/innerWays/innerWayDef"
import type { BuffModule } from "../../engine/buffs/buffModule"
import { INNER_WAY_NODE } from "./ids"
import { blossomBarrage } from "./blossomBarrage"

// blossomBarrage.ts and this module import each other — it for these
// factories' `buffDefs` entry, this module for `comboUmbLightBonusBuffDef`'s
// tier lookup — so every export below is a hoisted function, never a `const`,
// matching `wolfchasersArtBuffs.ts`'s own load-order workaround.
export function comboBuffDef(): BuffModule {
  return defineBuff({
    id: BUFF.combo,
    name: "Combo",
    requires: { param: PARAM.blossomBarrage },
    duration: 15,
    effects: [stat("allDamageBoost", 0.2)],
  })
}

let comboUmbLightBonusMinTier: number | undefined

export function comboUmbLightBonusBuffDef(): BuffModule {
  return defineBuff({
    id: BUFF.comboUmbLightBonus,
    name: "Combo (UmbLight)",
    requires: {
      param: PARAM.blossomBarrage,
      get minTier(): number {
        return (comboUmbLightBonusMinTier ??= requireInnerWayNodeTier(
          blossomBarrage,
          INNER_WAY_NODE.blossomBarrageSpringAwayBonus,
        ))
      },
    },
    requiresBuffActive: BUFF.combo,
    duration: 15,
    effects: [stat("allDamageBoost", 0.1)],
  })
}
