import { CAST } from "../ids"
import { SKILL } from "./ids"
import { piercingDartSkills, TOKENS_AT_LEAST_HUNDRED } from "./piercingDartChain"

// In-game values as of 2026-10-13. The 7th sweep frame is provisional: its
// in-game frame is not known, only that it falls inside the cast.
export const [piercingDartIII, piercingDartIIISweeps4To5, piercingDartIIISweeps6To7] =
  piercingDartSkills({
    castFrames: 124,
    tokensCost: 100,
    tokensCondition: TOKENS_AT_LEAST_HUNDRED,
    segments: [
      {
        id: SKILL.piercingDartIII,
        name: "Piercing Dart III",
        castTag: CAST.dustPiercingDartIII,
        sweepFrames: [8, 20, 28],
      },
      {
        id: SKILL.piercingDartIIISweeps4To5,
        name: "Piercing Dart III (sweeps 4-5)",
        castTag: CAST.dustPiercingDartIIISweeps4To5,
        sweepFrames: [52, 64],
      },
      {
        id: SKILL.piercingDartIIISweeps6To7,
        name: "Piercing Dart III (sweeps 6-7)",
        castTag: CAST.dustPiercingDartIIISweeps6To7,
        sweepFrames: [77, 118],
      },
    ],
  })
