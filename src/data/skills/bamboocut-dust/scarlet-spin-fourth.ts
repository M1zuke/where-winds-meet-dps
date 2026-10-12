import { CAST } from "../ids"
import { SKILL } from "./ids"
import { throwSkill } from "./throwChain"
import { FOURTH_THROW } from "./throwTimings"

export const scarletSpinFourth = throwSkill({
  id: SKILL.scarletSpinFourth,
  name: "Scarlet Spin (4th throw)",
  castTag: CAST.dustScarletSpinFourth,
  kind: "rethrow",
  offeredCatchId: SKILL.perfectCatchAfterFirst,
  phantomMinTier: 1,
  ...FOURTH_THROW,
})
