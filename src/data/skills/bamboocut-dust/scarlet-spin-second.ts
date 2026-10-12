import { CAST } from "../ids"
import { SKILL } from "./ids"
import { throwSkill } from "./throwChain"
import { SECOND_THROW } from "./throwTimings"

export const scarletSpinSecond = throwSkill({
  id: SKILL.scarletSpinSecond,
  name: "Scarlet Spin (2nd throw)",
  castTag: CAST.dustScarletSpinSecond,
  kind: "rethrow",
  offeredCatchId: SKILL.perfectCatchAfterSecond,
  phantomMinTier: 6,
  ...SECOND_THROW,
})
