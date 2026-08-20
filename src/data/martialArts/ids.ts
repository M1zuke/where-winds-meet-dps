export const MARTIAL_ART_ID = {
  strategicSword: "strategicSword",
  heavenquakerSpear: "heavenquakerSpear",
  snowpartingBlade: "snowpartingBlade",
  phalanxbaneBlade: "phalanxbaneBlade",
  namelessSword: "namelessSword",
  namelessSpear: "namelessSpear",
  vernalUmbrella: "vernalUmbrella",
  inkwellFan: "inkwellFan",
} as const

export type MartialArtId = (typeof MARTIAL_ART_ID)[keyof typeof MARTIAL_ART_ID]
