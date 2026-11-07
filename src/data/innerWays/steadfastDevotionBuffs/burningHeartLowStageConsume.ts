import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "../../skills/buffs/ids"
import { PROP } from "../../skills/ids"

export const burningHeartLowStageConsume = defineBuff({
  id: BUFF.burningHeartLowStageConsume,
  name: "Burning Heart (Stage 1-2 Consume)",
  duration: 0,
  perCastConsume: {
    property: PROP.consumesInnerPassionBurningHeartLowStage,
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
  effects: [],
})
