import { CAST } from "../ids"
import { SKILL } from "./ids"
import { throwSkill } from "./throwChain"
import { FIRST_THROW } from "./throwTimings"

export const scarletSpin = throwSkill({
  id: SKILL.scarletSpin,
  name: "Scarlet Spin",
  castTag: CAST.dustScarletSpin,
  kind: "first",
  offeredCatchId: SKILL.perfectCatchAfterFirst,
  phantomMinTier: 1,
  ...FIRST_THROW,
})
