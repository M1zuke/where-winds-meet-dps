export const DIVINECRAFT_ELEMENTS = ["fire", "water", "poison"] as const

export type DivinecraftElement = (typeof DIVINECRAFT_ELEMENTS)[number]

export type RefinementBuff = "heartPoison" | "temperedFire" | "nourishingWater"

export const DIVINECRAFT_REFINEMENT_IDS = [
  "cinderAsh",
  "scorchingFlame",
  "deepPool",
  "vastOcean",
  "vipersFire",
  "condensedMalice",
] as const

export type DivinecraftRefinementId = (typeof DIVINECRAFT_REFINEMENT_IDS)[number]

interface DivinecraftRefinement {
  id: DivinecraftRefinementId
  element: DivinecraftElement
  buff: RefinementBuff
}

export const DIVINECRAFT_REFINEMENTS: readonly DivinecraftRefinement[] = [
  { id: "cinderAsh", element: "fire", buff: "heartPoison" },
  { id: "scorchingFlame", element: "fire", buff: "nourishingWater" },
  { id: "deepPool", element: "water", buff: "temperedFire" },
  { id: "vastOcean", element: "water", buff: "heartPoison" },
  { id: "vipersFire", element: "poison", buff: "temperedFire" },
  { id: "condensedMalice", element: "poison", buff: "nourishingWater" },
]

// In-game values as of 2026-10-18.
export const HEART_POISON_QI_DAMAGE_BOOST = 0.04
export const TEMPERED_FIRE_ALL_DAMAGE_BOOST = 0.004

interface DivinecraftSelection {
  divinecraft: DivinecraftElement | null
  divinecraftRefinement?: DivinecraftRefinementId | null
}

export function refinementsOf(element: DivinecraftElement | null): DivinecraftRefinement[] {
  return DIVINECRAFT_REFINEMENTS.filter((refinement) => refinement.element === element)
}

export function appliedRefinement(inputs: DivinecraftSelection): DivinecraftRefinement | null {
  if (!inputs.divinecraft || !inputs.divinecraftRefinement) return null
  const refinement = DIVINECRAFT_REFINEMENTS.find(
    (candidate) => candidate.id === inputs.divinecraftRefinement,
  )
  return refinement?.element === inputs.divinecraft ? refinement : null
}
