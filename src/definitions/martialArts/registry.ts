import { MARTIAL_ARTS } from "../../data/martialArts"
import type { MartialArtDef } from "./martialArtDef"

export { MARTIAL_ARTS }

export function martialArtDefinition(id: string): MartialArtDef | undefined {
  return MARTIAL_ARTS.find((def) => def.id === id)
}

export function martialArtName(id: string): string {
  return martialArtDefinition(id)?.name ?? id
}
