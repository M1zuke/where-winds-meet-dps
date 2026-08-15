export const MARTIAL_ART_ID = {
  strategicSword: "strategicSword",
  heavenquakerSpear: "heavenquakerSpear",
  snowpartingBlade: "snowpartingBlade",
  phalanxbaneBlade: "phalanxbaneBlade",
} as const

export type MartialArtId = (typeof MARTIAL_ART_ID)[keyof typeof MARTIAL_ART_ID]
