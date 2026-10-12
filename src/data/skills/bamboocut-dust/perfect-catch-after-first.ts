import { CAST } from "../ids"
import { SKILL } from "./ids"
import { throwSkill } from "./throwChain"
import { SECOND_THROW } from "./throwTimings"

export const perfectCatchAfterFirst = throwSkill({
  id: SKILL.perfectCatchAfterFirst,
  name: "Perfect Catch (after 1st throw)",
  castTag: CAST.dustPerfectCatchAfterFirst,
  kind: "catch",
  offeredCatchId: SKILL.perfectCatchAfterSecond,
  phantomMinTier: 6,
  ...SECOND_THROW,
})
