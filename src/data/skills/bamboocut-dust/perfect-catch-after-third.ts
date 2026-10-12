import { CAST } from "../ids"
import { SKILL } from "./ids"
import { throwSkill } from "./throwChain"
import { FOURTH_THROW } from "./throwTimings"

export const perfectCatchAfterThird = throwSkill({
  id: SKILL.perfectCatchAfterThird,
  name: "Perfect Catch (after 3rd throw)",
  castTag: CAST.dustPerfectCatchAfterThird,
  kind: "catch",
  offeredCatchId: SKILL.perfectCatchAfterFirst,
  phantomMinTier: 1,
  ...FOURTH_THROW,
})
