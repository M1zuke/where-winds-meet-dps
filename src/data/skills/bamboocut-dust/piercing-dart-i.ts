import { CAST } from "../ids"
import { SKILL } from "./ids"
import { piercingDartSkills, TOKENS_BELOW_FIFTY } from "./piercingDartChain"

// In-game values as of 2026-10-12. The sweep frames are not measurable:
// provisional frames, evenly spaced from the clip start to 6 frames before the
// cast ends.
export const [piercingDartI] = piercingDartSkills({
  castFrames: 58,
  tokensCost: 0,
  tokensCondition: TOKENS_BELOW_FIFTY,
  segments: [
    {
      id: SKILL.piercingDartI,
      name: "Piercing Dart I",
      castTag: CAST.dustPiercingDartI,
      sweepFrames: [19, 35, 52],
    },
  ],
})
