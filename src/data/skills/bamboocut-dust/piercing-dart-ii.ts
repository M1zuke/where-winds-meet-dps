import { CAST } from "../ids"
import { SKILL } from "./ids"
import { piercingDartSkills, TOKENS_FIFTY_TO_NINETY_NINE } from "./piercingDartChain"

// In-game values as of 2026-10-13.
export const [piercingDartII, piercingDartIISweeps4To5] = piercingDartSkills({
  castFrames: 71,
  tokensCost: 50,
  tokensCondition: TOKENS_FIFTY_TO_NINETY_NINE,
  segments: [
    {
      id: SKILL.piercingDartII,
      name: "Piercing Dart II",
      castTag: CAST.dustPiercingDartII,
      sweepFrames: [8, 20, 28],
    },
    {
      id: SKILL.piercingDartIISweeps4To5,
      name: "Piercing Dart II (sweeps 4-5)",
      castTag: CAST.dustPiercingDartIISweeps4To5,
      sweepFrames: [52, 64],
    },
  ],
})
