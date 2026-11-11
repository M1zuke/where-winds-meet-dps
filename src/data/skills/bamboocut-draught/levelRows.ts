import { artLevelRows, defineLevelRows } from "../../../definitions/skills/levelRowsDef"

// In-game values as of 2026-11-10, one row per martial-art level a breakthrough selects.
export const LEVEL_ROWS = defineLevelRows({
  bladeAgainstWavesHit0: artLevelRows({
    90: {
      physMultiplier: 0.315162,
      attributeMultiplier: 0.472743,
      physFixed: 63.6,
      attributeFixed: 36,
    },
    95: {
      physMultiplier: 0.315312,
      attributeMultiplier: 0.472968,
      physFixed: 73.2,
      attributeFixed: 40.8,
    },
    100: {
      physMultiplier: 0.315462,
      attributeMultiplier: 0.473193,
      physFixed: 87.6,
      attributeFixed: 47.7,
    },
  }),
  bladeAgainstWavesHit1: artLevelRows({
    90: {
      physMultiplier: 0.735378,
      attributeMultiplier: 1.103067,
      physFixed: 148.4,
      attributeFixed: 84,
    },
    95: {
      physMultiplier: 0.735728,
      attributeMultiplier: 1.103592,
      physFixed: 170.8,
      attributeFixed: 95.2,
    },
    100: {
      physMultiplier: 0.736078,
      attributeMultiplier: 1.104117,
      physFixed: 204.4,
      attributeFixed: 111.3,
    },
  }),
  bladeVesselHit1: artLevelRows({
    90: {
      physMultiplier: 0.1657942,
      attributeMultiplier: 0.2486913,
      physFixed: 33.462,
      attributeFixed: 19.019,
    },
    95: {
      physMultiplier: 0.1658657,
      attributeMultiplier: 0.24879855,
      physFixed: 38.467,
      attributeFixed: 21.45,
    },
    100: {
      physMultiplier: 0.1659372,
      attributeMultiplier: 0.2489058,
      physFixed: 46.046,
      attributeFixed: 25.025,
    },
  }),
  bladeVesselHit9: artLevelRows({
    90: {
      physMultiplier: 0.34572,
      attributeMultiplier: 0.51858,
      physFixed: 70.2,
      attributeFixed: 39.6,
    },
    95: {
      physMultiplier: 0.34602,
      attributeMultiplier: 0.51903,
      physFixed: 80.4,
      attributeFixed: 45,
    },
    100: {
      physMultiplier: 0.34632,
      attributeMultiplier: 0.51948,
      physFixed: 96.6,
      attributeFixed: 52.2,
    },
  }),
  bloombreakHit0: artLevelRows({
    90: {
      physMultiplier: 0.34292,
      attributeMultiplier: 0.51438,
      physFixed: 70,
      attributeFixed: 40,
    },
    95: {
      physMultiplier: 0.34342,
      attributeMultiplier: 0.51513,
      physFixed: 80,
      attributeFixed: 45,
    },
    100: {
      physMultiplier: 0.34392,
      attributeMultiplier: 0.51588,
      physFixed: 96,
      attributeFixed: 52,
    },
  }),
  bloombreakHit1: artLevelRows({
    90: {
      physMultiplier: 0.22628,
      attributeMultiplier: 0.33942,
      physFixed: 46,
      attributeFixed: 26,
    },
    95: {
      physMultiplier: 0.22678,
      attributeMultiplier: 0.34017,
      physFixed: 53,
      attributeFixed: 30,
    },
    100: {
      physMultiplier: 0.22728,
      attributeMultiplier: 0.34092,
      physFixed: 64,
      attributeFixed: 35,
    },
  }),
  bloombreakHit2: artLevelRows({
    90: {
      physMultiplier: 0.36625,
      attributeMultiplier: 0.549375,
      physFixed: 75,
      attributeFixed: 42,
    },
    95: {
      physMultiplier: 0.36675,
      attributeMultiplier: 0.550125,
      physFixed: 86,
      attributeFixed: 48,
    },
    100: {
      physMultiplier: 0.36725,
      attributeMultiplier: 0.550875,
      physFixed: 103,
      attributeFixed: 56,
    },
  }),
  bloombreakHit3: artLevelRows({
    90: {
      physMultiplier: 0.32892,
      attributeMultiplier: 0.49338,
      physFixed: 67,
      attributeFixed: 38,
    },
    95: {
      physMultiplier: 0.32942,
      attributeMultiplier: 0.49413,
      physFixed: 77,
      attributeFixed: 43,
    },
    100: {
      physMultiplier: 0.32992,
      attributeMultiplier: 0.49488,
      physFixed: 92,
      attributeFixed: 50,
    },
  }),
  bloombreakHit4: artLevelRows({
    90: {
      physMultiplier: 0.46345,
      attributeMultiplier: 0.695175,
      physFixed: 94,
      attributeFixed: 53,
    },
    95: {
      physMultiplier: 0.46395,
      attributeMultiplier: 0.695925,
      physFixed: 108,
      attributeFixed: 60,
    },
    100: {
      physMultiplier: 0.46445,
      attributeMultiplier: 0.696675,
      physFixed: 130,
      attributeFixed: 70,
    },
  }),
  bloombreakHit5: artLevelRows({
    90: {
      physMultiplier: 0.65396,
      attributeMultiplier: 0.98094,
      physFixed: 132,
      attributeFixed: 75,
    },
    95: {
      physMultiplier: 0.65446,
      attributeMultiplier: 0.98169,
      physFixed: 152,
      attributeFixed: 85,
    },
    100: {
      physMultiplier: 0.65496,
      attributeMultiplier: 0.98244,
      physFixed: 182,
      attributeFixed: 99,
    },
  }),
  boundvesselHit0: artLevelRows({
    90: {
      physMultiplier: 0.299765,
      attributeMultiplier: 0.4496475,
      physFixed: 60.5,
      attributeFixed: 34.5,
    },
    95: {
      physMultiplier: 0.300015,
      attributeMultiplier: 0.4500225,
      physFixed: 69.5,
      attributeFixed: 39,
    },
    100: {
      physMultiplier: 0.300265,
      attributeMultiplier: 0.4503975,
      physFixed: 83.5,
      attributeFixed: 45.5,
    },
  }),
  boundvesselHit13: artLevelRows({
    90: {
      physMultiplier: 0.11524,
      attributeMultiplier: 0.17286,
      physFixed: 23.4,
      attributeFixed: 13.2,
    },
    95: {
      physMultiplier: 0.11534,
      attributeMultiplier: 0.17301,
      physFixed: 26.8,
      attributeFixed: 15,
    },
    100: {
      physMultiplier: 0.11544,
      attributeMultiplier: 0.17316,
      physFixed: 32.2,
      attributeFixed: 17.4,
    },
  }),
  boundvesselHit15: artLevelRows({
    90: {
      physMultiplier: 0.23048,
      attributeMultiplier: 0.34572,
      physFixed: 46.8,
      attributeFixed: 26.4,
    },
    95: {
      physMultiplier: 0.23068,
      attributeMultiplier: 0.34602,
      physFixed: 53.6,
      attributeFixed: 30,
    },
    100: {
      physMultiplier: 0.23088,
      attributeMultiplier: 0.34632,
      physFixed: 64.4,
      attributeFixed: 34.8,
    },
  }),
  boundvesselHit2: artLevelRows({
    90: {
      physMultiplier: 0.1585766,
      attributeMultiplier: 0.2378649,
      physFixed: 31.941,
      attributeFixed: 18.2,
    },
    95: {
      physMultiplier: 0.1586221,
      attributeMultiplier: 0.23793315,
      physFixed: 36.673,
      attributeFixed: 20.475,
    },
    100: {
      physMultiplier: 0.1586676,
      attributeMultiplier: 0.2380014,
      physFixed: 43.953,
      attributeFixed: 23.933,
    },
  }),
  castlinkHit0: artLevelRows({
    90: {
      physMultiplier: 0.615665,
      attributeMultiplier: 0.9234975,
      physFixed: 124,
      attributeFixed: 70.5,
    },
    95: {
      physMultiplier: 0.615915,
      attributeMultiplier: 0.9238725,
      physFixed: 142.5,
      attributeFixed: 79.5,
    },
    100: {
      physMultiplier: 0.616165,
      attributeMultiplier: 0.9242475,
      physFixed: 171,
      attributeFixed: 93,
    },
  }),
  castlinkHit0Jadeflush: artLevelRows({
    90: {
      physMultiplier: 0.635105,
      attributeMultiplier: 0.9526575,
      physFixed: 127.75,
      attributeFixed: 72.75,
    },
    95: {
      physMultiplier: 0.63523,
      attributeMultiplier: 0.952845,
      physFixed: 146.75,
      attributeFixed: 82,
    },
    100: {
      physMultiplier: 0.635355,
      attributeMultiplier: 0.9530325,
      physFixed: 176,
      attributeFixed: 95.75,
    },
  }),
  dragonquenchInebriateHit0: artLevelRows({
    90: {
      physMultiplier: 0.68714,
      attributeMultiplier: 1.03071,
      physFixed: 139,
      attributeFixed: 79,
    },
    95: {
      physMultiplier: 0.68764,
      attributeMultiplier: 1.03146,
      physFixed: 160,
      attributeFixed: 89,
    },
    100: {
      physMultiplier: 0.68814,
      attributeMultiplier: 1.03221,
      physFixed: 191,
      attributeFixed: 104,
    },
  }),
  dragonquenchInebriateHit1: artLevelRows({
    90: {
      physMultiplier: 0.66044,
      attributeMultiplier: 0.99066,
      physFixed: 134,
      attributeFixed: 76,
    },
    95: {
      physMultiplier: 0.66094,
      attributeMultiplier: 0.99141,
      physFixed: 154,
      attributeFixed: 86,
    },
    100: {
      physMultiplier: 0.66144,
      attributeMultiplier: 0.99216,
      physFixed: 184,
      attributeFixed: 100,
    },
  }),
  dragonquenchInebriateHit2: artLevelRows({
    90: {
      physMultiplier: 0.80598,
      attributeMultiplier: 1.20897,
      physFixed: 163,
      attributeFixed: 92,
    },
    95: {
      physMultiplier: 0.80648,
      attributeMultiplier: 1.20972,
      physFixed: 187,
      attributeFixed: 104,
    },
    100: {
      physMultiplier: 0.80698,
      attributeMultiplier: 1.21047,
      physFixed: 224,
      attributeFixed: 122,
    },
  }),
  dragonquenchInebriateHit3: artLevelRows({
    90: {
      physMultiplier: 0.546108,
      attributeMultiplier: 0.819162,
      physFixed: 110.1,
      attributeFixed: 62.4,
    },
    95: {
      physMultiplier: 0.546258,
      attributeMultiplier: 0.819387,
      physFixed: 126.3,
      attributeFixed: 70.5,
    },
    100: {
      physMultiplier: 0.546408,
      attributeMultiplier: 0.819612,
      physFixed: 151.5,
      attributeFixed: 82.5,
    },
  }),
  dragonquenchInebriateHit5: artLevelRows({
    90: {
      physMultiplier: 0.728144,
      attributeMultiplier: 1.092216,
      physFixed: 146.8,
      attributeFixed: 83.2,
    },
    95: {
      physMultiplier: 0.728344,
      attributeMultiplier: 1.092516,
      physFixed: 168.4,
      attributeFixed: 94,
    },
    100: {
      physMultiplier: 0.728544,
      attributeMultiplier: 1.092816,
      physFixed: 202,
      attributeFixed: 110,
    },
  }),
  dualBladesLightAttack1Hit0: artLevelRows({
    90: {
      physMultiplier: 0.41949,
      attributeMultiplier: 0.629235,
      physFixed: 85,
      attributeFixed: 48,
    },
    95: {
      physMultiplier: 0.41999,
      attributeMultiplier: 0.629985,
      physFixed: 98,
      attributeFixed: 55,
    },
    100: {
      physMultiplier: 0.42049,
      attributeMultiplier: 0.630735,
      physFixed: 117,
      attributeFixed: 64,
    },
  }),
  dualBladesLightAttack2Hit0: artLevelRows({
    90: {
      physMultiplier: 0.22492,
      attributeMultiplier: 0.33738,
      physFixed: 45.5,
      attributeFixed: 26,
    },
    95: {
      physMultiplier: 0.22517,
      attributeMultiplier: 0.337755,
      physFixed: 52.5,
      attributeFixed: 29,
    },
    100: {
      physMultiplier: 0.22542,
      attributeMultiplier: 0.33813,
      physFixed: 63,
      attributeFixed: 34,
    },
  }),
  dualBladesLightAttack3Hit0: artLevelRows({
    90: {
      physMultiplier: 0.2881,
      attributeMultiplier: 0.43215,
      physFixed: 58.5,
      attributeFixed: 33,
    },
    95: {
      physMultiplier: 0.28835,
      attributeMultiplier: 0.432525,
      physFixed: 67,
      attributeFixed: 37.5,
    },
    100: {
      physMultiplier: 0.2886,
      attributeMultiplier: 0.4329,
      physFixed: 80.5,
      attributeFixed: 43.5,
    },
  }),
  dualBladesLightAttack4Hit0: artLevelRows({
    90: {
      physMultiplier: 0.253595,
      attributeMultiplier: 0.3803925,
      physFixed: 51.5,
      attributeFixed: 29,
    },
    95: {
      physMultiplier: 0.253845,
      attributeMultiplier: 0.3807675,
      physFixed: 59,
      attributeFixed: 33,
    },
    100: {
      physMultiplier: 0.254095,
      attributeMultiplier: 0.3811425,
      physFixed: 71,
      attributeFixed: 38.5,
    },
  }),
  gauntletsDualHit0: artLevelRows({
    90: {
      physMultiplier: 0.30824,
      attributeMultiplier: 0.46236,
      physFixed: 62.4,
      attributeFixed: 35.2,
    },
    95: {
      physMultiplier: 0.30844,
      attributeMultiplier: 0.46266,
      physFixed: 71.6,
      attributeFixed: 40,
    },
    100: {
      physMultiplier: 0.30864,
      attributeMultiplier: 0.46296,
      physFixed: 85.6,
      attributeFixed: 46.8,
    },
  }),
  gauntletsDualHit1: artLevelRows({
    90: {
      physMultiplier: 0.46236,
      attributeMultiplier: 0.69354,
      physFixed: 93.6,
      attributeFixed: 52.8,
    },
    95: {
      physMultiplier: 0.46266,
      attributeMultiplier: 0.69399,
      physFixed: 107.4,
      attributeFixed: 60,
    },
    100: {
      physMultiplier: 0.46296,
      attributeMultiplier: 0.69444,
      physFixed: 128.4,
      attributeFixed: 70.2,
    },
  }),
  herosBloodHit1: artLevelRows({
    90: {
      physMultiplier: 0.328865,
      attributeMultiplier: 0.4932975,
      physFixed: 66.5,
      attributeFixed: 38,
    },
    95: {
      physMultiplier: 0.329115,
      attributeMultiplier: 0.4936725,
      physFixed: 76.5,
      attributeFixed: 42.5,
    },
    100: {
      physMultiplier: 0.329365,
      attributeMultiplier: 0.4940475,
      physFixed: 91.5,
      attributeFixed: 50,
    },
  }),
  herosBloodInebriateHit1: artLevelRows({
    90: {
      physMultiplier: 2.0391,
      attributeMultiplier: 3.05865,
      physFixed: 410.1,
      attributeFixed: 233.4,
    },
    95: {
      physMultiplier: 2.03925,
      attributeMultiplier: 3.058875,
      physFixed: 471,
      attributeFixed: 263.4,
    },
    100: {
      physMultiplier: 2.0394,
      attributeMultiplier: 3.0591,
      physFixed: 564,
      attributeFixed: 307.5,
    },
  }),
  herosBloodInebriateHit10: artLevelRows({
    90: {
      physMultiplier: 1.01955,
      attributeMultiplier: 1.529325,
      physFixed: 205.05,
      attributeFixed: 116.7,
    },
    95: {
      physMultiplier: 1.019625,
      attributeMultiplier: 1.5294375,
      physFixed: 235.5,
      attributeFixed: 131.7,
    },
    100: {
      physMultiplier: 1.0197,
      attributeMultiplier: 1.52955,
      physFixed: 282,
      attributeFixed: 153.75,
    },
  }),
  herosBloodInebriateHit2: artLevelRows({
    90: {
      physMultiplier: 0.33985,
      attributeMultiplier: 0.509775,
      physFixed: 68.35,
      attributeFixed: 38.9,
    },
    95: {
      physMultiplier: 0.339875,
      attributeMultiplier: 0.5098125,
      physFixed: 78.5,
      attributeFixed: 43.9,
    },
    100: {
      physMultiplier: 0.3399,
      attributeMultiplier: 0.50985,
      physFixed: 94,
      attributeFixed: 51.25,
    },
  }),
  lightAttackHit0: artLevelRows({
    90: {
      physMultiplier: 0.35536,
      attributeMultiplier: 0.53304,
      physFixed: 72,
      attributeFixed: 41,
    },
    95: {
      physMultiplier: 0.35586,
      attributeMultiplier: 0.53379,
      physFixed: 83,
      attributeFixed: 46,
    },
    100: {
      physMultiplier: 0.35636,
      attributeMultiplier: 0.53454,
      physFixed: 100,
      attributeFixed: 54,
    },
  }),
  lightAttackHit1: artLevelRows({
    90: {
      physMultiplier: 0.156452,
      attributeMultiplier: 0.234678,
      physFixed: 32,
      attributeFixed: 18,
    },
    95: {
      physMultiplier: 0.156652,
      attributeMultiplier: 0.234978,
      physFixed: 36.4,
      attributeFixed: 20.4,
    },
    100: {
      physMultiplier: 0.156852,
      attributeMultiplier: 0.235278,
      physFixed: 44,
      attributeFixed: 23.6,
    },
  }),
  lightAttackHit2: artLevelRows({
    90: {
      physMultiplier: 0.234678,
      attributeMultiplier: 0.352017,
      physFixed: 48,
      attributeFixed: 27,
    },
    95: {
      physMultiplier: 0.234978,
      attributeMultiplier: 0.352467,
      physFixed: 54.6,
      attributeFixed: 30.6,
    },
    100: {
      physMultiplier: 0.235278,
      attributeMultiplier: 0.352917,
      physFixed: 66,
      attributeFixed: 35.4,
    },
  }),
  lightAttackHit3: artLevelRows({
    90: {
      physMultiplier: 0.25194,
      attributeMultiplier: 0.37791,
      physFixed: 52,
      attributeFixed: 29,
    },
    95: {
      physMultiplier: 0.25244,
      attributeMultiplier: 0.37866,
      physFixed: 59,
      attributeFixed: 33,
    },
    100: {
      physMultiplier: 0.25294,
      attributeMultiplier: 0.37941,
      physFixed: 71,
      attributeFixed: 39,
    },
  }),
  lightAttackHit4: artLevelRows({
    90: {
      physMultiplier: 0.31726,
      attributeMultiplier: 0.47589,
      physFixed: 65,
      attributeFixed: 37,
    },
    95: {
      physMultiplier: 0.31776,
      attributeMultiplier: 0.47664,
      physFixed: 74,
      attributeFixed: 41,
    },
    100: {
      physMultiplier: 0.31826,
      attributeMultiplier: 0.47739,
      physFixed: 89,
      attributeFixed: 48,
    },
  }),
  lightAttackHit5: artLevelRows({
    90: {
      physMultiplier: 0.186544,
      attributeMultiplier: 0.279816,
      physFixed: 38,
      attributeFixed: 21.6,
    },
    95: {
      physMultiplier: 0.186744,
      attributeMultiplier: 0.280116,
      physFixed: 43.6,
      attributeFixed: 24.4,
    },
    100: {
      physMultiplier: 0.186944,
      attributeMultiplier: 0.280416,
      physFixed: 52,
      attributeFixed: 28.4,
    },
  }),
  lightAttackHit6: artLevelRows({
    90: {
      physMultiplier: 0.279816,
      attributeMultiplier: 0.419724,
      physFixed: 57,
      attributeFixed: 32.4,
    },
    95: {
      physMultiplier: 0.280116,
      attributeMultiplier: 0.420174,
      physFixed: 65.4,
      attributeFixed: 36.6,
    },
    100: {
      physMultiplier: 0.280416,
      attributeMultiplier: 0.420624,
      physFixed: 78,
      attributeFixed: 42.6,
    },
  }),
  lightAttackHit7: artLevelRows({
    90: { physMultiplier: 0.8192, attributeMultiplier: 1.2288, physFixed: 166, attributeFixed: 94 },
    95: {
      physMultiplier: 0.8197,
      attributeMultiplier: 1.22955,
      physFixed: 190,
      attributeFixed: 106,
    },
    100: {
      physMultiplier: 0.8202,
      attributeMultiplier: 1.2303,
      physFixed: 228,
      attributeFixed: 124,
    },
  }),
  nightwickGrounddriftHit0: artLevelRows({
    90: {
      physMultiplier: 0.57173,
      attributeMultiplier: 0.857595,
      physFixed: 115.25,
      attributeFixed: 65.5,
    },
    95: {
      physMultiplier: 0.571855,
      attributeMultiplier: 0.8577825,
      physFixed: 132.25,
      attributeFixed: 74,
    },
    100: {
      physMultiplier: 0.57198,
      attributeMultiplier: 0.85797,
      physFixed: 158.25,
      attributeFixed: 86.25,
    },
  }),
  nightwickPrimepickFollowUpHit0: artLevelRows({
    90: {
      physMultiplier: 0.64465,
      attributeMultiplier: 0.966975,
      physFixed: 130,
      attributeFixed: 74,
    },
    95: {
      physMultiplier: 0.64515,
      attributeMultiplier: 0.967725,
      physFixed: 150,
      attributeFixed: 84,
    },
    100: {
      physMultiplier: 0.64565,
      attributeMultiplier: 0.968475,
      physFixed: 180,
      attributeFixed: 98,
    },
  }),
  nightwickPrimepickHit0: artLevelRows({
    90: {
      physMultiplier: 0.9434,
      attributeMultiplier: 1.4151,
      physFixed: 191,
      attributeFixed: 108,
    },
    95: {
      physMultiplier: 0.9439,
      attributeMultiplier: 1.41585,
      physFixed: 219,
      attributeFixed: 122,
    },
    100: {
      physMultiplier: 0.9444,
      attributeMultiplier: 1.4166,
      physFixed: 262,
      attributeFixed: 143,
    },
  }),
  peakfallHit0: artLevelRows({
    90: {
      physMultiplier: 0.91834,
      attributeMultiplier: 1.37751,
      physFixed: 185,
      attributeFixed: 105,
    },
    95: {
      physMultiplier: 0.91884,
      attributeMultiplier: 1.37826,
      physFixed: 213,
      attributeFixed: 119,
    },
    100: {
      physMultiplier: 0.91934,
      attributeMultiplier: 1.37901,
      physFixed: 255,
      attributeFixed: 139,
    },
  }),
  peakfallHit0GauntletQJadeflush: artLevelRows({
    90: {
      physMultiplier: 0.78732,
      attributeMultiplier: 1.18098,
      physFixed: 158.5,
      attributeFixed: 90,
    },
    95: {
      physMultiplier: 0.78757,
      attributeMultiplier: 1.181355,
      physFixed: 182.5,
      attributeFixed: 102,
    },
    100: {
      physMultiplier: 0.78782,
      attributeMultiplier: 1.18173,
      physFixed: 218.5,
      attributeFixed: 119,
    },
  }),
  realmplayHit0: artLevelRows({
    90: { physMultiplier: 0.4015, attributeMultiplier: 0.60225, physFixed: 81, attributeFixed: 46 },
    95: {
      physMultiplier: 0.40175,
      attributeMultiplier: 0.602625,
      physFixed: 93,
      attributeFixed: 52,
    },
    100: {
      physMultiplier: 0.402,
      attributeMultiplier: 0.603,
      physFixed: 111.5,
      attributeFixed: 61,
    },
  }),
  reveldriftHit0: artLevelRows({
    90: {
      physMultiplier: 0.2637625,
      attributeMultiplier: 0.39564375,
      physFixed: 53.25,
      attributeFixed: 30.25,
    },
    95: {
      physMultiplier: 0.2638875,
      attributeMultiplier: 0.39583125,
      physFixed: 61.25,
      attributeFixed: 34.25,
    },
    100: {
      physMultiplier: 0.2640125,
      attributeMultiplier: 0.39601875,
      physFixed: 73.25,
      attributeFixed: 40,
    },
  }),
  tidepourHit0: artLevelRows({
    90: {
      physMultiplier: 0.36586,
      attributeMultiplier: 0.54879,
      physFixed: 74,
      attributeFixed: 42,
    },
    95: {
      physMultiplier: 0.36611,
      attributeMultiplier: 0.549165,
      physFixed: 85,
      attributeFixed: 47.5,
    },
    100: {
      physMultiplier: 0.36636,
      attributeMultiplier: 0.54954,
      physFixed: 102,
      attributeFixed: 55.5,
    },
  }),
  twinbladesDualHit0: artLevelRows({
    90: {
      physMultiplier: 0.36596,
      attributeMultiplier: 0.54894,
      physFixed: 74,
      attributeFixed: 42,
    },
    95: {
      physMultiplier: 0.36621,
      attributeMultiplier: 0.549315,
      physFixed: 85,
      attributeFixed: 47.5,
    },
    100: {
      physMultiplier: 0.36646,
      attributeMultiplier: 0.54969,
      physFixed: 102,
      attributeFixed: 55.5,
    },
  }),
})
