import { CAST } from "../ids"
import { SKILL } from "./ids"
import { piercingDartSkills, TOKENS_BELOW_FIFTY } from "./piercingDartChain"

// In-game values as of 2026-10-13.
export const [piercingDartI] = piercingDartSkills({
  castFrames: 58,
  tokensCost: 0,
  tokensCondition: TOKENS_BELOW_FIFTY,
  segments: [
    {
      id: SKILL.piercingDartI,
      name: "Piercing Dart I",
      castTag: CAST.dustPiercingDartI,
      sweepFrames: [8, 20, 28],
    },
  ],
})
