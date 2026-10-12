import { CAST } from "../ids"
import { SKILL } from "./ids"
import { throwSkill } from "./throwChain"
import { THIRD_THROW } from "./throwTimings"

export const perfectCatchAfterSecond = throwSkill({
  id: SKILL.perfectCatchAfterSecond,
  name: "Perfect Catch (after 2nd throw)",
  castTag: CAST.dustPerfectCatchAfterSecond,
  kind: "catch",
  offeredCatchId: SKILL.perfectCatchAfterThird,
  phantomMinTier: 6,
  ...THIRD_THROW,
})
