import { artLevelRows, defineLevelRows } from "../../../definitions/skills/levelRowsDef"

// In-game values as of 2026-11-10, one row per martial-art level a breakthrough selects.
export const LEVEL_ROWS = defineLevelRows({
  spearDashHit0: artLevelRows({
    90: { physMultiplier: 0.62778, attributeMultiplier: 0.94167, physFixed: 127, attributeFixed: 72 },
    95: { physMultiplier: 0.62828, attributeMultiplier: 0.94242, physFixed: 146, attributeFixed: 81 },
    100: { physMultiplier: 0.62878, attributeMultiplier: 0.94317, physFixed: 175, attributeFixed: 95 },
  }),
  spearDualHit0: artLevelRows({
    90: { physMultiplier: 0.965, attributeMultiplier: 1.4475, physFixed: 195, attributeFixed: 111 },
    95: { physMultiplier: 0.9655, attributeMultiplier: 1.44825, physFixed: 224, attributeFixed: 125 },
    100: { physMultiplier: 0.966, attributeMultiplier: 1.449, physFixed: 268, attributeFixed: 146 },
  }),
  spearHeavy1Hit0: artLevelRows({
    90: { physMultiplier: 0.838572, attributeMultiplier: 1.257858, physFixed: 168.9, attributeFixed: 96 },
    95: { physMultiplier: 0.838722, attributeMultiplier: 1.258083, physFixed: 193.8, attributeFixed: 108.3 },
    100: { physMultiplier: 0.838872, attributeMultiplier: 1.258308, physFixed: 232.2, attributeFixed: 126.6 },
  }),
  spearHeavy2Hit0: artLevelRows({
    90: { physMultiplier: 0.69881, attributeMultiplier: 1.048215, physFixed: 140.75, attributeFixed: 80 },
    95: { physMultiplier: 0.698935, attributeMultiplier: 1.0484025, physFixed: 161.5, attributeFixed: 90.25 },
    100: { physMultiplier: 0.69906, attributeMultiplier: 1.04859, physFixed: 193.5, attributeFixed: 105.5 },
  }),
  spearHeavy3Hit0: artLevelRows({
    90: { physMultiplier: 1.257858, attributeMultiplier: 1.886787, physFixed: 253.35, attributeFixed: 144 },
    95: { physMultiplier: 1.258083, attributeMultiplier: 1.8871245, physFixed: 290.7, attributeFixed: 162.45 },
    100: { physMultiplier: 1.258308, attributeMultiplier: 1.887462, physFixed: 348.3, attributeFixed: 189.9 },
  }),
  spearheavyHit0: artLevelRows({
    90: { physMultiplier: 0.33142967, attributeMultiplier: 0.497144505, physFixed: 66.674, attributeFixed: 37.895 },
    95: { physMultiplier: 0.33145617, attributeMultiplier: 0.497184255, physFixed: 76.532, attributeFixed: 42.824 },
    100: { physMultiplier: 0.33148267, attributeMultiplier: 0.497224005, physFixed: 91.69, attributeFixed: 49.979 },
  }),
  spearheavyHit15: artLevelRows({
    90: { physMultiplier: 1.250678, attributeMultiplier: 1.876017, physFixed: 251.6, attributeFixed: 143 },
    95: { physMultiplier: 1.250778, attributeMultiplier: 1.876167, physFixed: 288.8, attributeFixed: 161.6 },
    100: { physMultiplier: 1.250878, attributeMultiplier: 1.876317, physFixed: 346, attributeFixed: 188.6 },
  }),
  spearheavyStage1Hit0: artLevelRows({
    90: { physMultiplier: 0.3752034, attributeMultiplier: 0.5628051, physFixed: 75.48, attributeFixed: 42.9 },
    95: { physMultiplier: 0.3752334, attributeMultiplier: 0.5628501, physFixed: 86.64, attributeFixed: 48.48 },
    100: { physMultiplier: 0.3752634, attributeMultiplier: 0.5628951, physFixed: 103.8, attributeFixed: 56.58 },
  }),
  spearheavyStage1Hit8: artLevelRows({
    90: { physMultiplier: 0.7504068, attributeMultiplier: 1.1256102, physFixed: 150.96, attributeFixed: 85.8 },
    95: { physMultiplier: 0.7504668, attributeMultiplier: 1.1257002, physFixed: 173.28, attributeFixed: 96.96 },
    100: { physMultiplier: 0.7505268, attributeMultiplier: 1.1257902, physFixed: 207.6, attributeFixed: 113.16 },
  }),
  spearLight1Hit0: artLevelRows({
    90: { physMultiplier: 0.3286365, attributeMultiplier: 0.49295475, physFixed: 66.15, attributeFixed: 37.65 },
    95: { physMultiplier: 0.3287115, attributeMultiplier: 0.49306725, physFixed: 76.05, attributeFixed: 42.45 },
    100: { physMultiplier: 0.3287865, attributeMultiplier: 0.49317975, physFixed: 91.05, attributeFixed: 49.65 },
  }),
  spearLight3Hit0: artLevelRows({
    90: { physMultiplier: 0.219091, attributeMultiplier: 0.3286365, physFixed: 44.1, attributeFixed: 25.1 },
    95: { physMultiplier: 0.219141, attributeMultiplier: 0.3287115, physFixed: 50.7, attributeFixed: 28.3 },
    100: { physMultiplier: 0.219191, attributeMultiplier: 0.3287865, physFixed: 60.7, attributeFixed: 33.1 },
  }),
  spearLight4Hit2: artLevelRows({
    90: { physMultiplier: 0.5477275, attributeMultiplier: 0.82159125, physFixed: 110.25, attributeFixed: 62.75 },
    95: { physMultiplier: 0.5478525, attributeMultiplier: 0.82177875, physFixed: 126.75, attributeFixed: 70.75 },
    100: { physMultiplier: 0.5479775, attributeMultiplier: 0.82196625, physFixed: 151.75, attributeFixed: 82.75 },
  }),
  spearqHit0: artLevelRows({
    90: { physMultiplier: 0.320883, attributeMultiplier: 0.4813245, physFixed: 64.65, attributeFixed: 36.75 },
    95: { physMultiplier: 0.320958, attributeMultiplier: 0.481437, physFixed: 74.25, attributeFixed: 41.55 },
    100: { physMultiplier: 0.321033, attributeMultiplier: 0.4815495, physFixed: 88.95, attributeFixed: 48.45 },
  }),
  spearqHit5: artLevelRows({
    90: { physMultiplier: 0.534805, attributeMultiplier: 0.8022075, physFixed: 107.75, attributeFixed: 61.25 },
    95: { physMultiplier: 0.53493, attributeMultiplier: 0.802395, physFixed: 123.75, attributeFixed: 69.25 },
    100: { physMultiplier: 0.535055, attributeMultiplier: 0.8025825, physFixed: 148.25, attributeFixed: 80.75 },
  }),
  spearspecial1HitCancelHit1: artLevelRows({
    90: { physMultiplier: 0.6845504, attributeMultiplier: 1.0268256, physFixed: 137.92, attributeFixed: 78.4 },
    95: { physMultiplier: 0.6847104, attributeMultiplier: 1.0270656, physFixed: 158.4, attributeFixed: 88.64 },
    100: { physMultiplier: 0.6848704, attributeMultiplier: 1.0273056, physFixed: 189.76, attributeFixed: 103.36 },
  }),
  spearspecial1HitCancelHit1RiverFlow: artLevelRows({
    90: { physMultiplier: 1.0268256, attributeMultiplier: 1.5402384, physFixed: 206.88, attributeFixed: 117.6 },
    95: { physMultiplier: 1.0270656, attributeMultiplier: 1.5405984, physFixed: 237.6, attributeFixed: 132.96 },
    100: { physMultiplier: 1.0273056, attributeMultiplier: 1.5409584, physFixed: 284.64, attributeFixed: 155.04 },
  }),
  spearspecial1HitCancelHit1SpringSurge: artLevelRows({
    90: { physMultiplier: 0.855688, attributeMultiplier: 1.283532, physFixed: 172.4, attributeFixed: 98 },
    95: { physMultiplier: 0.855888, attributeMultiplier: 1.283832, physFixed: 198, attributeFixed: 110.8 },
    100: { physMultiplier: 0.856088, attributeMultiplier: 1.284132, physFixed: 237.2, attributeFixed: 129.2 },
  }),
  spearspecialHit2RiverFlow: artLevelRows({
    90: { physMultiplier: 1.5402384, attributeMultiplier: 2.3103576, physFixed: 310.32, attributeFixed: 176.4 },
    95: { physMultiplier: 1.5405984, attributeMultiplier: 2.3108976, physFixed: 356.4, attributeFixed: 199.44 },
    100: { physMultiplier: 1.5409584, attributeMultiplier: 2.3114376, physFixed: 426.96, attributeFixed: 232.56 },
  }),
  spearspecialHit2SpringSurge: artLevelRows({
    90: { physMultiplier: 1.283532, attributeMultiplier: 1.925298, physFixed: 258.6, attributeFixed: 147 },
    95: { physMultiplier: 1.283832, attributeMultiplier: 1.925748, physFixed: 297, attributeFixed: 166.2 },
    100: { physMultiplier: 1.284132, attributeMultiplier: 1.926198, physFixed: 355.8, attributeFixed: 193.8 },
  }),
  swordChargeStage11HitHit0: artLevelRows({
    90: { physMultiplier: 0.402774, attributeMultiplier: 0.604161, physFixed: 81.15, attributeFixed: 46.05 },
    95: { physMultiplier: 0.402849, attributeMultiplier: 0.6042735, physFixed: 93.15, attributeFixed: 52.05 },
    100: { physMultiplier: 0.402924, attributeMultiplier: 0.604386, physFixed: 111.6, attributeFixed: 60.75 },
  }),
  swordChargeStage12HitHit1: artLevelRows({
    90: { physMultiplier: 0.268516, attributeMultiplier: 0.402774, physFixed: 54.1, attributeFixed: 30.7 },
    95: { physMultiplier: 0.268566, attributeMultiplier: 0.402849, physFixed: 62.1, attributeFixed: 34.7 },
    100: { physMultiplier: 0.268616, attributeMultiplier: 0.402924, physFixed: 74.4, attributeFixed: 40.5 },
  }),
  swordChargeStage15HitHit4: artLevelRows({
    90: { physMultiplier: 0.67129, attributeMultiplier: 1.006935, physFixed: 135.25, attributeFixed: 76.75 },
    95: { physMultiplier: 0.671415, attributeMultiplier: 1.0071225, physFixed: 155.25, attributeFixed: 86.75 },
    100: { physMultiplier: 0.67154, attributeMultiplier: 1.00731, physFixed: 186, attributeFixed: 101.25 },
  }),
  swordChargeStage1Level0Hit0: artLevelRows({
    90: { physMultiplier: 0.479074, attributeMultiplier: 0.718611, physFixed: 96.4, attributeFixed: 54.8 },
    95: { physMultiplier: 0.479174, attributeMultiplier: 0.718761, physFixed: 110.8, attributeFixed: 62 },
    100: { physMultiplier: 0.479274, attributeMultiplier: 0.718911, physFixed: 132.6, attributeFixed: 72.2 },
  }),
  swordChargeStage25HitHit4: artLevelRows({
    90: { physMultiplier: 0.805548, attributeMultiplier: 1.208322, physFixed: 162.3, attributeFixed: 92.1 },
    95: { physMultiplier: 0.805698, attributeMultiplier: 1.208547, physFixed: 186.3, attributeFixed: 104.1 },
    100: { physMultiplier: 0.805848, attributeMultiplier: 1.208772, physFixed: 223.2, attributeFixed: 121.5 },
  }),
  swordDashHit0: artLevelRows({
    90: { physMultiplier: 0.173164, attributeMultiplier: 0.259746, physFixed: 35, attributeFixed: 19.8 },
    95: { physMultiplier: 0.173264, attributeMultiplier: 0.259896, physFixed: 40.2, attributeFixed: 22.4 },
    100: { physMultiplier: 0.173364, attributeMultiplier: 0.260046, physFixed: 48.2, attributeFixed: 26.2 },
  }),
  swordDashHit1: artLevelRows({
    90: { physMultiplier: 0.692656, attributeMultiplier: 1.038984, physFixed: 140, attributeFixed: 79.2 },
    95: { physMultiplier: 0.693056, attributeMultiplier: 1.039584, physFixed: 160.8, attributeFixed: 89.6 },
    100: { physMultiplier: 0.693456, attributeMultiplier: 1.040184, physFixed: 192.8, attributeFixed: 104.8 },
  }),
  swordDualHit0: artLevelRows({
    90: { physMultiplier: 0.46376, attributeMultiplier: 0.69564, physFixed: 93.6, attributeFixed: 53.2 },
    95: { physMultiplier: 0.46396, attributeMultiplier: 0.69594, physFixed: 107.6, attributeFixed: 60 },
    100: { physMultiplier: 0.46416, attributeMultiplier: 0.69624, physFixed: 128.8, attributeFixed: 70 },
  }),
  swordDualHit1: artLevelRows({
    90: { physMultiplier: 0.69564, attributeMultiplier: 1.04346, physFixed: 140.4, attributeFixed: 79.8 },
    95: { physMultiplier: 0.69594, attributeMultiplier: 1.04391, physFixed: 161.4, attributeFixed: 90 },
    100: { physMultiplier: 0.69624, attributeMultiplier: 1.04436, physFixed: 193.2, attributeFixed: 105 },
  }),
  swordHeavy2Hit0: artLevelRows({
    90: { physMultiplier: 0.3593055, attributeMultiplier: 0.53895825, physFixed: 72.3, attributeFixed: 41.1 },
    95: { physMultiplier: 0.3593805, attributeMultiplier: 0.53907075, physFixed: 83.1, attributeFixed: 46.5 },
    100: { physMultiplier: 0.3594555, attributeMultiplier: 0.53918325, physFixed: 99.45, attributeFixed: 54.15 },
  }),
  swordHeavy3Hit1: artLevelRows({
    90: { physMultiplier: 0.718611, attributeMultiplier: 1.0779165, physFixed: 144.6, attributeFixed: 82.2 },
    95: { physMultiplier: 0.718761, attributeMultiplier: 1.0781415, physFixed: 166.2, attributeFixed: 93 },
    100: { physMultiplier: 0.718911, attributeMultiplier: 1.0783665, physFixed: 198.9, attributeFixed: 108.3 },
  }),
  swordLight1Hit0: artLevelRows({
    90: { physMultiplier: 0.268905, attributeMultiplier: 0.4033575, physFixed: 54.125, attributeFixed: 30.75 },
    95: { physMultiplier: 0.2689675, attributeMultiplier: 0.40345125, physFixed: 62.25, attributeFixed: 34.75 },
    100: { physMultiplier: 0.26903, attributeMultiplier: 0.403545, physFixed: 74.5, attributeFixed: 40.625 },
  }),
  swordLight2Hit1: artLevelRows({
    90: { physMultiplier: 0.322686, attributeMultiplier: 0.484029, physFixed: 64.95, attributeFixed: 36.9 },
    95: { physMultiplier: 0.322761, attributeMultiplier: 0.4841415, physFixed: 74.7, attributeFixed: 41.7 },
    100: { physMultiplier: 0.322836, attributeMultiplier: 0.484254, physFixed: 89.4, attributeFixed: 48.75 },
  }),
  swordLight3Hit1: artLevelRows({
    90: { physMultiplier: 0.161343, attributeMultiplier: 0.2420145, physFixed: 32.475, attributeFixed: 18.45 },
    95: { physMultiplier: 0.1613805, attributeMultiplier: 0.24207075, physFixed: 37.35, attributeFixed: 20.85 },
    100: { physMultiplier: 0.161418, attributeMultiplier: 0.242127, physFixed: 44.7, attributeFixed: 24.375 },
  }),
  swordLight4Hit0: artLevelRows({
    90: { physMultiplier: 0.645372, attributeMultiplier: 0.968058, physFixed: 129.9, attributeFixed: 73.8 },
    95: { physMultiplier: 0.645522, attributeMultiplier: 0.968283, physFixed: 149.4, attributeFixed: 83.4 },
    100: { physMultiplier: 0.645672, attributeMultiplier: 0.968508, physFixed: 178.8, attributeFixed: 97.5 },
  }),
  swordqfollowupHit1: artLevelRows({
    90: { physMultiplier: 0.407901, attributeMultiplier: 0.6118515, physFixed: 82.05, attributeFixed: 46.65 },
    95: { physMultiplier: 0.407976, attributeMultiplier: 0.611964, physFixed: 94.35, attributeFixed: 52.8 },
    100: { physMultiplier: 0.408051, attributeMultiplier: 0.6120765, physFixed: 112.95, attributeFixed: 61.5 },
  }),
  swordqfollowupHit3: artLevelRows({
    90: { physMultiplier: 0.815802, attributeMultiplier: 1.223703, physFixed: 164.1, attributeFixed: 93.3 },
    95: { physMultiplier: 0.815952, attributeMultiplier: 1.223928, physFixed: 188.7, attributeFixed: 105.6 },
    100: { physMultiplier: 0.816102, attributeMultiplier: 1.224153, physFixed: 225.9, attributeFixed: 123 },
  }),
  swordqHit0: artLevelRows({
    90: { physMultiplier: 0.543868, attributeMultiplier: 0.815802, physFixed: 109.4, attributeFixed: 62.2 },
    95: { physMultiplier: 0.543968, attributeMultiplier: 0.815952, physFixed: 125.8, attributeFixed: 70.4 },
    100: { physMultiplier: 0.544068, attributeMultiplier: 0.816102, physFixed: 150.6, attributeFixed: 82 },
  }),
  swordspecial3HitHit0: artLevelRows({
    90: { physMultiplier: 0.196154, attributeMultiplier: 0.294231, physFixed: 39.6, attributeFixed: 22.4 },
    95: { physMultiplier: 0.196254, attributeMultiplier: 0.294381, physFixed: 45.4, attributeFixed: 25.4 },
    100: { physMultiplier: 0.196354, attributeMultiplier: 0.294531, physFixed: 54.4, attributeFixed: 29.6 },
  }),
  swordspecial3HitHit1: artLevelRows({
    90: { physMultiplier: 0.392308, attributeMultiplier: 0.588462, physFixed: 79.2, attributeFixed: 44.8 },
    95: { physMultiplier: 0.392508, attributeMultiplier: 0.588762, physFixed: 90.8, attributeFixed: 50.8 },
    100: { physMultiplier: 0.392708, attributeMultiplier: 0.589062, physFixed: 108.8, attributeFixed: 59.2 },
  }),
})
