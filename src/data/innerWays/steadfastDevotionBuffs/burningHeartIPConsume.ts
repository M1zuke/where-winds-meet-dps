import { defineClassBuff } from "../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../skills/buffs/ids"
import { PROP } from "../../skills/ids"
import { damageMultiplier } from "../../../engine/effects/effect"

// Inner Passion is drained before Charge Enhancement. Only the Charge
// Enhancement route attaches Mountain Splitter, and only to this cast and the
// Anxi chain it generates — it never opens or resets Mountain Splitter's own
// tier-3 window or its cooldown.
export const burningHeartIPConsume = defineClassBuff({
  id: BUFF.burningHeartIPConsume,
  name: "Burning Heart (IP Consume)",
  requires: { param: PARAM.steadfastDevotion, minTier: 4 },
  affectsAll: true,
  duration: 0,
  perCastConsume: {
    property: PROP.consumesInnerPassionBurningHeart,
    from: BUFF.chargeEnhancement,
    preferredFrom: [BUFF.innerPassion],
    grants: [
      {
        whenConsumedFrom: BUFF.chargeEnhancement,
        buffIds: [BUFF.mountainSplitter],
        propagate: true,
      },
    ],
  },
  summary: "×1.32 damage on a cast that consumes Inner Passion or Charge Enhancement",
  effects: (ctx) => (ctx.event.kind === "damage" ? [damageMultiplier(1.32)] : []),
})
