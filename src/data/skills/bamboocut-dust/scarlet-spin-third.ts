import { CAST } from "../ids"
import { SKILL } from "./ids"
import { throwSkill } from "./throwChain"
import { THIRD_THROW } from "./throwTimings"

export const scarletSpinThird = throwSkill({
  id: SKILL.scarletSpinThird,
  name: "Scarlet Spin (3rd throw)",
  castTag: CAST.dustScarletSpinThird,
  kind: "rethrow",
  offeredCatchId: SKILL.perfectCatchAfterThird,
  phantomMinTier: 6,
  ...THIRD_THROW,
})
