import { defineLevelRows, mysticTierRows } from "../../../definitions/skills/levelRowsDef"

// In-game values as of 2026-11-10, one row per mystic tier a breakthrough selects.
export const LEVEL_ROWS = defineLevelRows({
  combustionDot: mysticTierRows({
    5: {
      physMultiplier: 0.2785286,
      attributeMultiplier: 0.4177929,
      physFixed: 34.3672,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 0.295506,
      attributeMultiplier: 0.443259,
      physFixed: 46.75,
      attributeFixed: 0,
    },
  }),
  combustionExplosion: mysticTierRows({
    5: {
      physMultiplier: 0.661667535751,
      attributeMultiplier: 0.992501303627,
      physFixed: 81.576,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 0.701728,
      attributeMultiplier: 1.052591,
      physFixed: 110.3386,
      attributeFixed: 0,
    },
  }),
  dragonFireSmolderFinisher: mysticTierRows({
    6: {
      physMultiplier: 1.41491,
      attributeMultiplier: 2.122364,
      physFixed: 225.8728,
      attributeFixed: 0,
    },
  }),
  dragonFireSmolderStrike: mysticTierRows({
    6: {
      physMultiplier: 1.283899,
      attributeMultiplier: 1.925849,
      physFixed: 204.9587,
      attributeFixed: 0,
    },
  }),
  dragonHead: mysticTierRows({
    5: {
      physMultiplier: 17.990698,
      attributeMultiplier: 26.986047,
      physFixed: 2218.7,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 19.07564,
      attributeMultiplier: 28.61346,
      physFixed: 3001.372,
      attributeFixed: 0,
    },
  }),
  dragonHeadPlus: mysticTierRows({
    6: {
      physMultiplier: 12.597266,
      attributeMultiplier: 18.895899,
      physFixed: 1999.4721,
      attributeFixed: 0,
    },
  }),
  fireBreathFinisher: mysticTierRows({
    5: {
      physMultiplier: 1.413585,
      attributeMultiplier: 2.1203775,
      physFixed: 174.42,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 1.49975,
      attributeMultiplier: 2.249625,
      physFixed: 237.2652,
      attributeFixed: 0,
    },
  }),
  fireBreathStrike: mysticTierRows({
    5: {
      physMultiplier: 1.2826975,
      attributeMultiplier: 1.92404625,
      physFixed: 158.27,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 1.360884,
      attributeMultiplier: 2.041327,
      physFixed: 215.2962,
      attributeFixed: 0,
    },
  }),
  fluteFinisher: mysticTierRows({
    5: {
      physMultiplier: 3.64549841282,
      attributeMultiplier: 5.46824761924,
      physFixed: 708.639792953,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 3.955457,
      attributeMultiplier: 5.933186,
      physFixed: 881.2783,
      attributeFixed: 0,
    },
  }),
  fluteStrike: mysticTierRows({
    5: {
      physMultiplier: 1.36706190481,
      attributeMultiplier: 2.05059285721,
      physFixed: 265.739922357,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 1.483296,
      attributeMultiplier: 2.224945,
      physFixed: 330.4793,
      attributeFixed: 0,
    },
  }),
  freeMorphLarge: mysticTierRows({
    5: {
      physMultiplier: 1.35215406563,
      attributeMultiplier: 2.02823109845,
      physFixed: 166.8,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 1.4342834,
      attributeMultiplier: 2.1514251,
      physFixed: 225.90800000000002,
      attributeFixed: 0,
    },
  }),
  freeMorphSmall: mysticTierRows({
    5: {
      physMultiplier: 0.811292439378,
      attributeMultiplier: 1.21693865907,
      physFixed: 100.08,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 0.8605700399999999,
      attributeMultiplier: 1.29085506,
      physFixed: 135.54479999999998,
      attributeFixed: 0,
    },
  }),
  poetFinalHit: mysticTierRows({
    5: {
      physMultiplier: 1.60821970495,
      attributeMultiplier: 2.41232955743,
      physFixed: 198.275,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 1.705588,
      attributeMultiplier: 2.558382,
      physFixed: 268.184,
      attributeFixed: 0,
    },
  }),
  poetStrike: mysticTierRows({
    5: {
      physMultiplier: 0.964931822971,
      attributeMultiplier: 1.44739773446,
      physFixed: 118.965,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 1.023353,
      attributeMultiplier: 1.535029,
      physFixed: 160.9104,
      attributeFixed: 0,
    },
  }),
  smolderDot: mysticTierRows({
    6: {
      physMultiplier: 0.235818,
      attributeMultiplier: 0.353727,
      physFixed: 37.6455,
      attributeFixed: 0,
    },
  }),
  smolderExplosion: mysticTierRows({
    5: {
      physMultiplier: 1.5163214361,
      attributeMultiplier: 2.27448215415,
      physFixed: 186.945,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 1.608126,
      attributeMultiplier: 2.412189,
      physFixed: 252.8592,
      attributeFixed: 0,
    },
  }),
  soaringFirst: mysticTierRows({
    5: {
      physMultiplier: 3.01348427461,
      attributeMultiplier: 4.52022641192,
      physFixed: 371.7,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 3.196543,
      attributeMultiplier: 4.794815,
      physFixed: 504.027,
      attributeFixed: 0,
    },
  }),
  soaringSecond: mysticTierRows({
    5: {
      physMultiplier: 3.68314744675,
      attributeMultiplier: 5.52472117012,
      physFixed: 454.3,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 3.906886,
      attributeMultiplier: 5.860329,
      physFixed: 616.033,
      attributeFixed: 0,
    },
  }),
  toadFinisher: mysticTierRows({
    5: {
      physMultiplier: 3.059256,
      attributeMultiplier: 4.588884,
      physFixed: 377.28,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 3.244011,
      attributeMultiplier: 4.866017,
      physFixed: 509.5968,
      attributeFixed: 0,
    },
  }),
  toadFuryFinisher: mysticTierRows({
    6: {
      physMultiplier: 3.060433,
      attributeMultiplier: 4.59065,
      physFixed: 484.9404,
      attributeFixed: 0,
    },
  }),
  toadFuryHitFinisher: mysticTierRows({
    6: {
      physMultiplier: 3.978563,
      attributeMultiplier: 5.967845,
      physFixed: 630.4225,
      attributeFixed: 0,
    },
  }),
  toadFuryStrike: mysticTierRows({
    6: {
      physMultiplier: 0.510072,
      attributeMultiplier: 0.765108,
      physFixed: 80.8234,
      attributeFixed: 0,
    },
  }),
  toadPoisonDot: mysticTierRows({
    5: {
      physMultiplier: 1.529628,
      attributeMultiplier: 2.294442,
      physFixed: 188.64,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 1.622006,
      attributeMultiplier: 2.433009,
      physFixed: 254.7984,
      attributeFixed: 0,
    },
  }),
  toadPoisonFuryDot: mysticTierRows({
    6: {
      physMultiplier: 1.530217,
      attributeMultiplier: 2.295325,
      physFixed: 242.4702,
      attributeFixed: 0,
    },
  }),
  toadStrike: mysticTierRows({
    5: {
      physMultiplier: 0.509876,
      attributeMultiplier: 0.764814,
      physFixed: 62.88,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 0.540669,
      attributeMultiplier: 0.811003,
      physFixed: 84.9328,
      attributeFixed: 0,
    },
  }),
  wolflikeFrenzyLarge: mysticTierRows({
    5: {
      physMultiplier: 1.28237006563,
      attributeMultiplier: 1.92355509845,
      physFixed: 158.2,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 1.3603122,
      attributeMultiplier: 2.0404683,
      physFixed: 214.29200000000003,
      attributeFixed: 0,
    },
  }),
  wolflikeFrenzySmall: mysticTierRows({
    5: {
      physMultiplier: 0.961777549223,
      attributeMultiplier: 1.44266632383,
      physFixed: 118.65,
      attributeFixed: 0,
    },
    6: {
      physMultiplier: 1.02023415,
      attributeMultiplier: 1.530351225,
      physFixed: 160.719,
      attributeFixed: 0,
    },
  }),
})
